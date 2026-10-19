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
const AgentNotifications = require('../libs/components/sale/AgentNotifications.tsx').default;
const SalesPanel = require('../libs/components/sale/SalesPanel.tsx').default;
const { ApolloClient, InMemoryCache, ApolloLink, Observable } = require('@apollo/client');
const { socketVar } = require('../apollo/store.ts');
const id = n => n.toString(16).padStart(24, '0');
const fixture = n => ({ __typename:'Sale', _id:id(n), clientId:id(99), clientName:`Mijoz ${n}`, requestKey:`key-${n}`,
 saleStatus:'PENDING', paymentMethod:'CASH', items:[{__typename:'SaleLine', productId:id(100+n), productName:`Bolg‘a ${n}`,
 productType:'ASBOBLAR', productUnit:'DONA', productBrand:null, productImage:null, unitPrice:25000, quantity:2, lineTotal:50000}],
 totalAmount:50000, agentId:null, agentName:null, completedAt:null, completedDate:null, cancelledAt:null,
 rejectedAt:null, rejectedById:null, rejectedByName:null, createdAt:'2026-10-16T03:00:00.000Z', updatedAt:'2026-10-16T03:00:00.000Z' });
async function flush(action = () => {}) { await act(async () => { action(); await new Promise(r=>setTimeout(r,30)); }); }
async function setup({ count=23, role='AGENT', status='authenticated', memberStatus='ACTIVE', component='inbox', saleId } = {}) {
 userVar({...emptyUser,_id:id(900),memberType:role,memberStatus}); sessionVar({status,error:''});
 const sales=Array.from({length:count},(_,i)=>fixture(i+1)); const read=new Map(), operations=[], navigations=[];
 const socket=new window.EventTarget(); socketVar(socket);
 let failQuery=false, failMore=false, resolveDecision;
 const client=new ApolloClient({cache:new InMemoryCache(),link:new ApolloLink(op=>new Observable(observer=>{
  const name=op.operationName,input=op.variables.input;
  operations.push({name,input:structuredClone(input)});
  const send=data=>{observer.next({data});observer.complete();};
  if (['ApproveSale','RejectSale'].includes(name)) {
   resolveDecision=(fail=false)=>{
    if(fail){observer.error(new Error('Network failure'));return;}
    const sale=sales.find(s=>s._id===input._id);sale.saleStatus=name==='RejectSale'?'CANCELLED':'COMPLETED';
    if(name==='RejectSale') {sale.rejectedAt=new Date().toISOString();sale.rejectedById=userVar()._id;sale.rejectedByName='agent';}
    send({[name==='RejectSale'?'rejectSale':'approveSale']:{...sale}});
   };return;
  }
  if(name==='GetSaleNotifications') {
   if(failQuery || (failMore && input.page>1)){observer.error(new Error('Network failure'));return;}
   const seen=read.get(userVar()._id)||new Set();
   const pending=sales.filter(s=>s.saleStatus==='PENDING');
   send({getSaleNotifications:{__typename:'SaleNotifications',list:pending.slice((input.page-1)*input.limit,input.page*input.limit).map(sale=>({__typename:'SaleNotification',sale:{...sale},readAt:seen.has(sale._id)?'2026-10-16T04:00:00Z':null})),metaCounter:[{total:pending.length}],unreadCount:pending.filter(s=>!seen.has(s._id)).length}});
  } else if(name==='MarkSaleNotificationRead') {
   const seen=read.get(userVar()._id)||new Set();seen.add(input._id);read.set(userVar()._id,seen);send({markSaleNotificationRead:true});
  } else if(['GetMySales','GetPendingSales'].includes(name)) {
   const list=sales.filter(s=>name==='GetMySales'?(!input.saleStatus||s.saleStatus===input.saleStatus):s.saleStatus==='PENDING');
   send({[name==='GetMySales'?'getMySales':'getPendingSales']:{list:list.slice((input.page-1)*input.limit,input.page*input.limit),metaCounter:[{total:list.length}]}});
  } else if(name==='GetSaleForAgent') {send({getSaleForAgent:sales.find(s=>s._id===input._id)});}
  else observer.error(new Error('Unexpected operation '+name));
 }))});
 const router={locale:'uz',pathname:'/mypage',query:saleId?{category:'payments',saleId}:{},isReady:true,
 push:(...args)=>{navigations.push(args);return Promise.resolve(true);},prefetch:()=>Promise.resolve(),beforePopState(){},events:{on(){},off(){}}};
 const i18n=require('i18next').createInstance(); await i18n.init({lng:'uz',ns:['common'],defaultNS:'common',resources:{uz:{common:require('../public/locales/uz/common.json')}}});
 const root=createRoot(document.getElementById('test-root'));
 await flush(()=>root.render(React.createElement(RouterContext.Provider,{value:router},React.createElement(I18nextProvider,{i18n},
  React.createElement(ApolloProvider,{client},React.createElement(ThemeProvider,{theme:createTheme({components:{MuiDialog:{defaultProps:{transitionDuration:0}}}})},
   component==='inbox'?React.createElement(AgentNotifications):React.createElement(SalesPanel,{kind:role==='CLIENT'?'client':'agent'})))))));
 await flush();
 return {sales,read,operations,navigations,client,socket,
  setQueryFailure(value){failQuery=value;}, setMoreFailure(value){failMore=value;}, async decide(fail=false){await flush(()=>resolveDecision(fail));await flush();},
  async open(){await flush(()=>document.querySelector('.quwat-navbar-notifications').click());await flush();},
  async cleanup(){await flush(()=>root.unmount());client.stop();socketVar(undefined);}
 };
}
const cards=()=>[...document.querySelectorAll('.quwat-sale-notification')];
const button=(root,text)=>[...root.querySelectorAll('button')].find(b=>b.textContent===text);
const unread=()=>document.querySelector('.quwat-navbar-notifications').getAttribute('aria-label');

test('only authenticated active agents subscribe or see the inbox',async()=>{
 for(const options of [{role:'CLIENT'},{role:'ADMIN'},{status:'anonymous'},{status:'loading'},{memberStatus:'BLOCK'}]){
  const ui=await setup(options);try{assert.equal(ui.operations.length,0);assert.ok(!document.querySelector('.quwat-navbar-notifications'));}finally{await ui.cleanup();}
 }
});
test('all notifications share one list without pagination and deep links/read markers target the exact sale',async()=>{
 const ui=await setup();try{
  assert.match(unread(),/23/);assert.deepEqual(ui.operations[0].input,{page:1,limit:100});await ui.open();assert.equal(cards().length,23);
  assert.ok(!document.querySelector('.MuiPagination-root'));assert.ok(!document.querySelector('.quwat-notifications-footer'));
  const link=cards()[20].querySelector('a');assert.match(link.href,new RegExp('saleId='+id(21)));
  await flush(()=>Simulate.click(link,{button:0}));await flush();
  assert.deepEqual(ui.operations.find(o=>o.name==='MarkSaleNotificationRead').input,{_id:id(21)});assert.match(unread(),/22/);
  assert.equal(ui.navigations.length,1);
  await ui.open();assert.ok(ui.read.get(id(900)).has(id(21)));
 }finally{await ui.cleanup();}
});
test('approve confirms the selected request once, locks while busy and removes the completed request from notifications',async()=>{
 const ui=await setup({count:2});try{
  await ui.open();await flush(()=>button(cards()[0],'Tasdiqlash').click());
  const dialog=document.querySelector('[aria-labelledby="quwat-notification-decision"]');assert.match(dialog.textContent,/Mijoz 1/);
  await flush(()=>button(dialog,'Tasdiqlash').click());await flush(()=>button(dialog,'Tasdiqlash').click());
  assert.equal(ui.operations.filter(o=>o.name==='ApproveSale').length,1);assert.ok(button(cards()[1],'Tasdiqlash').disabled);
  assert.deepEqual(ui.operations.find(o=>o.name==='ApproveSale').input,{_id:id(1)});
  await ui.decide();assert.equal(cards().length,1);assert.match(cards()[0].textContent,/Mijoz 2/);
  assert.equal(ui.sales.length,2);assert.equal(ui.sales[0].saleStatus,'COMPLETED');assert.match(unread(),/1 ta/);
 }finally{await ui.cleanup();}
});
test('reject handles failure and retry, then hides the cancelled notification while preserving the sale',async()=>{
 const ui=await setup({count:1});try{
  await ui.open();await flush(()=>button(cards()[0],'Rad etish').click());
  let dialog=document.querySelector('[aria-labelledby="quwat-notification-decision"]');
  await flush(()=>button(dialog,'Rad etish').click());await ui.decide(true);
  assert.ok(dialog.querySelector('[role="alert"]'));assert.ok(!button(dialog,'Rad etish').disabled);
  await flush(()=>button(dialog,'Rad etish').click());await ui.decide();
  assert.equal(cards().length,0);assert.equal(ui.sales.length,1);assert.equal(ui.sales[0].saleStatus,'CANCELLED');
  assert.match(document.body.textContent,/Hozircha bildirishnomalar yo‘q/);assert.match(unread(),/0 ta/);
  assert.deepEqual(ui.operations.find(o=>o.name==='RejectSale').input,{_id:id(1)});
 }finally{await ui.cleanup();}
});
test('socket hints refresh the badge, unrelated chat events do not and account changes isolate read states',async()=>{
 const ui=await setup({count:1});try{
  const before=ui.operations.length;await flush(()=>ui.socket.dispatchEvent(new window.MessageEvent('message',{data:'{"event":"message","text":"hello"}'})));
  assert.equal(ui.operations.length,before);
  ui.sales.unshift(fixture(2));await flush(()=>ui.socket.dispatchEvent(new window.MessageEvent('message',{data:'{"event":"saleChanged"}'})));await flush();assert.match(unread(),/2 ta/);
  await ui.open();await flush(()=>Simulate.click(cards()[0].querySelector('a'),{button:0}));await flush();assert.match(unread(),/1 ta/);
  await flush(()=>userVar({...userVar(),_id:id(901)}));await flush();assert.match(unread(),/2 ta/);
  await flush(()=>sessionVar({status:'anonymous',error:''}));assert.ok(!document.querySelector('.quwat-navbar-notifications'));
  const loggedOut=ui.operations.length;await flush(()=>ui.socket.dispatchEvent(new window.MessageEvent('message',{data:'{"event":"saleChanged"}'})));assert.equal(ui.operations.length,loggedOut);
 }finally{await ui.cleanup();}
});
test('another agent decision or client cancellation removes the request and unread count on refresh',async()=>{
 const ui=await setup({count:3});try{
  await ui.open();assert.equal(cards().length,3);
  ui.sales[0].saleStatus='COMPLETED';ui.sales[1].saleStatus='CANCELLED';
  await flush(()=>ui.socket.dispatchEvent(new window.MessageEvent('message',{data:'{"event":"saleChanged"}'})));await flush();
  assert.equal(cards().length,1);assert.match(cards()[0].textContent,/Mijoz 3/);assert.match(unread(),/1 ta/);
  assert.equal(ui.sales.length,3);
 }finally{await ui.cleanup();}
});
test('resolving a request leaves all remaining requests in the same list without page controls',async()=>{
 const ui=await setup({count:11});try{
  await ui.open();assert.equal(cards().length,11);assert.match(cards()[10].textContent,/Mijoz 11/);
  await flush(()=>button(cards()[10],'Tasdiqlash').click());
  await flush(()=>button(document.querySelector('[aria-labelledby="quwat-notification-decision"]'),'Tasdiqlash').click());
  await ui.decide();await flush();
  assert.equal(cards().length,10);assert.ok(!document.querySelector('.MuiPagination-root'));
  assert.match(unread(),/10 ta/);assert.equal(ui.sales.length,11);assert.equal(ui.sales[10].saleStatus,'COMPLETED');
 }finally{await ui.cleanup();}
});
test('query errors show a retry and recover without losing the inbox',async()=>{
 const ui=await setup({count:0});try{
  await ui.open();assert.match(document.body.textContent,/Hozircha bildirishnomalar yo‘q/);
  ui.setQueryFailure(true);await flush(()=>window.dispatchEvent(new window.Event('focus')));await flush();assert.ok(document.querySelector('[role="alert"]'));
  ui.setQueryFailure(false);ui.sales.push(fixture(1));await flush(()=>button(document,'Qayta urinish').click());await flush();assert.equal(cards().length,1);
 }finally{await ui.cleanup();}
});
test('more than 100 pending requests load automatically and retry preserves already loaded rows',async()=>{
 const ui=await setup({count:0});try{
  ui.sales.push(...Array.from({length:105},(_,i)=>fixture(i+1)));ui.setMoreFailure(true);
  await ui.open();await flush();await flush();
  assert.equal(cards().length,100);assert.ok(button(document,'Qayta urinish'));assert.match(unread(),/105 ta/);
  assert.ok(!document.querySelector('.MuiPagination-root'));
  ui.setMoreFailure(false);await flush(()=>button(document,'Qayta urinish').click());await flush();await flush();
  assert.equal(cards().length,105);assert.match(cards()[104].textContent,/Mijoz 105/);
  assert.equal(new Set(cards().map(card=>card.querySelector('a').href)).size,105);
  assert.ok(ui.operations.some(o=>o.name==='GetSaleNotifications' && o.input.page===2 && o.input.limit===100));
  assert.ok(!button(document,'Qayta urinish'));
 }finally{await ui.cleanup();}
});
test('deep-linked requests fetch an exact sale even after it leaves the pending queue; client pages stay at 10',async()=>{
 const ui=await setup({count:23,component:'sales',saleId:id(23)});try{
  assert.deepEqual(ui.operations.find(o=>o.name==='GetSaleForAgent').input,{_id:id(23)});
  assert.equal(document.querySelectorAll('.quwat-record').length,1);assert.match(document.body.textContent,/Mijoz 23/);
  assert.ok(!ui.operations.some(o=>o.name==='GetPendingSales'));
  assert.ok(!ui.operations.some(o=>o.name==='GetMySales'));
 }finally{await ui.cleanup();}
 const client=await setup({component:'sales',role:'CLIENT'});try{
  assert.equal(client.operations.find(o=>o.name==='GetMySales').input.limit,10);assert.equal(document.querySelectorAll('.quwat-record').length,10);
  assert.equal(document.querySelector('h4').textContent,'Xaridlarim (23)');
  assert.ok(!client.operations.some(o=>o.name==='GetSaleForAgent'));
 }finally{await client.cleanup();}
});

test('client purchase heading keeps the all-status total while filtering and refreshing',async()=>{
 const ui=await setup({component:'sales',role:'CLIENT'});try{
  ui.sales[0].saleStatus='COMPLETED';
  await flush(()=>Simulate.mouseDown(document.querySelector('.MuiSelect-select'),{button:0}));
  await flush(()=>document.querySelector('[role="option"][data-value="COMPLETED"]').click());await flush();
  assert.equal(document.querySelector('h4').textContent,'Xaridlarim (23)');
  assert.equal(document.querySelectorAll('.quwat-record').length,1);
  assert.ok(ui.operations.some(o=>o.name==='GetMySales'&&o.input.limit===1&&!o.input.saleStatus));
  ui.sales.push(fixture(24));
  await flush(()=>button(document,'Yangilash').click());await flush();
  assert.equal(document.querySelector('h4').textContent,'Xaridlarim (24)');
  assert.equal(document.querySelectorAll('.quwat-record').length,1);
 }finally{await ui.cleanup();}
 const empty=await setup({component:'sales',role:'CLIENT',count:0});try{
  assert.equal(document.querySelector('h4').textContent,'Xaridlarim (0)');
 }finally{await empty.cleanup();}
});
