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
// Mount the real pages with isolated API responses; omit only the public outer layout.
const Module = require('node:module');
const load = Module._load;
let MyPage, AdminProducts;
try {
	Module._load = function (request, parent, ...args) {
		if (request.endsWith('/layout/LayoutBasic')) return { __esModule: true, default: (Component) => Component };
		return load.call(this, request, parent, ...args);
	};
	MyPage = require('../pages/mypage/index.tsx').default;
	AdminProducts = require('../pages/_admin/products/index.tsx').default;
} finally {
	Module._load = load;
}
async function flush(action = () => {}) {
	await act(async () => {
		action();
		await new Promise((resolve) => setTimeout(resolve, 15));
	});
}
async function setup(role, category = 'myProfile', products = false) {
	userVar({
		...emptyUser,
		_id: '507f1f77bcf86cd799439011',
		memberType: role,
		memberStatus: 'ACTIVE',
		memberNick: 'tester',
	});
	sessionVar({ status: 'authenticated', error: '' });
	const queries = [],
		redirects = [];
	const client = new ApolloClient({
		cache: new InMemoryCache(),
		link: new ApolloLink(
			(operation) =>
				new Observable((observer) => {
					queries.push(operation.operationName);
					const field = {
						GetMySales: 'getMySales',
						GetSavedProducts: 'getSavedProducts',
						GetFavorites: 'getFavorites',
						GetVisited: 'getVisited',
						GetAllProductsByAdmin: 'getAllProductsByAdmin',
						GetAttendanceNotifications: 'getAttendanceNotifications',
					}[operation.operationName];
					if (!field) {
						observer.error(new Error('Unexpected operation: ' + operation.operationName));
						return;
					}
					observer.next({ data: { [field]: { list: [], metaCounter: [{ total: 0 }] } } });
					observer.complete();
				}),
		),
	});
	const i18n = require('i18next').createInstance();
	await i18n.init({
		lng: 'uz',
		ns: ['common'],
		defaultNS: 'common',
		resources: { uz: { common: require('../public/locales/uz/common.json') } },
	});
	const router = {
		locale: 'uz',
		pathname: products ? '/_admin/products' : '/mypage',
		asPath: '/mypage',
		query: { category },
		isReady: true,
		replace: (...args) => {
			redirects.push(args);
			return Promise.resolve(true);
		},
		push: async () => true,
		prefetch: async () => {},
	};
	const root = createRoot(document.getElementById('test-root'));
	const render = () =>
		root.render(
			React.createElement(
				RouterContext.Provider,
				{ value: { ...router } },
				React.createElement(
					I18nextProvider,
					{ i18n },
					React.createElement(
						ApolloProvider,
						{ client },
						React.createElement(
							ThemeProvider,
							{ theme: createTheme() },
							React.createElement(products ? AdminProducts : MyPage),
						),
					),
				),
			),
		);
	await flush(render);
	await flush();
	return {
		queries,
		redirects,
		async navigate(category) {
			router.query = { category };
			await flush(render);
			await flush();
		},
		async cleanup() {
			await flush(() => root.unmount());
			client.stop();
		},
	};
}

test('admin personal navigation contains only Profile and Catalog management', async () => {
	const ui = await setup('ADMIN');
	try {
		const links = [...document.querySelectorAll('.quwat-side a')];
		assert.deepEqual(
			links.map((a) => a.textContent),
			['Profil', 'Katalog boshqaruvi'],
		);
		assert.equal(links[1].getAttribute('href'), '/_admin/products');
		assert.ok(document.querySelector('#my-profile-page'));
		assert.deepEqual(ui.queries, []);
		assert.deepEqual(ui.redirects, []);
	} finally {
		await ui.cleanup();
	}
});

test('old admin favorites/visited URLs render Profile and redirect without sending activity queries', async () => {
	for (const category of ['myFavorites', 'recentlyVisited']) {
		const ui = await setup('ADMIN', category);
		try {
			assert.ok(document.querySelector('#my-profile-page'));
			assert.deepEqual(ui.queries, []);
			assert.equal(ui.redirects.length, 1);
			assert.deepEqual(ui.redirects[0], ['/mypage', undefined, { shallow: true, scroll: false }]);
			assert.equal(document.querySelector('.quwat-side [aria-current="page"]').textContent, 'Profil');
		} finally {
			await ui.cleanup();
		}
	}
});

test('client and agent favorites/visited remain available and send their existing queries', async () => {
	for (const role of ['CLIENT', 'AGENT']) {
		for (const [category, operation] of [
			['myFavorites', 'GetFavorites'],
			['recentlyVisited', 'GetVisited'],
		]) {
			const ui = await setup(role, category);
			try {
				const labels = [...document.querySelectorAll('.quwat-side a')].map((a) => a.textContent);
				assert.ok(labels.includes('Yoqtirilganlar'));
				assert.ok(labels.includes('Yaqinda ko‘rilganlar'));
				assert.ok(!labels.includes('Katalog boshqaruvi'));
				assert.ok(labels.includes(role === 'CLIENT' ? 'Saqlanganlar' : 'Davomat'));
				assert.deepEqual(ui.queries, [operation]);
				assert.deepEqual(ui.redirects, []);
			} finally {
				await ui.cleanup();
			}
		}
	}
});

test('shared admin toolbar has the return arrow before language/account controls and no catalog-heading duplicate', async () => {
	const ui = await setup('ADMIN', 'myProfile', true);
	try {
		const back = document.querySelector('[aria-label="Shaxsiy bo‘limga qaytish"]');
		assert.equal(back.tagName, 'A');
		assert.equal(back.getAttribute('href'), '/mypage');
		assert.ok(back.querySelector('[data-testid="ArrowBackIcon"]'));
		const toolbar = document.querySelector('.quwat-admin-bar .MuiToolbar-root');
		assert.ok(toolbar.contains(back));
		const language = toolbar.querySelector('[aria-label="Til tanlash"]');
		assert.ok(back.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_FOLLOWING);
		assert.ok(toolbar.querySelector('[aria-label="Hisob menyusi"]'));
		assert.equal(document.querySelector('.quwat-page [aria-label="Shaxsiy bo‘limga qaytish"]'), null);
		assert.deepEqual(ui.queries, ['GetAttendanceNotifications', 'GetAllProductsByAdmin']);
		const bell = toolbar.querySelector('.quwat-navbar-notifications');
		assert.ok(bell);
		assert.ok(bell.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_FOLLOWING);
	} finally {
		await ui.cleanup();
	}
});

test('account sections never retain the height of a previously tall purchases panel', async () => {
	const ui = await setup('CLIENT', 'orders');
	try {
		const panel = document.querySelector('#my-page > section');
		panel.getBoundingClientRect = () => ({ height: 6000, width: 900, top: 0, bottom: 6000, left: 0, right: 900 });
		for (const category of ['myProfile', 'myFavorites', 'saved', 'recentlyVisited', 'orders', 'myProfile']) {
			const link = document.querySelector('.quwat-side a[href="/mypage?category=' + category + '"]');
			await flush(() => Simulate.click(link, { button: 0, preventDefault() {} }));
			await ui.navigate(category);
			const current = document.querySelector('#my-page > section');
			assert.equal(current.style.getPropertyValue('--quwat-panel-min-height'), '');
			assert.equal(current.style.minHeight, '');
			assert.equal(
				document.querySelector('.quwat-side [aria-current="page"]').getAttribute('href'),
				'/mypage?category=' + category,
			);
		}
		assert.ok(document.querySelector('#my-profile-page'));
	} finally {
		await ui.cleanup();
	}
});
