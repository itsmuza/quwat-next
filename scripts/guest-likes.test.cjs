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
const ProductActions = require('../libs/components/product/ProductActions.tsx').default;
const owner = '507f1f77bcf86cd799439011';
const input = { page: 1, limit: 18, search: {} };
const fixture = (saved) => ({
 __typename: 'Product', _id: '507f1f77bcf86cd799439012', productName: 'Mahsulot', productImages: [],
 productType: 'ASBOBLAR', productStatus: 'ACTIVE', productUnit: 'DONA', productPrice: 25000,
 productQuantity: 10, productReservedQuantity: 0, productMinOrderQuantity: 1, productQuantityStep: 1,
 productBrand: null, productDesc: null, productLikes: 1, productViews: 1, productComments: 0,
 productRank: 0, archivedAt: null, createdAt: '2026-10-15', updatedAt: '2026-10-15', meSaved: saved, meLiked: [],
});
async function flush(action = () => {}) {
 await act(async () => { action(); await new Promise(resolve => setTimeout(resolve, 15)); });
}
const MemberLike = require('../libs/components/common/MemberLike.tsx').default;
const {GET_MEMBER} = require('../apollo/user/query.ts');
Object.defineProperty(window,'crypto',{configurable:true,value:require('node:crypto').webcrypto});
const {getGuestId} = require('../libs/guestLikes.ts');
const memberFixture=()=>({__typename:'Member',_id:owner,memberType:'AGENT',memberStatus:'ACTIVE',memberAuthType:'PHONE',
 memberPhone:'',memberNick:'agent',memberFullName:null,memberImage:null,memberAddress:null,memberDesc:null,memberPoints:0,
 memberLikes:5,memberViews:0,memberComments:0,memberRank:0,memberWarnings:0,memberBlocks:0,deletedAt:null,createdAt:'2026-10-16',updatedAt:'2026-10-16',meLiked:[],guestLiked:false});
async function setup({group='PRODUCT',status='anonymous',guestLiked=false,meLiked=false}={}) {
 userVar({...emptyUser,...(status==='authenticated'?{_id:owner,memberType:'CLIENT',memberStatus:'ACTIVE'}:{})});
 sessionVar({status,error:''});cart.deactivateCart?.();
 const entity=group==='PRODUCT'?{...fixture(false),guestLiked,meLiked:meLiked?[{memberId:owner,likeRefId:fixture(false)._id,myFavorite:true}]:[]}:{...memberFixture(),guestLiked,meLiked:meLiked?[{memberId:owner,likeRefId:owner,myFavorite:true}]:[]};
 const operations=[],deferred=[];let fail=false;
 const query=group==='PRODUCT'?GET_PRODUCTS:GET_MEMBER,variables=group==='PRODUCT'?{input}:{input:owner};
 const queryData=()=>group==='PRODUCT'?{getProducts:{list:[{...entity}],metaCounter:[{total:1}]}}:{getMember:{...entity}};
 const client=new ApolloClient({cache:new InMemoryCache({typePolicies:{Product:{keyFields:['_id'],fields:{meLiked:{merge:false}}},Member:{keyFields:['_id'],fields:{meLiked:{merge:false}}}}}),link:new ApolloLink(op=>new Observable(observer=>{
  operations.push({name:op.operationName,input:structuredClone(op.variables.input),headers:op.getContext().headers});
  const send=data=>{observer.next({data});observer.complete();};
  if(['GetProducts','GetMember'].includes(op.operationName)){send(queryData());return;}
  deferred.push(()=>{
   if(fail){observer.error(new Error('Network failure'));return;}
   if(op.operationName==='SetGuestLike'){
    const value=op.variables.input.liked;
    entity[group==='PRODUCT'?'productLikes':'memberLikes']+=(value===entity.guestLiked?0:value?1:-1);entity.guestLiked=value;
    send({setGuestLike:{__typename:'GuestLikeResult',likeRefId:entity._id,likeGroup:group,liked:value,likeCount:entity[group==='PRODUCT'?'productLikes':'memberLikes']}});
   } else if(['LikeTargetProduct','LikeTargetMember'].includes(op.operationName)){
    entity.meLiked=entity.meLiked.length?[]:[{memberId:owner,likeRefId:entity._id,myFavorite:true}];
    send({[group==='PRODUCT'?'likeTargetProduct':'likeTargetMember']:{...entity}});
   } else observer.error(new Error('Unexpected '+op.operationName));
  });
 }))});
 const i18n=require('i18next').createInstance();await i18n.init({lng:'uz',ns:['common'],defaultNS:'common',resources:{uz:{common:require('../public/locales/uz/common.json')}}});
 function Host(){const {data}=useQuery(query,{variables});if(!data)return null;const item=group==='PRODUCT'?data.getProducts.list[0]:data.getMember;
  return React.createElement(React.Fragment,null,...[1,2].map(key=>React.createElement('div',{key,className:'test-card'},group==='PRODUCT'?React.createElement(ProductActions,{product:item}):React.createElement(MemberLike,{member:item}))));}
 const root=createRoot(document.getElementById('test-root'));
 await flush(()=>root.render(React.createElement(RouterContext.Provider,{value:{locale:'uz',pathname:'/product',query:{}}},React.createElement(I18nextProvider,{i18n},React.createElement(ApolloProvider,{client},React.createElement(ThemeProvider,{theme:createTheme()},React.createElement(Host)))))));
 return {client,entity,operations,setFailure(v){fail=v;},async settle(){await flush(()=>deferred.shift()());await flush();},
 async refresh(){await flush(()=>{void client.refetchQueries({include:[group==='PRODUCT'?'GetProducts':'GetMember']});});},
 async cleanup(){await flush(()=>root.unmount());client.stop();}};
}
const likes=()=>[...document.querySelectorAll('button[aria-label="Yoqtirish"]')];
test('guest identity persists in the same browser, uses UUIDv4 and cannot be confused with member IDs',()=>{
 localStorage.clear();const first=getGuestId();assert.match(first,/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i);
 assert.equal(getGuestId(),first);assert.equal(localStorage.getItem('quwat:guest-id'),first);assert.notEqual(first,owner);
 const other='11111111-1111-4111-8111-111111111111';localStorage.setItem('quwat:guest-id',other);assert.equal(getGuestId(),other);
});
for(const group of ['PRODUCT','MEMBER']) {
 test(`anonymous ${group} likes synchronize duplicate cards, persist on refetch and unlike correctly`,async()=>{
  const ui=await setup({group});try{
   assert.ok(likes().every(b=>b.getAttribute('aria-pressed')==='false'));
   await flush(()=>{likes()[0].click();likes()[0].click();});
   assert.equal(ui.operations.filter(o=>o.name==='SetGuestLike').length,1);assert.ok(likes()[0].disabled);
   assert.deepEqual(ui.operations.find(o=>o.name==='SetGuestLike').input,{likeGroup:group,likeRefId:ui.entity._id,liked:true});
   assert.equal(ui.operations.find(o=>o.name==='SetGuestLike').headers['x-quwat-guest-id'],getGuestId());
   await ui.settle();assert.ok(likes().every(b=>b.getAttribute('aria-pressed')==='true'));
   await ui.refresh();assert.ok(likes().every(b=>b.getAttribute('aria-pressed')==='true'));
   await flush(()=>likes()[1].click());await ui.settle();assert.ok(likes().every(b=>b.getAttribute('aria-pressed')==='false'));
   assert.equal(ui.entity[group==='PRODUCT'?'productLikes':'memberLikes'],group==='PRODUCT'?1:5);
   assert.ok(!ui.operations.some(o=>['LikeTargetProduct','LikeTargetMember','SaveProduct','RequestSale'].includes(o.name)));
   assert.equal(document.querySelector('.quwat-product-bookmark'),null);assert.equal(document.querySelector('.quwat-cart-add'),null);
  }finally{await ui.cleanup();}
 });
 test(`${group} failure preserves the old count/state and can be retried`,async()=>{
  const ui=await setup({group});try{
   ui.setFailure(true);await flush(()=>likes()[0].click());await ui.settle();assert.equal(likes()[0].getAttribute('aria-pressed'),'false');
   assert.ok(document.querySelector('[role="alert"]'));ui.setFailure(false);await flush(()=>likes()[0].click());await ui.settle();
   assert.equal(likes()[0].getAttribute('aria-pressed'),'true');
  }finally{await ui.cleanup();}
 });
 test(`authenticated ${group} likes retain member APIs and ignore guest state`,async()=>{
  const ui=await setup({group,status:'authenticated',guestLiked:true});try{
   assert.equal(likes()[0].getAttribute('aria-pressed'),'false');await flush(()=>likes()[0].click());await ui.settle();
   assert.ok(ui.operations.some(o=>o.name===(group==='PRODUCT'?'LikeTargetProduct':'LikeTargetMember')));assert.ok(!ui.operations.some(o=>o.name==='SetGuestLike'));
  }finally{await ui.cleanup();}
 });
 test(`${group} loading/error sessions cannot accidentally submit a guest like`,async()=>{
  for(const status of ['loading','error']){const ui=await setup({group,status});try{assert.ok(likes().every(b=>b.disabled));await flush(()=>likes()[0].click());assert.ok(!ui.operations.some(o=>o.name==='SetGuestLike'));}finally{await ui.cleanup();}}
 });
}
