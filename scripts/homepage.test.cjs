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
			Swiper: ({ children, className }) =>
				React.createElement(
					'div',
					{ className },
					React.createElement('div', { className: 'swiper-wrapper' }, children),
				),
			SwiperSlide: ({ children }) => React.createElement('div', { className: 'swiper-slide' }, children),
		};
	if (request === '../product/ProductCard')
		return {
			__esModule: true,
			default: ({ product }) =>
				React.createElement('a', { href: `/product/detail?id=${product._id}` }, product.productName),
		};
	if (request === '../common/MemberCard')
		return {
			__esModule: true,
			default: ({ member }) =>
				React.createElement('a', { href: `/agent/detail?agentId=${member._id}` }, member.memberNick),
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
const TopAgents = require('../libs/components/homepage/TopAgents.tsx').default;
const HomeNavigation = require('../libs/components/homepage/HomeNavigation.tsx').default;
const { HomeSolutions, HomeServices } = require('../libs/components/homepage/HomeSupport.tsx');
Module._load = originalLoad;
const { ProductType } = require('../libs/enums/product.enum.ts');
const { sessionVar } = require('../apollo/store.ts');
const { userVar, emptyUser } = require('../apollo/store.ts');
async function flush(action = () => {}) {
	await act(async () => {
		action();
		await new Promise((resolve) => setTimeout(resolve, 20));
	});
}
async function mount(Component, locale = 'uz', route = {}) {
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
						asPath: '/',
						locale,
						query: {},
						prefetch: async () => {},
						push: (value) => {
							pushes.push(value);
							return Promise.resolve(true);
						},
						...route,
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

test('hero product total uses the catalog counter and distinguishes unavailable data from an empty catalog', async () => {
	sessionVar({ status: 'anonymous', error: '' });
	for (const [response, expected] of [
		[{ loading: true }, '—'],
		[{ error: new Error('Offline') }, '—'],
		[{ data: { getProducts: { list: [], metaCounter: [] } } }, '0'],
		[{ data: { getProducts: { list: [{}], metaCounter: [{ total: 1234 }] } } }, '1234'],
	]) {
		shelfResponse = response;
		const ui = await mount(Fiber);
		try {
			const values = [...document.querySelectorAll('.quwat-home-hero-facts strong')].map((el) =>
				el.textContent.replace(/\s/g, ''),
			);
			assert.deepEqual(values, [expected, '1000', '15yil']);
		} finally {
			await ui.cleanup();
		}
	}
	shelfResponse = {};
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

test('phone shelf arrows scroll the native container and gesture/resize events update progress and edge controls', async () => {
	sessionVar({ status: 'anonymous', error: '' });
	shelfResponse = {
		data: {
			getProducts: {
				list: Array.from({ length: 4 }, (_, index) => ({ _id: `product-${index}`, productName: `Product ${index}` })),
			},
		},
	};
	const ui = await mount(() => React.createElement(ProductShelf, { title: 'Yangi mahsulotlar', sort: 'createdAt' }));
	try {
		const wrapper = document.querySelector('.swiper-wrapper');
		let width = 300;
		Object.defineProperty(wrapper, 'clientWidth', { configurable: true, get: () => width });
		Object.defineProperty(wrapper, 'scrollWidth', { configurable: true, value: 1200 });
		[...wrapper.children].forEach((slide, index) => Object.defineProperty(slide, 'offsetLeft', { value: index * 312 }));
		const movements = [];
		wrapper.scrollBy = (options) => {
			movements.push(options);
			wrapper.scrollLeft = Math.max(0, Math.min(1200 - width, wrapper.scrollLeft + options.left));
			wrapper.dispatchEvent(new window.Event('scroll'));
		};
		await flush(() => window.dispatchEvent(new window.Event('resize')));
		const previous = document.querySelector('[aria-label="Oldingi mahsulotlar"]');
		const next = document.querySelector('[aria-label="Keyingi mahsulotlar"]');
		const thumb = document.querySelector('.quwat-shelf-scroll-thumb');
		assert.equal(previous.disabled, true);
		assert.equal(next.disabled, false);
		assert.equal(thumb.style.width, '25%');
		await flush(() => next.click());
		assert.equal(movements[0].left, 312);
		assert.equal(wrapper.scrollLeft, 312);
		assert.equal(previous.disabled, false);
		await flush(() => previous.click());
		assert.equal(wrapper.scrollLeft, 0);
		assert.equal(previous.disabled, true);
		await flush(() => {
			wrapper.scrollLeft = 900;
			wrapper.dispatchEvent(new window.Event('scroll'));
		});
		assert.equal(next.disabled, true);
		assert.equal(thumb.style.transform, 'translateX(300%)');
		await flush(() => {
			width = 600;
			wrapper.scrollLeft = 600;
			window.dispatchEvent(new window.Event('resize'));
		});
		assert.equal(thumb.style.width, '50%');
		assert.equal(thumb.style.transform, 'translateX(100%)');
		assert.equal(next.disabled, true);
		assert.equal(document.querySelectorAll('.swiper-slide a').length, 4);
	} finally {
		await ui.cleanup();
		shelfResponse = {};
	}
});

test('agent shelf reuses native scroll controls and hides them for empty and single-agent results', async () => {
	sessionVar({ status: 'anonymous', error: '' });
	for (const count of [0, 1, 4]) {
		shelfResponse = {
			data: {
				getAgents: {
					list: Array.from({ length: count }, (_, index) => ({ _id: `agent-${index}`, memberNick: `Agent ${index}` })),
				},
			},
		};
		const ui = await mount(TopAgents);
		try {
			const controls = document.querySelector('.quwat-mobile-shelf-controls');
			assert.equal(controls.hidden, count < 2);
			assert.equal(document.querySelectorAll('.quwat-agent-grid a').length, count);
			if (count < 2) continue;
			const grid = document.querySelector('.quwat-agent-grid');
			Object.defineProperty(grid, 'clientWidth', { value: 280 });
			Object.defineProperty(grid, 'scrollWidth', { value: 1100 });
			[...grid.children].forEach((card, index) => Object.defineProperty(card, 'offsetLeft', { value: index * 292 }));
			grid.scrollBy = ({ left }) => {
				grid.scrollLeft += left;
				grid.dispatchEvent(new window.Event('scroll'));
			};
			await flush(() => window.dispatchEvent(new window.Event('resize')));
			const next = document.querySelector('[aria-label="Keyingi agentlar"]');
			const previous = document.querySelector('[aria-label="Oldingi agentlar"]');
			assert.equal(next.disabled, false);
			assert.equal(previous.disabled, true);
			await flush(() => next.click());
			assert.equal(grid.scrollLeft, 292);
			assert.equal(previous.disabled, false);
			await flush(() => {
				grid.scrollLeft = 820;
				grid.dispatchEvent(new window.Event('scroll'));
			});
			assert.equal(next.disabled, true);
		} finally {
			await ui.cleanup();
			shelfResponse = {};
		}
	}
});

test('mobile navigation respects role destinations and focuses the existing compact search without submitting', async () => {
	const originalScroll = window.scrollTo;
	window.scrollTo = () => {};
	const Navigation = () =>
		React.createElement(
			React.Fragment,
			null,
			React.createElement(HeaderFilter, { compact: true }),
			React.createElement(HomeNavigation),
		);
	try {
		for (const role of ['anonymous', 'CLIENT', 'AGENT', 'ADMIN']) {
			sessionVar({ status: role === 'anonymous' ? 'anonymous' : 'authenticated', error: '' });
			userVar({
				...emptyUser,
				_id: role === 'anonymous' ? '' : '507f1f77bcf86cd799439011',
				memberType: role === 'anonymous' ? 'CLIENT' : role,
			});
			const ui = await mount(Navigation);
			try {
				const nav = document.querySelector('.quwat-home-bottom-nav');
				const links = [...nav.querySelectorAll('a')];
				assert.equal(links[0].getAttribute('aria-current'), 'page');
				assert.equal(links[1].getAttribute('href'), '/product');
				assert.equal(
					links[2].getAttribute('href'),
					role === 'anonymous' ? '/account/join' : role === 'ADMIN' ? '/agent' : '/mypage?category=myFavorites',
				);
				assert.equal(links[3].getAttribute('href'), role === 'anonymous' ? '/account/join' : '/mypage');
				await flush(() => nav.querySelector('button').click());
				assert.equal(document.activeElement.id, 'home-product-search');
				assert.equal(ui.pushes.length, 0);
			} finally {
				await ui.cleanup();
			}
		}
	} finally {
		window.scrollTo = originalScroll;
	}
});

test('trade shortcuts use the real category API contract and support links expose saved products only to clients', async () => {
	let ui = await mount(HomeSolutions);
	try {
		const links = [...document.querySelectorAll('a')];
		assert.deepEqual(
			links.map((link) => JSON.parse(new URL(link.href).searchParams.get('input')).search.typeList[0]),
			['ELEKTR_MOLLARI', 'SANTEXNIKA'],
		);
	} finally {
		await ui.cleanup();
	}
	for (const role of ['anonymous', 'CLIENT', 'AGENT', 'ADMIN']) {
		sessionVar({ status: role === 'anonymous' ? 'anonymous' : 'authenticated', error: '' });
		userVar({ ...emptyUser, memberType: role === 'anonymous' ? 'CLIENT' : role });
		ui = await mount(HomeServices);
		try {
			const saved = [...document.querySelectorAll('a')].find((link) => link.textContent.includes('Saqlanganlar'));
			if (role === 'ADMIN' || role === 'AGENT') assert.equal(saved, undefined);
			else assert.equal(saved.getAttribute('href'), role === 'CLIENT' ? '/mypage?category=saved' : '/account/join');
		} finally {
			await ui.cleanup();
		}
	}
});

test('mobile navigation marks catalog/profile sections and routes search from other pages', async () => {
	const originalScroll = window.scrollTo;
	window.scrollTo = () => {};
	sessionVar({ status: 'authenticated', error: '' });
	userVar({ ...emptyUser, _id: '507f1f77bcf86cd799439011', memberType: 'CLIENT' });
	try {
		for (const pathname of ['/product', '/about', '/mypage']) {
			const Navigation = () =>
				React.createElement(
					React.Fragment,
					null,
					React.createElement('input', { id: 'catalog-mobile-search' }),
					React.createElement(HomeNavigation),
				);
			const ui = await mount(Navigation, 'uz', { pathname, asPath: pathname });
			try {
				const nav = document.querySelector('.quwat-home-bottom-nav');
				const active = nav.querySelector('[aria-current="page"]');
				assert.equal(active?.getAttribute('href'), pathname === '/about' ? undefined : pathname);
				await flush(() => nav.querySelector('button').click());
				assert.equal(document.activeElement.id, 'catalog-mobile-search');
				assert.deepEqual(ui.pushes, pathname === '/product' ? [] : ['/product']);
			} finally {
				await ui.cleanup();
			}
		}
	} finally {
		window.scrollTo = originalScroll;
	}
});
