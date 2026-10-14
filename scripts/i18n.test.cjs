const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const i18next = require('i18next');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { I18nextProvider } = require('react-i18next');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const config = require('../next-i18next.config');
const dictionaries = Object.fromEntries(
	config.i18n.locales.map((l) => [l, require(`../public/locales/${l}/common.json`)]),
);
for (const ext of ['.ts', '.tsx'])
	require.extensions[ext] = (module, filename) => {
		module._compile(
			ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
				compilerOptions: {
					module: ts.ModuleKind.CommonJS,
					jsx: ts.JsxEmit.React,
					esModuleInterop: true,
					target: ts.ScriptTarget.ES2020,
				},
			}).outputText,
			filename,
		);
	};
const { localeTag, messageKey } = require('../libs/i18n.ts');
const { default: Calendar } = require('../libs/components/attendance/AttendanceCalendar.tsx');
const { default: SaleCards } = require('../libs/components/sale/SaleCards.tsx');
const { default: QueryState } = require('../libs/components/common/QueryState.tsx');
const { money } = require('../libs/product.ts');
async function instance(language) {
	const i18n = i18next.createInstance();
	await i18n.init({
		...config,
		lng: language,
		ns: ['common'],
		defaultNS: 'common',
		resources: Object.fromEntries(Object.entries(dictionaries).map(([l, common]) => [l, { common }])),
	});
	return i18n;
}
async function render(language, element) {
	const i18n = await instance(language);
	return renderToStaticMarkup(
		React.createElement(
			RouterContext.Provider,
			{ value: { locale: language, pathname: '/mypage', query: {}, asPath: '/mypage' } },
			React.createElement(I18nextProvider, { i18n }, element),
		),
	);
}
test('every locale resolves every key without falling back to Uzbek; parameters remain intact', async () => {
	for (const language of config.i18n.locales) {
		const i18n = await instance(language);
		for (const [key, value] of Object.entries(dictionaries[language])) assert.equal(i18n.t(key), value);
		assert.ok(i18n.t('Savatcha: {{count}} ta mahsulot', { count: 18 }).includes('18'));
		assert.ok(i18n.t('{{name}} davomati', { name: 'Alex' }).includes('Alex'));
	}
});
test('calendar, status labels and sale receipts render in each selected locale during SSR', async () => {
	const sale = {
		_id: '123456abcdef',
		saleStatus: 'PENDING',
		clientName: 'Alex',
		paymentMethod: 'CASH',
		createdAt: '2026-10-13T06:00:00Z',
		totalAmount: 35000,
		items: [],
		clientId: 'client',
	};
	for (const language of config.i18n.locales) {
		const calendar = await render(
			language,
			React.createElement(Calendar, {
				month: '2026-10',
				today: '2026-10-15',
				days: [
					{ attendanceDate: '2026-10-01', attendanceStatus: 'APPROVED' },
					{ attendanceDate: '2026-10-02', attendanceStatus: 'ABSENT' },
					{ attendanceDate: '2026-10-03', attendanceStatus: 'PENDING' },
				],
			}),
		);
		for (const key of ['Dush', 'Kelgan', 'Kelmagan', 'Kutilmoqda', 'Oylik davomat kalendari'])
			assert.ok(calendar.includes(dictionaries[language][key]), `${language}: ${key}`);
		const receipt = await render(
			language,
			React.createElement(SaleCards, { sales: [sale], action: () => {}, actionLabel: 'Bekor qilish' }),
		);
		assert.ok(receipt.includes(dictionaries[language]['Bekor qilish']));
		assert.ok(receipt.includes('MuiButton-containedError'), `${language}: cancellation keeps its error colour`);
		assert.ok(receipt.includes(dictionaries[language]['Naqd']));
		assert.ok(receipt.includes('Alex'));
		if (language !== 'uz') assert.ok(!receipt.includes('Mijoz:'));
	}
});
test('quantity errors preserve values and locale formatting keeps UZS without conversion', () => {
	assert.deepEqual(messageKey('Minimal miqdor: 0.001.'), {
		key: 'Minimal miqdor: {{value}}.',
		values: { value: '0.001' },
	});
	assert.deepEqual(messageKey('Miqdor qadami: 2.'), { key: 'Miqdor qadami: {{value}}.', values: { value: '2' } });
	for (const language of config.i18n.locales) {
		const formatted = money(4000000000, localeTag(language));
		assert.ok(formatted.includes('4'));
		assert.ok(!formatted.includes('NaN'));
	}
	assert.equal(localeTag('kr'), 'ko-KR');
});

test('Russian counts use singular, few and many forms; unknown errors use translated fallback', async () => {
	const i18n = await instance('ru');
	assert.equal(i18n.t('{{count}} ta mahsulot', { count: 1 }), '1 товар');
	assert.equal(i18n.t('{{count}} ta mahsulot', { count: 2 }), '2 товара');
	assert.equal(i18n.t('{{count}} ta mahsulot', { count: 5 }), '5 товаров');
	for (const language of config.i18n.locales) {
		const error = await render(language, React.createElement(QueryState, { error: new Error('Unknown server detail') }));
		assert.ok(error.includes(dictionaries[language]['Amal bajarilmadi. Qayta urinib ko‘ring.']));
		assert.ok(!error.includes('Unknown server detail'));
	}
});
