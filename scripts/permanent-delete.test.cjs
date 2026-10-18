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
const PermanentDeleteButton = require('../libs/components/admin/PermanentDeleteButton.tsx').default;
async function flush(action = () => {}) { await act(async () => {action(); await new Promise(resolve => setTimeout(resolve, 25));}); }
async function setup(kind = 'product', failure = false) {
 const calls = [], busy = []; let after = 0, finish;
 const client = new ApolloClient({cache: new InMemoryCache(),link:new ApolloLink(op=>new Observable(observer=>{calls.push(op);finish=()=>{if(failure)observer.error(new Error('Product has pending sales or reserved stock'));else {observer.next({data:{[kind==='product'?'deleteProductPermanentlyByAdmin':'deleteMemberPermanentlyByAdmin']:true}});observer.complete();}};return()=>{};}))});
 const i18n = require('i18next').createInstance();await i18n.init({lng:'uz',fallbackLng:'uz',resources:{uz:{common:require('../public/locales/uz/common.json')}},defaultNS:'common',interpolation:{escapeValue:false}});
 const root = createRoot(document.getElementById('test-root'));
 await flush(()=>root.render(React.createElement(RouterContext.Provider,{value:{locale:'uz'}},React.createElement(I18nextProvider,{i18n},React.createElement(ApolloProvider,{client},React.createElement(ThemeProvider,{theme:createTheme()},React.createElement(PermanentDeleteButton,{kind,id:'507f1f77bcf86cd799439012',name:'Test mahsulot',onDeleted:async()=>{after++;},onBusy:value=>busy.push(value)})))))));
 return {calls,busy,finish:()=>finish(),after:()=>after,close:async()=>{await flush(()=>root.unmount());client.stop();}};
}
const click = el => Simulate.click(el);
const button = (text,scope=document) => [...scope.querySelectorAll('button')].find(e=>e.textContent===text);
const dialog = ()=>document.querySelector('[role="dialog"]');
async function open() {await flush(()=>click(button('Butunlay o‘chirish')));}
async function confirmName(value) {await flush(()=>Simulate.change(dialog().querySelector('input'),{target:{value}}));}
test('requires exact name and cancellation sends no mutation', async()=>{
 const db=await setup();try{await open();assert.ok(dialog().textContent.includes('ortga qaytarib'));assert.equal(button('Butunlay o‘chirish',dialog()).disabled,true);await confirmName('Wrong');assert.equal(button('Butunlay o‘chirish',dialog()).disabled,true);await flush(()=>click(button('Bekor qilish',dialog())));assert.equal(db.calls.length,0);await open();assert.equal(dialog().querySelector('input').value,'');}finally{await db.close();}
});
test('product deletion locks duplicates, sends exact ID and refreshes only after success',async()=>{
 const db=await setup();try{await open();await confirmName('Test mahsulot');await flush(()=>{click(button('Butunlay o‘chirish',dialog()));click(button('Butunlay o‘chirish',dialog()));});assert.equal(db.calls.length,1);assert.deepEqual(db.calls[0].variables,{productId:'507f1f77bcf86cd799439012'});assert.equal(db.after(),0);assert.equal(dialog().querySelector('input').disabled,true);await flush(db.finish);assert.equal(db.after(),1);assert.deepEqual(db.busy,[true,false]);}finally{await db.close();}
});
test('failed deletion preserves dialog and displays translated reason without refresh',async()=>{
 const db=await setup('product',true);try{await open();await confirmName('Test mahsulot');await flush(()=>click(button('Butunlay o‘chirish',dialog())));await flush(db.finish);assert.ok(dialog());assert.match(dialog().textContent,/band qilingan qoldig‘i bor/);assert.equal(db.after(),0);assert.equal(dialog().querySelector('input').value,'Test mahsulot');}finally{await db.close();}
});
test('member deletion uses member ID and separate mutation',async()=>{
 const db=await setup('member');try{await open();await confirmName('Test mahsulot');await flush(()=>click(button('Butunlay o‘chirish',dialog())));assert.equal(db.calls[0].operationName,'DeleteMemberPermanentlyByAdmin');assert.deepEqual(db.calls[0].variables,{memberId:'507f1f77bcf86cd799439012'});await flush(db.finish);assert.equal(db.after(),1);}finally{await db.close();}
});
