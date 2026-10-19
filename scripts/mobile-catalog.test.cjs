const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const ts = require('typescript');
const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true,
});
for (const name of [
	'window',
	'document',
	'navigator',
	'HTMLElement',
	'Element',
	'Node',
	'DocumentFragment',
	'localStorage',
	'Image',
])
	Object.defineProperty(global, name, { configurable: true, value: name === 'window' ? dom.window : dom.window[name] });
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.self = dom.window;
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(global, 'crypto', { configurable: true, value: require('node:crypto').webcrypto });
window.matchMedia = () => ({
	matches: true,
	addListener() {},
	removeListener() {},
	addEventListener() {},
	removeEventListener() {},
});
for (const ext of ['.ts', '.tsx'])
	require.extensions[ext] = (module, file) =>
		module._compile(
			ts.transpileModule(fs.readFileSync(file, 'utf8'), {
				compilerOptions: {
					module: ts.ModuleKind.CommonJS,
					target: ts.ScriptTarget.ES2020,
					jsx: ts.JsxEmit.React,
					esModuleInterop: true,
				},
			}).outputText,
			file,
		);
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act, Simulate } = require('react-dom/test-utils');
const { ApolloProvider, ApolloClient, InMemoryCache, ApolloLink, Observable } = require('@apollo/client');
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const { I18nextProvider } = require('react-i18next');
const { userVar, sessionVar, emptyUser } = require('../apollo/store.ts');

const requireApollo = require('@apollo/client');
const Module = require('node:module');
const originalLoad = Module._load;
let Catalog;
try {
	Module._load = function (request, ...args) {
		if (request.endsWith('/layout/LayoutBasic')) return { __esModule: true, default: (Component) => Component };
		if (request === '@apollo/client')
			return {
				...requireApollo,
				useQuery: () => ({
					data: { getProducts: { list: [], metaCounter: [{ total: 0 }] } },
					loading: false,
					refetch: async () => {},
				}),
			};
		return originalLoad.call(this, request, ...args);
	};
	Catalog = require('../pages/product/index.tsx').default;
} finally {
	Module._load = originalLoad;
}
async function flush(action = () => {}) {
	await act(async () => {
		action();
		await new Promise((resolve) => setTimeout(resolve, 10));
	});
}
async function setup() {
	sessionVar({ status: 'anonymous', error: '' });
	const pushes = [];
	const initial = {
		page: 2,
		limit: 18,
		sort: 'productPrice',
		direction: 'ASC',
		search: { unitList: ['METR'], brandList: ['Quwat'], inStock: true, text: 'old' },
	};
	const router = {
		locale: 'uz',
		pathname: '/product',
		asPath: '/product',
		isReady: true,
		query: { input: JSON.stringify(initial) },
		prefetch: async () => {},
		push: async (value) => {
			pushes.push(value);
			return true;
		},
	};
	const i18n = require('i18next').createInstance();
	await i18n.init({
		lng: 'uz',
		ns: ['common'],
		defaultNS: 'common',
		resources: { uz: { common: require('../public/locales/uz/common.json') } },
	});
	const root = createRoot(document.getElementById('test-root'));
	await flush(() =>
		root.render(
			React.createElement(
				RouterContext.Provider,
				{ value: router },
				React.createElement(
					I18nextProvider,
					{ i18n },
					React.createElement(ThemeProvider, { theme: createTheme() }, React.createElement(Catalog)),
				),
			),
		),
	);
	return { pushes, initial, cleanup: () => flush(() => root.unmount()) };
}
test('mobile category and name search preserve active filters, sorting and 18-item pagination', async () => {
	const ui = await setup();
	try {
		const category = document.querySelector('.quwat-mobile-category-chips button:nth-child(2)');
		await flush(() => Simulate.click(category));
		const selected = JSON.parse(ui.pushes.pop().query.input);
		assert.deepEqual(selected, { ...ui.initial, page: 1, search: { ...ui.initial.search, typeList: ['ASBOBLAR'] } });
		const input = document.getElementById('catalog-mobile-search');
		await flush(() => Simulate.change(input, { target: { value: '  qulf  ' } }));
		await flush(() => Simulate.submit(document.querySelector('.quwat-mobile-catalog-search')));
		assert.deepEqual(JSON.parse(ui.pushes.pop().query.input), {
			...ui.initial,
			page: 1,
			search: { ...ui.initial.search, text: 'qulf' },
		});
	} finally {
		await ui.cleanup();
	}
});
test('mobile filter dialog keeps invalid prices open and applies valid filters before closing', async () => {
	const ui = await setup();
	try {
		const button = document.querySelector('.quwat-mobile-catalog-tools > button');
		await flush(() => Simulate.click(button));
		assert.equal(button.getAttribute('aria-expanded'), 'true');
		const dialog = document.querySelector('[role="dialog"]');
		assert.ok(dialog);
		const minimum = dialog.querySelector('input[type="number"]');
		await flush(() => Simulate.change(minimum, { target: { value: '-1' } }));
		await flush(() => Simulate.submit(dialog.querySelector('form')));
		assert.equal(ui.pushes.length, 0);
		assert.match(dialog.textContent, /Narx yoki sana/);
		assert.equal(button.getAttribute('aria-expanded'), 'true');
		await flush(() => Simulate.change(minimum, { target: { value: '1000' } }));
		await flush(() => Simulate.submit(dialog.querySelector('form')));
		const result = JSON.parse(ui.pushes[0].query.input);
		assert.equal(result.limit, 18);
		assert.equal(result.page, 1);
		assert.equal(result.search.pricesRange.start, 1000);
		assert.deepEqual(result.search.unitList, ['METR']);
		assert.equal(button.getAttribute('aria-expanded'), 'false');
	} finally {
		await ui.cleanup();
	}
});
