const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const ts = require('typescript');
const Module = require('module');
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true,
});
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'DocumentFragment']) {
	Object.defineProperty(global, name, { configurable: true, value: name === 'window' ? dom.window : dom.window[name] });
}
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
global.self = dom.window;
global.IntersectionObserver = window.IntersectionObserver = class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
HTMLElement.prototype.getBoundingClientRect = () => ({
	x: 0,
	y: 0,
	top: 0,
	left: 0,
	right: 200,
	bottom: 50,
	width: 200,
	height: 50,
});
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
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const { I18nextProvider } = require('react-i18next');
let reduced = false;
const originalLoad = Module._load;
const actualMotion = require('framer-motion');
const actualApollo = require('@apollo/client');
let shelfResponse = {};
const scrolls = [];
Module._load = function (request, ...args) {
	if (request === '@apollo/client') return { ...actualApollo, useQuery: () => shelfResponse };
	if (request === 'swiper') return {};
	if (request === 'swiper/react')
		return {
			Swiper: ({ children }) => React.createElement('div', null, children),
			SwiperSlide: ({ children }) => React.createElement('div', null, children),
		};
	if (request === 'framer-motion') return { ...actualMotion, useReducedMotion: () => reduced };
	if (request === '@react-three/fiber')
		return {
			Canvas: () =>
				React.createElement('div', {
					className: 'quwat-fiber-scroll',
					ref: (el) => {
						if (el) {
							Object.defineProperty(el, 'clientWidth', { value: 600, configurable: true });
							el.scrollBy = (options) => scrolls.push(options);
						}
					},
				}),
		};
	if (request === '@react-three/drei') return { Preload: () => null };
	if (request === './ScrollControls') return { ScrollControls: () => null, Scroll: () => null };
	return originalLoad.call(this, request, ...args);
};
const Fiber = require('../libs/components/common/FiberContainer.tsx').default;
const HeaderFilter = require('../libs/components/homepage/HeaderFilter.tsx').default;
const CategoryLinks = require('../libs/components/homepage/CategoryLinks.tsx').default;
const ProductShelf = require('../libs/components/homepage/ProductShelf.tsx').default;
Module._load = originalLoad;
const { ProductType } = require('../libs/enums/product.enum.ts');
const { sessionVar } = require('../apollo/store.ts');
async function flush(action = () => {}) {
	await act(async () => {
		action();
		await new Promise((resolve) => setTimeout(resolve, 20));
	});
}
async function mount(Component, locale = 'uz') {
	const pushes = [];
	const i18n = require('i18next').createInstance();
	await i18n.init({
		lng: locale,
		ns: ['common'],
		defaultNS: 'common',
		resources: { [locale]: { common: require(`../public/locales/${locale}/common.json`) } },
	});
	const root = createRoot(document.getElementById('root'));
	await flush(() =>
		root.render(
			React.createElement(
				RouterContext.Provider,
				{
					value: {
						pathname: '/',
						locale,
						query: {},
						prefetch: async () => {},
						push: (value) => {
							pushes.push(value);
							return Promise.resolve(true);
						},
					},
				},
				React.createElement(I18nextProvider, { i18n }, React.createElement(Component)),
			),
		),
	);
	return {
		pushes,
		async cleanup() {
			await flush(() => root.unmount());
		},
	};
}
test('hero search handles empty, trimmed name, category and combined submissions without a unit filter', async () => {
	const ui = await mount(HeaderFilter);
	try {
		const submit = async () => {
			await flush(() => Simulate.submit(document.querySelector('form')));
			return JSON.parse(ui.pushes.at(-1).query.input);
		};
		assert.deepEqual(await submit(), { page: 1, limit: 18, sort: 'createdAt', direction: 'DESC', search: {} });
		await flush(() => Simulate.change(document.querySelector('input'), { target: { value: '  qulf  ' } }));
		assert.deepEqual((await submit()).search, { text: 'qulf' });
		await flush(() => Simulate.mouseDown(document.querySelector('.MuiSelect-select'), { button: 0 }));
		await flush(() =>
			[...document.querySelectorAll('[role="option"]')]
				.find((el) => el.getAttribute('data-value') === 'ASBOBLAR')
				.click(),
		);
		assert.deepEqual((await submit()).search, { text: 'qulf', typeList: ['ASBOBLAR'] });
		await flush(() => Simulate.change(document.querySelector('input'), { target: { value: '   ' } }));
		assert.deepEqual((await submit()).search, { typeList: ['ASBOBLAR'] });
		assert.ok(ui.pushes.every((value) => value.pathname === '/product'));
	} finally {
		await ui.cleanup();
	}
});
test('all seven category links preserve the catalog inquiry and translated labels in every locale', async () => {
	for (const locale of ['uz', 'en', 'ru', 'kr']) {
		const ui = await mount(CategoryLinks, locale);
		try {
			const links = [...document.querySelectorAll('.quwat-category-links a')];
			assert.equal(links.length, 7);
			for (const [index, link] of links.entries()) {
				const url = new URL(link.href);
				assert.equal(url.pathname, '/product');
				assert.deepEqual(JSON.parse(url.searchParams.get('input')), {
					page: 1,
					limit: 18,
					sort: 'createdAt',
					direction: 'DESC',
					search: { typeList: [Object.values(ProductType)[index]] },
				});
				assert.ok(link.textContent.trim());
			}
		} finally {
			await ui.cleanup();
		}
	}
});
test('Fiber advances every three seconds, pauses/resumes, supports arrows and cleans up its timer', async () => {
	const intervals = new Map();
	let nextId = 0;
	const originalSet = window.setInterval,
		originalClear = window.clearInterval;
	window.setInterval = (callback, delay) => {
		assert.equal(delay, 3000);
		intervals.set(++nextId, callback);
		return nextId;
	};
	window.clearInterval = (id) => intervals.delete(id);
	scrolls.length = 0;
	reduced = false;
	const ui = await mount(Fiber);
	try {
		assert.equal(intervals.size, 1);
		intervals.values().next().value();
		assert.equal(scrolls.at(-1).left, 600);
		await flush(() => document.querySelector('[aria-label="Rasmlar almashishini to‘xtatish"]').click());
		assert.equal(intervals.size, 0);
		await flush(() => document.querySelector('[aria-label="Oldingi rasmlar"]').click());
		assert.equal(scrolls.at(-1).left, -600);
		await flush(() => Simulate.keyDown(document.querySelector('[role="region"]'), { key: 'ArrowRight' }));
		assert.equal(scrolls.at(-1).left, 600);
		await flush(() => document.querySelector('[aria-label="Rasmlar almashishini davom ettirish"]').click());
		assert.equal(intervals.size, 1);
	} finally {
		await ui.cleanup();
		assert.equal(intervals.size, 0);
		window.setInterval = originalSet;
		window.clearInterval = originalClear;
	}
});
test('Reduced Motion disables Fiber autoplay while retaining manual controls', async () => {
	reduced = true;
	let timers = 0;
	const original = window.setInterval;
	window.setInterval = () => {
		timers++;
		return 1;
	};
	const ui = await mount(Fiber);
	try {
		assert.equal(timers, 0);
		assert.equal(document.querySelector('[aria-label="Rasmlar almashishini to‘xtatish"]'), null);
		assert.ok(document.querySelector('[aria-label="Keyingi rasmlar"]'));
	} finally {
		await ui.cleanup();
		window.setInterval = original;
		reduced = false;
	}
});

test('homepage shelves distinguish session loading, query loading, empty results and retryable errors', async () => {
	const Shelf = () => React.createElement(ProductShelf, { title: 'Yangi mahsulotlar', sort: 'createdAt' });
	for (const session of ['loading', 'anonymous']) {
		sessionVar({ status: session, error: '' });
		shelfResponse = { loading: session === 'anonymous' };
		const ui = await mount(Shelf);
		try {
			assert.ok(document.querySelector('[role="status"]'));
		} finally {
			await ui.cleanup();
		}
	}
	shelfResponse = { loading: false, data: { getProducts: { list: [], metaCounter: [{ total: 0 }] } } };
	let ui = await mount(Shelf);
	try {
		assert.match(document.body.textContent, /Hozircha mahsulotlar yo‘q/);
		assert.equal(document.querySelector('[role="status"]'), null);
		assert.equal(document.querySelector('.quwat-carousel-pagination').hidden, true);
	} finally {
		await ui.cleanup();
	}
	let retried = 0;
	shelfResponse = {
		error: new Error('Network unavailable'),
		refetch: () => {
			retried++;
		},
	};
	ui = await mount(Shelf);
	try {
		assert.ok(document.querySelector('[role="alert"]'));
		await flush(() =>
			[...document.querySelectorAll('button')].find((el) => el.textContent.includes('Qayta urinish')).click(),
		);
		assert.equal(retried, 1);
	} finally {
		await ui.cleanup();
	}
});
