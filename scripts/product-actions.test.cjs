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
const { ApolloProvider, ApolloClient, InMemoryCache, ApolloLink, Observable, useQuery } = require('@apollo/client');
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const { I18nextProvider } = require('react-i18next');
const { userVar, sessionVar, emptyUser } = require('../apollo/store.ts');
const cart = require('../libs/cart.ts');
const { GET_PRODUCTS } = require('../apollo/user/product.ts');
const ProductCard = require('../libs/components/product/ProductCard.tsx').default;
const owner = '507f1f77bcf86cd799439011';
const input = { page: 1, limit: 18, search: {} };
const fixture = (saved) => ({
 __typename: 'Product', _id: '507f1f77bcf86cd799439012', productName: 'Mahsulot', productImages: [],
 productType: 'ASBOBLAR', productStatus: 'ACTIVE', productUnit: 'DONA', productPrice: 25000,
 productQuantity: 10, productReservedQuantity: 0, productMinOrderQuantity: 1, productQuantityStep: 1,
 productBrand: null, productDesc: null, productLikes: 1, productViews: 1, productComments: 0,
 productRank: 0, archivedAt: null, createdAt: '2026-10-15', updatedAt: '2026-10-15', meSaved: saved, guestLiked: false, meLiked: [],
});
async function flush(action = () => {}) {
 await act(async () => { action(); await new Promise(resolve => setTimeout(resolve, 15)); });
}
async function setup(saved = false, {locale = 'uz', productOverrides = {}, compact = false, status = 'authenticated'} = {}) {
 userVar(status === 'authenticated' ? { ...emptyUser, _id: owner, memberType: 'CLIENT', memberStatus: 'ACTIVE' } : {...emptyUser});
 sessionVar({ status, error: '' });
 if (status === 'authenticated') cart.activateCart(owner);
 else cart.activateCart('');
 let product = {...fixture(saved), ...productOverrides};
 const requests = [];
 const pending = [];
 const client = new ApolloClient({
  cache: new InMemoryCache({typePolicies: {Product: {keyFields: ['_id'], fields: {meLiked: {merge: false}}}}}),
  link: new ApolloLink(operation => new Observable(observer => {
   requests.push(operation.operationName);
   if (operation.operationName === 'GetProducts') {
    observer.next({data: {getProducts: {list: [product], metaCounter: [{total: 1}]}}});
    observer.complete();
   } else pending.push({operation, observer});
  })),
 });
 client.writeQuery({query: GET_PRODUCTS, variables: {input}, data: {getProducts: {list: [product], metaCounter: [{total: 1}]}}});
 const i18n = require('i18next').createInstance();
 await i18n.init({lng: locale, ns: ['common'], defaultNS: 'common', resources: {[locale]: {common: require(`../public/locales/${locale}/common.json`)}}});
 function Cards() {
  const {data} = useQuery(GET_PRODUCTS, {variables: {input}});
  return React.createElement(React.Fragment, null, ...[1,2].map(key =>
   React.createElement('div', {key, className: 'test-card'}, React.createElement(ProductCard, {product: data.getProducts.list[0], compact}))));
 }
 const root = createRoot(document.getElementById('test-root'));
 await flush(() => root.render(React.createElement(RouterContext.Provider, {value: {locale, pathname: '/product', query: {}}},
  React.createElement(I18nextProvider, {i18n}, React.createElement(ApolloProvider, {client},
   React.createElement(ThemeProvider, {theme: createTheme()}, React.createElement(Cards)))))));
 const bookmarks = () => [...document.querySelectorAll('.quwat-product-bookmark')];
 return {client, requests, pending, bookmarks,
  async settle(error = false) {
   const {operation, observer} = pending.shift();
   await flush(() => {
    if (error) {observer.error(new Error('Save failed')); return;}
    const name = operation.operationName;
    if (name === 'LikeTargetProduct') {
     product = {...product, productLikes: 2, meLiked: [{__typename: 'MeLiked', memberId: owner, likeRefId: product._id, myFavorite: true}]};
     observer.next({data: {likeTargetProduct: product}});
    } else {
     product = {...product, meSaved: name === 'SaveProduct'};
     observer.next({data: {[name === 'SaveProduct' ? 'saveProduct' : 'unsaveProduct']: true}});
    }
    observer.complete();
   });
   await flush();
  },
  async cleanup() {await flush(() => root.unmount()); client.stop();},
 };
}

test('cards preserve full names, large whole-som prices, fractional stock, reservations and product navigation', async () => {
 const name = 'Professional qurilish va ta’mirlash uchun uzoq nomli mahsulot';
 const ui = await setup(false, {productOverrides: {
  productName: name, productBrand: 'Usta professional', productPrice: 3500000000,
  productQuantity: 123.456, productReservedQuantity: 2.125, productUnit: 'METR',
 }});
 try {
  const card = document.querySelector('.quwat-product-card');
  const {money} = require('../libs/product.ts');
  assert.equal(card.querySelector('.quwat-product-price').textContent, money(3500000000, 'uz'));
  assert.ok(!card.querySelector('.quwat-ui-card-content').textContent.includes('1 metr uchun'));
  assert.equal(card.querySelector('[role="heading"]').textContent, name);
  assert.equal(card.querySelector('.quwat-product-brand').textContent, 'Usta professional');
  const quantities = [...card.querySelectorAll('.quwat-product-stock-row strong')].map(el => el.textContent);
  const format = new Intl.NumberFormat('uz', {maximumFractionDigits: 3});
  assert.deepEqual(quantities, [`${format.format(123.456)} metr`, `${format.format(121.331)} metr`]);
  const links = [...card.querySelectorAll('a')];
  assert.equal(links.length, 2);
  assert.ok(links.every(el => el.getAttribute('href') === '/product/detail?id=507f1f77bcf86cd799439012'));
  assert.match(card.querySelector('.quwat-product-image').textContent, /Rasm mavjud emas/);
 } finally {await ui.cleanup();}
});

test('guest cards place a single accessible like outside image navigation and remove the empty footer', async () => {
 for (const compact of [false, true]) {
  const ui = await setup(false, {status: 'anonymous', compact});
  try {
   for (const card of document.querySelectorAll('.quwat-product-card')) {
    const like = card.querySelector('[aria-label="Yoqtirish"]');
    assert.ok(like.closest('.quwat-product-media'));
    assert.equal(like.closest('a'), null, 'liking cannot activate product navigation');
    assert.equal(card.querySelectorAll('[aria-label="Yoqtirish"]').length, 1);
    assert.equal(card.querySelector('.quwat-ui-card-footer'), null);
    assert.equal(card.querySelector('.quwat-product-bookmark'), null);
    assert.equal(card.querySelector('.quwat-cart-add'), null);
    assert.equal(like.disabled, false);
   }
   await flush(() => {
    userVar({...emptyUser, _id: owner, memberType: 'CLIENT', memberStatus: 'ACTIVE'});
    sessionVar({status: 'authenticated', error: ''});
    cart.activateCart(owner);
   });
   for (const card of document.querySelectorAll('.quwat-product-card')) {
    assert.equal(card.querySelector('.quwat-product-guest-like'), null);
    assert.ok(card.querySelector('.quwat-ui-card-footer .quwat-product-like'));
    assert.ok(card.querySelector('.quwat-ui-card-footer .quwat-product-bookmark'));
    assert.ok(card.querySelector('.quwat-ui-card-footer .quwat-cart-add'));
    assert.equal(card.querySelectorAll('[aria-label="Yoqtirish"]').length, 1);
   }
   assert.deepEqual(ui.requests, [], 'a session/layout change performs no mutations');
  } finally {await ui.cleanup();}
 }
});

test('unresolved and failed sessions keep the guest layout without enabling likes or purchase actions', async () => {
 for (const status of ['loading', 'error']) {
  const ui = await setup(false, {status});
  try {
   const card = document.querySelector('.quwat-product-card');
   assert.ok(card.querySelector('.quwat-product-guest-like .quwat-product-like').disabled);
   assert.equal(card.querySelector('.quwat-ui-card-footer'), null);
   assert.equal(card.querySelector('.quwat-product-bookmark'), null);
   assert.equal(card.querySelector('.quwat-cart-add'), null);
   assert.deepEqual(ui.requests, []);
  } finally {await ui.cleanup();}
 }
});

test('archived saved cards retain unsave but never offer product navigation, likes or cart actions', async () => {
 const ui = await setup(true, {productOverrides: {productStatus: 'ARCHIVED'}});
 try {
  const card = document.querySelector('.quwat-product-card');
  assert.equal(card.querySelectorAll('a').length, 0);
  assert.match(card.textContent, /Sotuvda yo‘q/);
  assert.equal(card.querySelector('.quwat-product-like'), null);
  assert.equal(card.querySelector('.quwat-cart-add'), null);
  await flush(() => Simulate.click(ui.bookmarks()[0]));
  assert.equal(ui.pending[0].operation.operationName, 'UnsaveProduct');
  await ui.settle();
 } finally {await ui.cleanup();}
});

test('liking preserves the saved bookmark icon, color and DOM node without a save animation', async () => {
 const ui = await setup(true);
 try {
  const button = ui.bookmarks()[0];
  const color = getComputedStyle(button).color;
  await flush(() => Simulate.click(document.querySelector('[aria-label="Yoqtirish"]')));
  const likeButton = document.querySelector('.quwat-product-like');
  assert.ok(likeButton.classList.contains('quwat-like-feedback'));
  assert.equal(likeButton.getAttribute('aria-busy'), 'true');
  assert.equal(document.querySelector('.quwat-cart-add').disabled, false, 'liking does not dim or disable the independent cart action');
  assert.equal(ui.pending.length, 1);
  assert.equal(ui.pending[0].operation.operationName, 'LikeTargetProduct');
  assert.equal(button.disabled, true);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(getComputedStyle(button).color, color, 'pending disabled state retains its normal color');
  assert.equal(button.classList.contains('quwat-save-feedback'), false);
  assert.ok(button.querySelector('[data-testid="BookmarkIcon"]'));
  await ui.settle();
  assert.equal(likeButton.classList.contains('quwat-like-feedback'), false);
  assert.equal(likeButton.getAttribute('aria-busy'), 'false');
  assert.equal(ui.bookmarks()[0], button, 'button is never replaced');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(getComputedStyle(button).color, color);
 } finally {await ui.cleanup();}
});

test('zero-stock cart warning is localized in all four languages and dismisses after its two-second timer', async () => {
 for (const locale of ['uz', 'en', 'ru', 'kr']) {
  const ui = await setup(false, {locale, productOverrides: {productQuantity: 0}});
  const originalTimer = window.setTimeout;
  const callbacks = [];
  window.setTimeout = (callback, duration, ...args) => {
   if (duration === 2000) callbacks.push(callback);
   return originalTimer.call(window, callback, duration, ...args);
  };
  try {
   const before = cart.cartVar().lines;
   await flush(() => Simulate.click(document.querySelector('.quwat-cart-add')));
   const message = require(`../public/locales/${locale}/common.json`)['Mahsulot omborda mavjud emas!'];
   assert.ok([...document.querySelectorAll('[role="alert"]')].some(el => el.textContent === message), locale);
   assert.equal(callbacks.length, 1, 'warning uses a 2000ms timer');
   assert.deepEqual(cart.cartVar().lines, before, 'out-of-stock click never changes the cart');
   assert.equal(ui.requests.length, 0);
   await flush(() => callbacks[0]());
   assert.ok(![...document.querySelectorAll('[role="alert"]')].some(el => el.textContent === message));
  } finally {
   window.setTimeout = originalTimer;
   await ui.cleanup();
  }
 }
});

test('save and unsave update every copy immediately, show a small feedback cue and prevent duplicate clicks', async () => {
 const ui = await setup();
 try {
  const button = ui.bookmarks()[0];
  await flush(() => {Simulate.click(button); Simulate.click(button);});
  assert.equal(ui.pending.length, 1, 'rapid repeated clicks send one mutation');
  assert.equal(document.querySelector('.quwat-cart-add').disabled, false, 'saving does not dim or disable the independent cart action');
  assert.equal(document.querySelector('.quwat-product-like').classList.contains('quwat-like-feedback'), false);
  assert.ok(button.classList.contains('quwat-save-feedback'));
  assert.equal(button.getAttribute('aria-busy'), 'true');
  assert.ok(ui.bookmarks().every(b => b.getAttribute('aria-pressed') === 'true'), 'optimistic state reaches both cards');
  await ui.settle();
  assert.equal(button.disabled, false);
  assert.equal(button.getAttribute('aria-busy'), 'false');
  assert.ok(ui.bookmarks().every(b => b.getAttribute('aria-pressed') === 'true'));
  await flush(() => Simulate.click(button));
  assert.equal(ui.pending[0].operation.operationName, 'UnsaveProduct');
  assert.ok(ui.bookmarks().every(b => b.getAttribute('aria-pressed') === 'false'));
  await ui.settle();
  assert.ok(ui.bookmarks().every(b => b.getAttribute('aria-pressed') === 'false'));
 } finally {await ui.cleanup();}
});

test('cart action still locks for cart submission and an unacknowledged payment request', async () => {
 const ui = await setup();
 try {
  const button = document.querySelector('.quwat-cart-add');
  assert.equal(button.disabled, false);
  await flush(() => cart.cartVar({...cart.cartVar(), submitting: true}));
  assert.equal(button.disabled, true);
  await flush(() => cart.cartVar({...cart.cartVar(), submitting: false, intent: {requestKey: 'pending'}}));
  assert.equal(button.disabled, true);
  await flush(() => cart.cartVar({...cart.cartVar(), intent: undefined}));
  assert.equal(button.disabled, false);
 } finally {await ui.cleanup();}
});

test('failed save rolls back the optimistic bookmark across cards, shows feedback and allows retry', async () => {
 const ui = await setup();
 try {
  await flush(() => Simulate.click(ui.bookmarks()[0]));
  assert.equal(ui.bookmarks()[0].getAttribute('aria-pressed'), 'true');
  await ui.settle(true);
  assert.ok(ui.bookmarks().every(b => b.getAttribute('aria-pressed') === 'false'));
  assert.equal(ui.bookmarks()[0].disabled, false);
  assert.ok(document.querySelector('[role="alert"]'));
  await flush(() => Simulate.click(ui.bookmarks()[0]));
  await ui.settle();
  assert.equal(ui.bookmarks()[0].getAttribute('aria-pressed'), 'true');
 } finally {await ui.cleanup();}
});

test('compact homepage cards derive availability from reservations and retain the guarded client cart action', async () => {
 const ui = await setup(false, {compact: true, productOverrides: {productQuantity: 10, productReservedQuantity: 10}});
 try {
  const card = document.querySelector('.quwat-home-product');
  assert.ok(card.querySelector('.quwat-home-stock-badge.empty'));
  assert.match(card.querySelector('.quwat-product-stock').textContent, /Sotuvga mavjud:0 dona/);
  const button = card.querySelector('.quwat-cart-add');
  assert.match(button.textContent, /Savatcha/);
  await flush(() => Simulate.click(button));
  assert.match(document.body.textContent, /Mahsulot omborda mavjud emas/);
  assert.equal(cart.cartVar().lines.length, 0);
  assert.equal(ui.pending.length, 0);
 } finally { await ui.cleanup(); }
});
