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
const CommentThread = require('../libs/components/common/CommentThread.tsx').default;
const owner = '507f1f77bcf86cd799439011';
const target = '507f1f77bcf86cd799439012';
const id = n => n.toString(16).padStart(24, '0');
const entry = n => ({
 __typename: 'Comment', _id: id(n), memberId: n === 1 || n === 11 ? owner : target,
 commentStatus: 'ACTIVE', commentGroup: 'MEMBER', commentRefId: target,
 commentContent: `Izoh ${n}`, createdAt: '2026-10-15T10:00:00Z', updatedAt: '2026-10-15T10:00:00Z',
 memberData: n === 1 ? {...emptyUser, __typename: 'Member', _id: owner, memberFullName: 'Test Client', memberNick: 'tester', memberImage: 'uploads/member/test-client.png', deletedAt: null, guestLiked: false, meLiked: []} : null,
});
async function flush(action = () => {}) {
 await act(async () => {action(); await new Promise(resolve => setTimeout(resolve, 15));});
}
async function setup(group = 'MEMBER', total = 20, role = 'CLIENT') {
 userVar({...emptyUser, _id: owner, memberType: role, memberStatus: 'ACTIVE'});
 sessionVar({status: 'authenticated', error: ''});
 const entries = Array.from({length: total}, (_, i) => ({...entry(i+1), commentGroup: group}));
 const requests = [], pending = [];
 const client = new ApolloClient({cache: new InMemoryCache(), link: new ApolloLink(operation => new Observable(observer => {
  requests.push({name: operation.operationName, input: structuredClone(operation.variables.input)});
  if (operation.operationName === 'GetComments') {
   const {page, limit} = operation.variables.input;
   observer.next({data: {getComments: {list: entries.slice((page-1)*limit, page*limit), metaCounter: [{total: entries.length}]}}});
   observer.complete();
  } else pending.push({operation, observer});
 }))});
 const i18n = require('i18next').createInstance();
 await i18n.init({lng: 'uz', ns: ['common'], defaultNS: 'common', resources: {uz: {common: require('../public/locales/uz/common.json')}}});
 const root = createRoot(document.getElementById('test-root'));
 await flush(() => root.render(React.createElement(RouterContext.Provider, {value: {locale: 'uz', pathname: '/agent/detail', query: {}}},
  React.createElement(I18nextProvider, {i18n}, React.createElement(ApolloProvider, {client},
   React.createElement(ThemeProvider, {theme: createTheme()}, React.createElement(CommentThread, {targetId: target, group})))))));
 return {requests, pending,
  async settle(error = false) {
   const {operation, observer} = pending.shift();
   await flush(() => {
    if (error) {observer.error(new Error('offline')); return;}
    const input = operation.variables.input;
    if (operation.operationName === 'UpdateComment') {
     const updated = entries.find(e => e._id === input._id);
     updated.commentContent = input.commentContent;
     observer.next({data: {updateComment: updated}});
    } else {
     const created = {...entry(21), memberId: owner, ...input};
     entries.unshift(created);
     observer.next({data: {createComment: created}});
    }
    observer.complete();
   });
   await flush();
  },
  async cleanup() {await flush(() => root.unmount()); client.stop();},
 };
}
const createForm = () => document.querySelector('form[aria-label="Izoh yozish"]');
const editForm = () => document.querySelector('form[aria-label="Izohni tahrirlash"]');
const editButton = n => document.querySelector(`[data-comment-id="${id(n)}"] [aria-label="Tahrirlash"]`) || undefined;
async function fill(input, text) {
 await flush(() => {input.value = text; Simulate.change(input, {target: {value: text}});});
}

test('comment rows show author image/name, fallback avatars and labeled edit/delete icons with owner/admin permissions', async () => {
 for (const role of ['CLIENT', 'ADMIN']) {
  const ui = await setup('MEMBER', 2, role);
  try {
   const own = document.querySelector(`[data-comment-id="${id(1)}"]`);
   const other = document.querySelector(`[data-comment-id="${id(2)}"]`);
   assert.equal(own.querySelector('.quwat-comment-avatar img').alt, 'Test Client');
   assert.ok(own.querySelector('.quwat-comment-avatar img').src.endsWith('/uploads/member/test-client.png'));
   assert.equal(own.querySelector('.quwat-comment-body a').textContent, 'Test Client');
   assert.ok(own.querySelector('.quwat-comment-body').textContent.includes('Izoh 1'));
   assert.ok(editButton(1).querySelector('[data-testid="EditOutlinedIcon"]'));
   assert.ok(own.querySelector('[aria-label="O‘chirish"] [data-testid="DeleteOutlineIcon"]'));
   assert.equal(other.querySelector('.quwat-comment-avatar img').getAttribute('src'), '/img/profile/defaultUser.svg');
   assert.equal(editButton(2), undefined);
   assert.equal(Boolean(other.querySelector('[aria-label="O‘chirish"]')), role === 'ADMIN');
   await flush(() => sessionVar({status: 'anonymous', error: ''}));
   assert.equal(document.querySelectorAll('.quwat-comment-action').length, 0);
  } finally {await ui.cleanup();}
 }
});

test('member and product comments paginate 23 rows as 10/10/3, with working next/previous and boundary controls', async () => {
 for (const group of ['MEMBER', 'PRODUCT']) {
  const ui = await setup(group, 23);
  try {
   const shownIds = () => [...document.querySelectorAll('[data-comment-id]')].map(el => el.getAttribute('data-comment-id'));
   const arrows = () => [...document.querySelectorAll('.MuiPaginationItem-previousNext')];
   const selectedPage = () => document.querySelector('.MuiPaginationItem-page.Mui-selected').textContent;
   const expectedIds = (start, count) => Array.from({length: count}, (_, i) => id(start+i));
   assert.deepEqual(shownIds(), expectedIds(1, 10));
   assert.equal(selectedPage(), '1');
   assert.equal(arrows()[0].disabled, true);
   assert.equal(arrows()[1].disabled, false);
   await flush(() => Simulate.click(arrows()[1]));
   assert.deepEqual(shownIds(), expectedIds(11, 10));
   assert.equal(selectedPage(), '2');
   await flush(() => Simulate.click(arrows()[1]));
   assert.deepEqual(shownIds(), expectedIds(21, 3));
   assert.equal(selectedPage(), '3');
   assert.equal(arrows()[1].disabled, true);
   await flush(() => Simulate.click(arrows()[0]));
   assert.deepEqual(shownIds(), expectedIds(11, 10));
   await flush(() => Simulate.click(arrows()[0]));
   assert.deepEqual(shownIds(), expectedIds(1, 10));
   for (const request of ui.requests) {
    assert.equal(request.name, 'GetComments');
    assert.equal(request.input.limit, 10);
    assert.deepEqual(request.input.search, {commentRefId: target, commentGroup: group});
   }
  } finally {await ui.cleanup();}
 }
});

test('comment page counts handle empty lists and the ten/eleven-comment boundary', async () => {
 for (const total of [0, 10, 11]) {
  const ui = await setup('MEMBER', total);
  try {
   assert.equal(document.querySelectorAll('[data-comment-id]').length, Math.min(10, total));
   const pages = [...document.querySelectorAll('.MuiPaginationItem-page')];
   assert.equal(pages.length, total <= 10 ? 1 : 2);
   const next = () => [...document.querySelectorAll('.MuiPaginationItem-previousNext')][1];
   assert.equal(next().disabled, total <= 10);
   if (total === 11) {
    await flush(() => Simulate.click(next()));
    assert.equal(document.querySelectorAll('[data-comment-id]').length, 1);
    assert.equal(document.querySelector('[data-comment-id]').getAttribute('data-comment-id'), id(11));
    assert.equal(next().disabled, true);
   }
  } finally {await ui.cleanup();}
 }
});

test('editing opens at its comment, focuses locally, preserves the new-comment draft and cancels without a mutation', async () => {
 const ui = await setup();
 try {
  assert.equal(document.querySelectorAll('[data-comment-id]').length, 10);
  assert.equal(editButton(2), undefined, 'another member has no edit action');
  await fill(createForm().querySelector('input'), 'Yangi izoh qoralamasi');
  await flush(() => Simulate.click(editButton(1)));
  assert.ok(document.querySelector(`[data-comment-id="${id(1)}"]`).contains(editForm()));
  assert.equal(editForm().querySelector('input').value, 'Izoh 1');
  assert.equal(document.activeElement, editForm().querySelector('input'));
  await fill(editForm().querySelector('input'), 'Tahrir qoralamasi');
  assert.equal(createForm().querySelector('input').value, 'Yangi izoh qoralamasi');
  await flush(() => Simulate.click([...editForm().querySelectorAll('button')].find(b => b.textContent === 'Bekor qilish')));
  assert.equal(editForm(), null);
  assert.ok(document.querySelector(`[data-comment-id="${id(1)}"]`).textContent.includes('Izoh 1'));
  assert.equal(createForm().querySelector('input').value, 'Yangi izoh qoralamasi');
  assert.equal(ui.pending.length, 0);
 } finally {await ui.cleanup();}
});

test('saving an old comment updates only its ID/content, keeps page two, and does not submit the new-comment draft', async () => {
 const ui = await setup();
 try {
  await flush(() => Simulate.click([...document.querySelectorAll('.MuiPaginationItem-page')].find(b => b.textContent === '2')));
  await fill(createForm().querySelector('input'), 'Yangi izoh');
  await flush(() => Simulate.click(editButton(11)));
  await fill(editForm().querySelector('input'), '  Yangilangan izoh  ');
  await flush(() => Simulate.submit(editForm()));
  assert.deepEqual(ui.pending[0].operation.variables.input, {_id: id(11), commentContent: 'Yangilangan izoh'});
  assert.ok([...editForm().querySelectorAll('button')].every(b => b.disabled));
  await ui.settle();
  assert.equal(editForm(), null);
  assert.ok(document.querySelector(`[data-comment-id="${id(11)}"]`).textContent.includes('Yangilangan izoh'));
  assert.equal(ui.requests.filter(r => r.name === 'GetComments').at(-1).input.page, 2);
  assert.equal(createForm().querySelector('input').value, 'Yangi izoh');
  assert.equal(ui.requests.filter(r => r.name === 'CreateComment').length, 0);
 } finally {await ui.cleanup();}
});

test('failed edits retain the inline draft/error, reject blank text and can be retried', async () => {
 const ui = await setup();
 try {
  await flush(() => Simulate.click(editButton(1)));
  await fill(editForm().querySelector('input'), '   ');
  assert.ok(editForm().querySelector('button[type="submit"]').disabled);
  await flush(() => Simulate.submit(editForm()));
  assert.equal(ui.pending.length, 0);
  await fill(editForm().querySelector('input'), 'Qayta urinish');
  await flush(() => Simulate.submit(editForm()));
  await ui.settle(true);
  assert.equal(editForm().querySelector('input').value, 'Qayta urinish');
  assert.ok(editForm().querySelector('[role="alert"]'));
  assert.equal(editForm().querySelector('button[type="submit"]').disabled, false);
  await flush(() => Simulate.submit(editForm()));
  await ui.settle();
  assert.equal(editForm(), null);
 } finally {await ui.cleanup();}
});

test('new comments retain target/group payloads for member and product threads', async () => {
 for (const group of ['MEMBER', 'PRODUCT']) {
  const ui = await setup(group);
  try {
   await fill(createForm().querySelector('input'), '  Yangi izoh  ');
   await flush(() => Simulate.submit(createForm()));
   assert.equal(ui.pending[0].operation.operationName, 'CreateComment');
   assert.deepEqual(ui.pending[0].operation.variables.input, {commentRefId: target, commentGroup: group, commentContent: 'Yangi izoh'});
   await ui.settle();
   assert.equal(createForm().querySelector('input').value, '');
  } finally {await ui.cleanup();}
 }
});
