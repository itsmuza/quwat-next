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
const { ApolloProvider } = require('@apollo/client');
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const { I18nextProvider } = require('react-i18next');
const { userVar, sessionVar, emptyUser } = require('../apollo/store.ts');
const cart = require('../libs/cart.ts');
const CartMenu = require('../libs/components/cart/CartMenu.tsx').default;
const owner = '507f1f77bcf86cd799439011';
const fixture = (index = 1) => ({
	_id: String(index).padStart(24, '0'),
	productName: `Mahsulot ${index}`,
	productImages: [],
	productStatus: 'ACTIVE',
	productUnit: 'DONA',
	productPrice: 25000,
	productQuantity: 10,
	productReservedQuantity: 0,
	productMinOrderQuantity: 1,
	productQuantityStep: 1,
});
const pause = () => new Promise((resolve) => setTimeout(resolve, 25));
async function flush(action = () => {}) {
	await act(async () => {
		action();
		await pause();
	});
}
async function setup(options = {}) {
	localStorage.clear();
	userVar({ ...emptyUser, _id: owner, memberType: 'CLIENT', memberStatus: 'ACTIVE' });
	sessionVar({ status: 'authenticated', error: '' });
	cart.activateCart(owner);
	const products = options.products || [fixture()];
	cart.cartVar({ ...cart.cartVar(), lines: products.map((p) => ({ productId: p._id, product: p, quantity: '1' })) });
	const requests = [];
	const client = {
		query: async ({ variables }) => ({ data: { getProduct: products.find((p) => p._id === variables.productId) } }),
		getObservableQueries: () => new Map(),
		refetchQueries: async () => [],
		mutate: async ({ variables }) => {
			requests.push(structuredClone(variables.input));
			if (options.failFirst && requests.length === 1) throw new Error('offline');
			return {
				data: {
					requestSale: {
						_id: '507f1f77bcf86cd799439022',
						clientId: owner,
						requestKey: variables.input.requestKey,
						totalAmount: variables.input.expectedTotal,
						saleStatus: 'PENDING',
					},
				},
			};
		},
	};
	const i18n = require('i18next').createInstance();
	const locale = options.locale || 'uz';
	await i18n.init({
		lng: locale,
		ns: ['common'],
		defaultNS: 'common',
		keySeparator: false,
		nsSeparator: false,
		resources: { [locale]: { common: require(`../public/locales/${locale}/common.json`) } },
	});
	const root = createRoot(document.getElementById('test-root'));
	const router = {
		pathname: '/product',
		asPath: '/product',
		locale,
		query: {},
		prefetch: async () => {},
		push: async () => {},
	};
	await flush(() =>
		root.render(
			React.createElement(
				RouterContext.Provider,
				{ value: router },
				React.createElement(
					I18nextProvider,
					{ i18n },
					React.createElement(
						ApolloProvider,
						{ client },
						React.createElement(ThemeProvider, { theme: createTheme() }, React.createElement(CartMenu)),
					),
				),
			),
		),
	);
	const trigger = () => document.querySelector('.quwat-navbar-cart');
	const open = async () => {
		await flush(() => {
			trigger().focus();
			Simulate.click(trigger());
		});
		await flush();
	};
	const close = () => document.querySelector('.quwat-cart-header [aria-label="Savatchani yopish"]');
	const cleanup = async () => {
		await flush(() => root.unmount());
		client.stop?.();
	};
	return { requests, i18n, trigger, open, close, cleanup };
}

test('drawer closes with X, backdrop and Escape; restores focus and retains cart contents', async () => {
	const ui = await setup();
	try {
		for (const mode of ['close', 'backdrop', 'escape']) {
			await ui.open();
			assert.equal(document.querySelector('[role="dialog"]').getAttribute('aria-modal'), 'true');
			assert.equal(document.body.style.overflow, 'hidden');
			assert.equal(ui.trigger().getAttribute('aria-expanded'), 'true');
			assert.ok(document.querySelector('[role="dialog"]').contains(document.activeElement));
			await flush(() =>
				mode === 'close'
					? Simulate.click(ui.close())
					: mode === 'backdrop'
					? Simulate.click(document.querySelector('.quwat-cart-backdrop'))
					: Simulate.keyDown(document.querySelector('.MuiDrawer-root'), { key: 'Escape', keyCode: 27 }),
			);
			await flush();
			assert.equal(Boolean(document.querySelector('[role="dialog"]')), false);
			assert.ok(document.activeElement === ui.trigger(), 'focus returns to navbar cart');
			assert.equal(cart.cartVar().lines.length, 1);
		}
	} finally {
		await ui.cleanup();
	}
});

test('quantity controls update totals, respect stock limits, and removal displays an empty disabled cart', async () => {
	const ui = await setup();
	try {
		await ui.open();
		const quantity = () => document.querySelector('input[type="number"]');
		await flush(() => Simulate.click(document.querySelector('[aria-label="Mahsulot 1 miqdorini oshirish"]')));
		assert.equal(quantity().value, '2');
		assert.equal(document.querySelector('.quwat-cart-total-amount').textContent.replace(/\D/g, ''), '50000');
		await flush(() => Simulate.click(document.querySelector('[aria-label="Mahsulot 1 miqdorini kamaytirish"]')));
		assert.equal(quantity().value, '1');
		await flush(() => cart.setCartQuantity(fixture()._id, '11'));
		assert.equal(document.querySelector('.quwat-cart-payment').disabled, true);
		assert.ok(document.querySelector('.quwat-cart-item [role="alert"]'));
		await flush(() => cart.setCartQuantity(fixture()._id, '10'));
		assert.equal(document.querySelector('[aria-label="Mahsulot 1 miqdorini oshirish"]').disabled, true);
		await flush(() => Simulate.click(document.querySelector('[aria-label="Mahsulot 1ni savatchadan olib tashlash"]')));
		assert.match(document.querySelector('.quwat-cart-body').textContent, /Savatcha bo‘sh/);
		assert.equal(document.querySelector('.quwat-cart-payment').disabled, true);
	} finally {
		await ui.cleanup();
	}
});

test('unknown payment responses lock editing, retain retry identity after closing, and show success without auto-closing', async () => {
	const ui = await setup({ failFirst: true });
	try {
		await ui.open();
		await flush(() => Simulate.click(document.querySelector('.quwat-cart-methods [value="CARD"]')));
		await flush(() => Simulate.click(document.querySelector('.quwat-cart-payment')));
		await flush();
		assert.ok(cart.cartVar().intent);
		assert.equal(cart.cartVar().intent.paymentMethod, 'CARD');
		assert.equal(document.querySelector('.quwat-cart-clear').disabled, true);
		await flush(() => cart.clearCart());
		assert.equal(cart.cartVar().lines.length, 1, 'unacknowledged request cannot be cleared');
		assert.ok(Array.from(document.querySelectorAll('.quwat-cart-methods button')).every((button) => button.disabled));
		assert.equal(document.querySelector('input[type="number"]').disabled, true);
		assert.match(document.querySelector('.quwat-cart-payment').textContent, /qayta yuborish/);
		await flush(() => Simulate.click(ui.close()));
		await ui.open();
		assert.equal(document.querySelector('.quwat-cart-methods [value="CARD"]').getAttribute('aria-pressed'), 'true');
		await flush(() => Simulate.click(document.querySelector('.quwat-cart-payment')));
		await flush();
		assert.equal(ui.requests.length, 2);
		assert.deepEqual(ui.requests[1], ui.requests[0]);
		assert.equal(cart.cartVar().lines.length, 0);
		assert.ok(document.querySelector('[role="dialog"]'));
		assert.match(document.querySelector('.quwat-cart-body').textContent, /So‘rov agentlarga yuborildi/);
	} finally {
		await ui.cleanup();
	}
});

test('cash is the default and payment choices remain exclusive without allowing an empty selection', async () => {
	const ui = await setup();
	try {
		await ui.open();
		const cash = () => document.querySelector('.quwat-cart-methods [value="CASH"]');
		const card = () => document.querySelector('.quwat-cart-methods [value="CARD"]');
		assert.equal(cash().getAttribute('aria-pressed'), 'true');
		assert.equal(card().getAttribute('aria-pressed'), 'false');
		await flush(() => Simulate.click(card()));
		assert.equal(cash().getAttribute('aria-pressed'), 'false');
		assert.equal(card().getAttribute('aria-pressed'), 'true');
		await flush(() => Simulate.click(card()));
		assert.equal(card().getAttribute('aria-pressed'), 'true');
		await flush(() => Simulate.click(cash()));
		assert.equal(cash().getAttribute('aria-pressed'), 'true');
		assert.equal(card().getAttribute('aria-pressed'), 'false');
		assert.equal(document.querySelectorAll('.quwat-cart-footer-actions > *').length, 2);
		assert.ok(document.querySelector('.quwat-cart-footer-actions').lastElementChild.matches('.quwat-cart-payment'));
	} finally {
		await ui.cleanup();
	}
});

test('clear cart removes every line from state and storage and remains empty after reopening', async () => {
	const ui = await setup({ products: [fixture(1), fixture(2)] });
	try {
		await ui.open();
		const clear = () => document.querySelector('.quwat-cart-clear');
		assert.equal(clear().disabled, false);
		assert.ok(clear().querySelector('svg'), 'clear action includes its icon');
		await flush(() => cart.cartVar({ ...cart.cartVar(), submitting: true }));
		assert.equal(clear().disabled, true);
		await flush(() => cart.clearCart());
		assert.equal(cart.cartVar().lines.length, 2, 'submitting cart cannot be cleared');
		await flush(() => cart.cartVar({ ...cart.cartVar(), submitting: false }));
		await flush(() => Simulate.click(clear()));
		assert.equal(cart.cartVar().lines.length, 0);
		assert.deepEqual(JSON.parse(localStorage.getItem(cart.cartKey(owner))).items, []);
		assert.equal(clear().disabled, true);
		assert.equal(document.querySelector('.quwat-cart-payment').disabled, true);
		assert.match(document.querySelector('.quwat-cart-body').textContent, /Savatcha bo‘sh/);
		await flush(() => Simulate.click(ui.close()));
		await flush(() => cart.activateCart(owner));
		await ui.open();
		assert.equal(cart.cartVar().lines.length, 0);
		assert.equal(ui.requests.length, 0, 'clearing never submits a sale');
	} finally {
		await ui.cleanup();
	}
});

test('long lists stay in the body and translated loading/empty states preserve the separate summary footer', async () => {
	for (const locale of ['uz', 'en', 'ru', 'kr']) {
		const products = Array.from({ length: 20 }, (_, i) => ({
			...fixture(i + 1),
			productName: 'Mahsulot uzun nomi '.repeat(5) + i,
			productPrice: 3500000000,
		}));
		const ui = await setup({ locale, products });
		try {
			await ui.open();
			assert.equal(document.querySelectorAll('.quwat-cart-body .quwat-cart-item').length, 20);
			assert.equal(Boolean(document.querySelector('.quwat-cart-body .quwat-cart-footer')), false);
			assert.ok(document.querySelector('.quwat-cart-panel > .quwat-cart-footer'));
			await flush(() => cart.cartVar({ ...cart.cartVar(), ready: false }));
			assert.equal(document.querySelector('.quwat-cart-payment').disabled, true);
			assert.match(
				document.querySelector('.quwat-cart-body').textContent,
				new RegExp(ui.i18n.t('Savatcha yuklanmoqda…')),
			);
			await flush(() => cart.cartVar({ ...cart.cartVar(), ready: true, lines: [] }));
			assert.ok(
				document
					.querySelector('.quwat-cart-body')
					.textContent.includes(ui.i18n.t('Savatcha bo‘sh. Katalogdan mahsulot tanlang.')),
			);
		} finally {
			await ui.cleanup();
		}
	}
});
