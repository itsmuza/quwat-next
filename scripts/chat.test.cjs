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
global.Image = window.Image;
global.Event = window.Event;
const Chat = require('../libs/components/Chat.tsx').default;
const {readChatMessage} = require('../libs/chat.ts');
const {socketVar} = require('../apollo/store.ts');
class FakeSocket extends window.EventTarget {
 static OPEN=1;static instances=[];
 constructor(url){super();this.url=url;this.readyState=0;this.sent=[];this.fail=false;FakeSocket.instances.push(this);}
 open(){this.readyState=1;this.onopen?.(new window.Event('open'));this.dispatchEvent(new window.Event('open'));}
 message(value){const event=new window.MessageEvent('message',{data:typeof value==='string'?value:JSON.stringify(value)});this.onmessage?.(event);this.dispatchEvent(event);}
 send(value){if(this.fail)throw Error('Send failed');this.sent.push(value);}
 close(){if(this.readyState===3)return;this.readyState=3;this.onclose?.(new window.Event('close'));this.dispatchEvent(new window.Event('close'));}
}
global.WebSocket=FakeSocket;
async function flush(action=()=>{}){await act(async()=>{action();await new Promise(r=>setTimeout(r,20));});}
async function setup({status='anonymous',locale='uz'}={}){
 FakeSocket.instances=[];localStorage.clear();
 if(status==='authenticated')localStorage.setItem('accessToken','fixture-token');
 userVar({...emptyUser,...(status==='authenticated'?{_id:'507f1f77bcf86cd799439011',memberNick:'agent'}:{})});sessionVar({status,error:''});
 const i18n=require('i18next').createInstance();await i18n.init({lng:locale,ns:['common'],defaultNS:'common',resources:{[locale]:{common:require(`../public/locales/${locale}/common.json`)}}});
 const root=createRoot(document.getElementById('test-root'));
 await flush(()=>root.render(React.createElement(RouterContext.Provider,{value:{locale,pathname:'/',query:{}}},React.createElement(I18nextProvider,{i18n},React.createElement(Chat)))));
 return {get socket(){return FakeSocket.instances.at(-1);},async open(){await flush(()=>document.querySelector('.chat-button').click());},async connect(){await flush(()=>{this.socket.open();this.socket.message({event:'connected',clientId:'own-connection'});this.socket.message({event:'info',totalClients:3});});},async cleanup(){await flush(()=>root.unmount());socketVar(undefined);}};
}
const field=()=>document.querySelector('.msg-input');
const send=()=>document.querySelector('.send-msg-btn');
const write=async text=>flush(()=>{field().value=text;Simulate.change(field());});
const message=(id,text,extra={})=>({event:'message',id,text,senderId:'other',createdAt:'2026-10-16T07:00:00Z',memberData:null,...extra});
test('loading/error sessions open an accessible panel without starting a socket; X/Escape restore launcher focus',async()=>{
 for(const status of ['loading','error']){const ui=await setup({status});try{
  assert.equal(FakeSocket.instances.length,0);await ui.open();assert.ok(document.querySelector('[role="dialog"]'));assert.equal(document.activeElement,field());assert.ok(send().disabled);
  await flush(()=>Simulate.keyDown(field(),{key:'Escape'}));assert.equal(document.querySelector('[role="dialog"]'),null);assert.equal(document.activeElement,document.querySelector('.chat-button'));
  await ui.open();await flush(()=>document.querySelector('.chat-top button').click());assert.equal(document.querySelector('[role="dialog"]'),null);
 }finally{await ui.cleanup();}}
});
test('history parses valid messages safely, bounds the list and leaves sale hints available to socket listeners',async()=>{
 const ui=await setup();try{
  await ui.open();await ui.connect();let hints=0;ui.socket.addEventListener('message',event=>{if(JSON.parse(event.data).event==='saleChanged')hints++;});
  await flush(()=>ui.socket.message({event:'getMessages',list:[null,{text:{}},...Array.from({length:55},(_,n)=>message(String(n),`message ${n}`))]}));
  assert.equal(document.querySelectorAll('.quwat-chat-message').length,50);assert.match(document.body.textContent,/message 54/);
  await flush(()=>{ui.socket.message({event:'saleChanged'});ui.socket.message('bad-json');ui.socket.message({event:'message',text:{html:'bad'}});});
  assert.equal(hints,1);assert.equal(document.querySelectorAll('.quwat-chat-message').length,50);assert.match(document.body.textContent,/Onlayn: 3/);
 }finally{await ui.cleanup();}
});
test('sending uses the existing raw envelope, rejects whitespace/oversize drafts and labels guest echoes as own',async()=>{
 const ui=await setup();try{
  await ui.open();await ui.connect();await write('   ');assert.ok(send().disabled);
  await write('x'.repeat(1001));await flush(()=>Simulate.submit(document.querySelector('.chat-bott')));assert.equal(ui.socket.sent.length,0);
  await write('  Salom  ');await flush(()=>Simulate.submit(document.querySelector('.chat-bott')));assert.deepEqual(JSON.parse(ui.socket.sent[0]),{event:'message',data:'Salom'});assert.equal(field().value,'');
  await flush(()=>ui.socket.message(message('own','Salom',{senderId:'own-connection'})));
  assert.ok(document.querySelector('.quwat-chat-message.own'));assert.match(document.body.textContent,/Siz/);
  await flush(()=>ui.socket.message(message('other','<script>unsafe</script>',{memberData:{_id:'other-member',memberNick:'Azizbek',memberPhone:'private'}})));
  assert.match(document.body.textContent,/Azizbek/);assert.equal(document.querySelector('script'),null);assert.equal(document.querySelectorAll('.quwat-chat-message').length,2);
  await flush(()=>ui.socket.message(message('other','duplicate')));assert.equal(document.querySelectorAll('.quwat-chat-message').length,2);
 }finally{await ui.cleanup();}
});
test('send failures retain the draft; server auth errors request a session check and remain visible',async()=>{
 const ui=await setup();try{
  await ui.open();await ui.connect();await write('Keep this draft');ui.socket.fail=true;await flush(()=>Simulate.submit(document.querySelector('.chat-bott')));
  assert.equal(field().value,'Keep this draft');assert.ok(document.querySelector('[role="alert"]'));
  let checks=0;const check=()=>checks++;window.addEventListener('quwat:session-check',check);
  await flush(()=>ui.socket.message({event:'chatError',code:'CHAT_AUTH_REQUIRED'}));window.removeEventListener('quwat:session-check',check);assert.equal(checks,1);assert.match(document.body.textContent,/Chat sessiyasi tugagan/);
 }finally{await ui.cleanup();}
});
test('connection loss reconnects automatically, rebinds the shared socket and preserves an unsent draft',async()=>{
 const ui=await setup();try{
  await ui.open();await ui.connect();await write('Draft while offline');const old=ui.socket;
  await flush(()=>old.close());assert.ok(send().disabled);assert.match(document.body.textContent,/Qayta ulanilmoqda/);assert.equal(socketVar(),undefined);
  await act(async()=>{await new Promise(r=>setTimeout(r,1100));});await flush();assert.equal(FakeSocket.instances.length,2);assert.equal(socketVar(),ui.socket);await ui.connect();
  assert.equal(field().value,'Draft while offline');assert.ok(!send().disabled);assert.notEqual(ui.socket,old);
  await flush(()=>ui.socket.close());await flush(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Qayta ulanish').click());assert.equal(FakeSocket.instances.length,3);
 }finally{await ui.cleanup();}
});
test('account changes close the old socket, clear account draft/history and ignore late messages; unmount cancels retries',async()=>{
 const ui=await setup({status:'authenticated'});try{
  await ui.open();await ui.connect();assert.match(ui.socket.url,/token=fixture-token/);await write('Account draft');const old=ui.socket,late=old.onmessage;
  await flush(()=>{localStorage.removeItem('accessToken');userVar({...emptyUser});sessionVar({status:'anonymous',error:''});});
  assert.equal(old.readyState,3);assert.ok(!ui.socket.url.includes('token='));assert.equal(field().value,'');
  await flush(()=>late(new window.MessageEvent('message',{data:JSON.stringify(message('late','Old account'))})));assert.ok(!document.body.textContent.includes('Old account'));
  await flush(()=>ui.socket.close());
 }finally{await ui.cleanup();}
 const count=FakeSocket.instances.length;await new Promise(r=>setTimeout(r,1100));assert.equal(FakeSocket.instances.length,count);
});
test('new chat labels are localized in Uzbek, English, Russian and Korean',async()=>{
 const titles={uz:'Quwat chat',en:'Quwat chat',ru:'Чат Quwat',kr:'Quwat 채팅'};
 for(const locale of Object.keys(titles)){const ui=await setup({locale});try{await ui.open();assert.equal(document.querySelector('#quwat-chat-title').textContent,titles[locale]);}finally{await ui.cleanup();}}
});
test('message parser rejects malformed records and retains only safe display identity fields',()=>{
 assert.equal(readChatMessage({text:[]}),null);assert.equal(readChatMessage({text:'x'.repeat(1001)}),null);
 assert.deepEqual(readChatMessage({text:'ok',createdAt:'bad',memberData:{_id:'id',memberNick:'name',memberPassword:'private'}}),{text:'ok',memberData:{_id:'id',memberNick:'name'}});
});

test('mobile chat opens without the keyboard, follows keyboard viewport changes and removes listeners on close', async () => {
 const originalMatchMedia = window.matchMedia;
 const originalViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
 const originalHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');
 const viewport = new window.EventTarget();
 const listeners = new Set();
 const add = viewport.addEventListener.bind(viewport), remove = viewport.removeEventListener.bind(viewport);
 viewport.addEventListener = (type, listener) => { listeners.add(type); add(type, listener); };
 viewport.removeEventListener = (type, listener) => { listeners.delete(type); remove(type, listener); };
 viewport.height = 800; viewport.offsetTop = 0;
 Object.defineProperty(window, 'visualViewport', {configurable:true,value:viewport});
 Object.defineProperty(window, 'innerHeight', {configurable:true,value:800});
 window.matchMedia = () => ({matches:false});
 const ui = await setup();
 try {
  await ui.open();
  const panel = document.querySelector('[role="dialog"]'), container = document.querySelector('.chatting');
  assert.equal(document.activeElement, panel);
  assert.notEqual(document.activeElement, field());
  assert.equal(container.style.getPropertyValue('--quwat-chat-visible-height'), '800px');
  assert.deepEqual([...listeners].sort(), ['resize','scroll']);
  await flush(() => {field().focus(); viewport.height=420; viewport.offsetTop=30; viewport.dispatchEvent(new window.Event('resize'));});
  assert.equal(container.style.getPropertyValue('--quwat-chat-visible-height'), '420px');
  assert.equal(container.style.getPropertyValue('--quwat-chat-keyboard-inset'), '350px');
  assert.ok(container.hasAttribute('data-keyboard-open'));
  await write('Unsent mobile draft');
  await flush(() => {viewport.height=800; viewport.offsetTop=0; viewport.dispatchEvent(new window.Event('scroll'));});
  assert.equal(container.hasAttribute('data-keyboard-open'), false);
  assert.equal(field().value, 'Unsent mobile draft');
  await flush(() => document.querySelector('.chat-top button').click());
  assert.equal(listeners.size, 0);
  assert.equal(container.style.getPropertyValue('--quwat-chat-visible-height'), '');
  assert.equal(document.activeElement, document.querySelector('.chat-button'));
  assert.equal(ui.socket.sent.length, 0);
 } finally {
  await ui.cleanup(); window.matchMedia=originalMatchMedia;
  if(originalViewport) Object.defineProperty(window,'visualViewport',originalViewport); else delete window.visualViewport;
  Object.defineProperty(window,'innerHeight',originalHeight);
 }
});

test('mobile chat falls back to window resizing when VisualViewport is unavailable', async () => {
 const originalMatchMedia=window.matchMedia;
 window.matchMedia=()=>({matches:false});
 const ui=await setup();
 try {
  await ui.open();
  assert.equal(document.activeElement,document.querySelector('[role="dialog"]'));
  await flush(()=>window.dispatchEvent(new window.Event('resize')));
  assert.equal(document.querySelector('.chatting').style.getPropertyValue('--quwat-chat-visible-height'),`${window.innerHeight}px`);
 } finally {await ui.cleanup();window.matchMedia=originalMatchMedia;}
});

test('sending from the mobile composer retains focus and keyboard geometry through draft clearing and the server echo', async () => {
 const originalMatchMedia=window.matchMedia;
 const originalViewport=Object.getOwnPropertyDescriptor(window,'visualViewport');
 const viewport=new window.EventTarget();
 viewport.height=window.innerHeight;viewport.offsetTop=0;
 Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
 window.matchMedia=()=>({matches:false});
 const ui=await setup();
 try {
  await ui.open();await ui.connect();
  const panel=document.querySelector('[role="dialog"]'),feed=document.querySelector('.quwat-chat-feed'),container=document.querySelector('.chatting');
  await flush(()=>{field().focus();viewport.height=window.innerHeight-320;viewport.dispatchEvent(new window.Event('resize'));});
  assert.ok(container.hasAttribute('data-keyboard-open'));
  await write('Mobile message');
  const geometry=container.getAttribute('style');
  const pointer=new window.MouseEvent('pointerdown',{bubbles:true,cancelable:true,button:0});
  await flush(()=>{const button=send();if(button.dispatchEvent(pointer))button.focus();button.click();});
  assert.ok(pointer.defaultPrevented);
  assert.equal(document.activeElement,field());
  assert.equal(field().value,'');
  assert.deepEqual(JSON.parse(ui.socket.sent[0]),{event:'message',data:'Mobile message'});
  await flush(()=>{ui.socket.message(message('mobile-echo','Mobile message',{senderId:'own-connection'}));viewport.dispatchEvent(new window.Event('scroll'));});
  assert.equal(document.activeElement,field());
  assert.equal(document.querySelector('[role="dialog"]'),panel);
  assert.equal(document.querySelector('.quwat-chat-feed'),feed);
  assert.ok(document.querySelector('.quwat-chat-message.own'));
  assert.ok(container.hasAttribute('data-keyboard-open'));
  assert.equal(container.getAttribute('style'),geometry);
  // Focus changes alone must not claim that the still-visible keyboard closed.
  await flush(()=>{document.querySelector('.chat-top button').focus();viewport.dispatchEvent(new window.Event('scroll'));});
  assert.ok(container.hasAttribute('data-keyboard-open'));
  // Hardware-keyboard users can still focus and activate the send button normally.
  await write('Keyboard message');let prevented=false;
  await flush(()=>Simulate.pointerDown(send(),{button:0,preventDefault:()=>{prevented=true;}}));
  assert.equal(prevented,false);
  await flush(()=>{send().focus();Simulate.submit(document.querySelector('.chat-bott'));});
  assert.equal(ui.socket.sent.length,2);
 } finally {
  await ui.cleanup();window.matchMedia=originalMatchMedia;
  if(originalViewport)Object.defineProperty(window,'visualViewport',originalViewport);else delete window.visualViewport;
 }
});
