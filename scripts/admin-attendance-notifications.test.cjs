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
const AdminNotifications = require('../libs/components/attendance/AdminAttendanceNotifications.tsx').default;
const { ApolloClient, InMemoryCache, ApolloLink, Observable } = require('@apollo/client');
const id = n => n.toString(16).padStart(24, '0');
const fixture = n => ({__typename:'Attendance',_id:id(n),memberId:id(1000+n),attendanceDate:'2026-10-15',
 attendanceStatus:'PENDING',reviewedAt:null,createdAt:'2026-10-15T03:00:00Z',updatedAt:'2026-10-15T03:00:00Z',
 memberData:{__typename:'AttendanceMember',_id:id(1000+n),memberNick:`agent${n}`,memberFullName:`Agent ${n}`}});
async function flush(action = () => {}) { await act(async () => { action(); await new Promise(r=>setTimeout(r,30)); }); }
async function setup({count=2,role='ADMIN',status='authenticated',memberStatus='ACTIVE'}={}) {
 userVar({...emptyUser,_id:id(900),memberType:role,memberStatus});sessionVar({status,error:''});
 const requests=Array.from({length:count},(_,i)=>fixture(i+1)), operations=[];
 let failQuery=false,failMore=false,resolveDecision;
 const client=new ApolloClient({cache:new InMemoryCache(),link:new ApolloLink(op=>new Observable(observer=>{
  const name=op.operationName,input=op.variables.input;operations.push({name,input:structuredClone(input)});
  const send=data=>{observer.next({data});observer.complete();};
  if(name==='GetAttendanceNotifications') {
   if(failQuery || (failMore&&input.page>1)){observer.error(new Error('Network failure'));return;}
   const pending=requests.filter(r=>r.attendanceStatus==='PENDING');
   send({getAttendanceNotifications:{__typename:'Attendances',list:pending.slice((input.page-1)*input.limit,input.page*input.limit).map(r=>({...r})),metaCounter:[{total:pending.length}]}});
  } else if(name==='ReviewAttendance') {
   resolveDecision=(fail=false)=>{
    if(fail){observer.error(new Error('Network failure'));return;}
    const request=requests.find(r=>r._id===input._id);request.attendanceStatus=input.attendanceStatus;
    request.reviewedAt='2026-10-16T03:00:00Z';send({reviewAttendance:{...request}});
   };
  } else observer.error(new Error('Unexpected operation '+name));
 }))});
 const router={locale:'uz',pathname:'/',query:{},isReady:true,push:()=>Promise.resolve(true),prefetch:()=>Promise.resolve(),beforePopState(){},events:{on(){},off(){}}};
 const i18n=require('i18next').createInstance();await i18n.init({lng:'uz',ns:['common'],defaultNS:'common',resources:{uz:{common:require('../public/locales/uz/common.json')}}});
 const root=createRoot(document.getElementById('test-root'));
 await flush(()=>root.render(React.createElement(RouterContext.Provider,{value:router},React.createElement(I18nextProvider,{i18n},React.createElement(ApolloProvider,{client},React.createElement(ThemeProvider,{theme:createTheme({components:{MuiDialog:{defaultProps:{transitionDuration:0}}}})},React.createElement(AdminNotifications,{onLightBackground:true})))))));
 await flush();
 return {requests,operations,client,setQueryFailure(v){failQuery=v;},setMoreFailure(v){failMore=v;},
 async decide(fail=false){await flush(()=>resolveDecision(fail));await flush();},
 async open(){await flush(()=>document.querySelector('.quwat-navbar-notifications').click());await flush();},
 async cleanup(){await flush(()=>root.unmount());client.stop();}};
}
const cards=()=>[...document.querySelectorAll('.quwat-attendance-notification')];
const button=(root,text)=>[...root.querySelectorAll('button')].find(b=>b.textContent===text);
const badge=()=>document.querySelector('.quwat-navbar-notifications').getAttribute('aria-label');
const dialog=()=>document.querySelector('[aria-labelledby="quwat-attendance-notification-decision"]');

test('only authenticated ACTIVE ADMIN sees attendance notifications or requests the admin API',async()=>{
 for(const options of [{role:'CLIENT'},{role:'AGENT'},{status:'anonymous'},{status:'loading'},{memberStatus:'BLOCK'}]) {
  const ui=await setup(options);try{assert.equal(ui.operations.length,0);assert.equal(document.querySelector('.quwat-navbar-notifications'),null);}finally{await ui.cleanup();}
 }
});
test('pending-only attendance requests, including old dates and missing members, share a list without pagination',async()=>{
 const ui=await setup({count:23});try{
  ui.requests[0].memberData=null;ui.requests[0].attendanceDate='2026-09-01';
  await ui.open();assert.equal(cards().length,23);assert.match(badge(),/23 ta/);
  assert.deepEqual(ui.operations[0].input,{attendanceStatus:'PENDING',page:1,limit:100});
  assert.match(cards()[0].textContent,/#0003E9/);assert.match(cards()[0].textContent,/2026-09-01/);
  assert.ok(!document.querySelector('.MuiPagination-root'));
 }finally{await ui.cleanup();}
});
test('approve targets the selected request once and removes it while preserving attendance history',async()=>{
 const ui=await setup();try{
  await ui.open();await flush(()=>button(cards()[1],'Tasdiqlash').click());assert.match(dialog().textContent,/Agent 2/);
  await flush(()=>button(dialog(),'Tasdiqlash').click());await flush(()=>button(dialog(),'Tasdiqlash').click());
  assert.equal(ui.operations.filter(o=>o.name==='ReviewAttendance').length,1);assert.ok(button(cards()[0],'Rad etish').disabled);
  assert.deepEqual(ui.operations.find(o=>o.name==='ReviewAttendance').input,{_id:id(2),attendanceStatus:'APPROVED'});
  await ui.decide();assert.equal(cards().length,1);assert.match(badge(),/1 ta/);
  assert.equal(ui.requests.length,2);assert.equal(ui.requests[1].attendanceStatus,'APPROVED');assert.ok(!dialog());
 }finally{await ui.cleanup();}
});
test('rejection failures remain retryable and final decisions disappear from notifications',async()=>{
 const ui=await setup({count:1});try{
  await ui.open();await flush(()=>button(cards()[0],'Rad etish').click());await flush(()=>button(dialog(),'Rad etish').click());
  await ui.decide(true);assert.ok(dialog().querySelector('[role="alert"]'));assert.equal(cards().length,1);
  await flush(()=>button(dialog(),'Rad etish').click());await ui.decide();assert.equal(cards().length,0);assert.match(badge(),/0 ta/);
  assert.equal(ui.requests[0].attendanceStatus,'REJECTED');assert.match(document.body.textContent,/Hozircha davomat so‘rovlari yo‘q/);
 }finally{await ui.cleanup();}
});
test('focus refresh delivers new requests and external decisions, logout stops the subscription',async()=>{
 const ui=await setup({count:1});try{
  ui.requests.unshift(fixture(2));await flush(()=>window.dispatchEvent(new window.Event('focus')));await flush();assert.match(badge(),/2 ta/);
  assert.match(document.body.textContent,/Yangi davomat so‘rovi keldi/);
  await ui.open();ui.requests[0].attendanceStatus='APPROVED';await flush(()=>window.dispatchEvent(new window.Event('focus')));await flush();assert.equal(cards().length,1);
  await flush(()=>sessionVar({status:'anonymous',error:''}));const last=ui.operations.length;
  await flush(()=>window.dispatchEvent(new window.Event('focus')));assert.equal(ui.operations.length,last);assert.equal(document.querySelector('.quwat-navbar-notifications'),null);
 }finally{await ui.cleanup();}
});
test('100+ requests load automatically and partial-page failure can be retried',async()=>{
 const ui=await setup({count:105});try{
  ui.setMoreFailure(true);await ui.open();assert.ok(cards().length>=100);assert.ok(document.querySelector('[role="alert"]'));
  ui.setMoreFailure(false);await flush(()=>button(document,'Qayta urinish').click());await flush();assert.equal(cards().length,105);
  assert.ok(ui.operations.some(o=>o.input.page===2&&o.input.limit===100));
 }finally{await ui.cleanup();}
});
test('visible-page polling delivers a new attendance request within five seconds',async()=>{
 const ui=await setup({count:0});try{
  ui.requests.push(fixture(1));await act(async()=>{await new Promise(r=>setTimeout(r,5200));});await flush();
  assert.match(badge(),/1 ta/);assert.ok(ui.operations.filter(o=>o.name==='GetAttendanceNotifications').length>=2);
 }finally{await ui.cleanup();}
});
