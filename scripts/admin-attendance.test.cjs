const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const ts = require('typescript');
const dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', {
	url: 'http://localhost/', pretendToBeVisual: true,
});
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'DocumentFragment', 'Image'])
	Object.defineProperty(global, name, { configurable: true, value: name === 'window' ? dom.window : dom.window[name] });
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
global.IS_REACT_ACT_ENVIRONMENT = true;
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(
	fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
		jsx: ts.JsxEmit.React, esModuleInterop: true } },
).outputText, file);
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act, Simulate } = require('react-dom/test-utils');
const { ApolloProvider, ApolloClient, InMemoryCache, ApolloLink, Observable } = require('@apollo/client');
const { ThemeProvider, createTheme } = require('@mui/material/styles');
const { I18nextProvider } = require('react-i18next');
const { RouterContext } = require('next/dist/shared/lib/router-context.shared-runtime');
const { tashkentDate } = require('../libs/attendance.ts');
const Module = require('node:module');
const originalLoad = Module._load;
let AttendanceAdmin;
try {
	Module._load = function(request, parent, ...args) {
		if (request.endsWith('/layout/LayoutAdmin')) return { __esModule: true, default: Component => Component };
		return originalLoad.call(this, request, parent, ...args);
	};
	AttendanceAdmin = require('../pages/_admin/attendance/index.tsx').default;
} finally { Module._load = originalLoad; }
async function flush(action = () => {}) {
	await act(async () => { action(); await new Promise(resolve => setTimeout(resolve, 25)); });
}
const id = n => n.toString(16).padStart(24, '0');
const date = tashkentDate();
const member = n => ({ __typename: 'Member', _id: id(n), memberType: 'AGENT', memberStatus: 'ACTIVE', memberAuthType: 'PHONE',
	memberPhone: '', memberNick: 'agent'+n, memberFullName: n === 2 ? 'Second Agent' : null,
	memberImage: n === 2 ? '/img/profile/defaultUser.svg' : null, memberAddress: null, memberDesc: null,
	memberPoints: 0, memberLikes: 0, memberViews: 0, memberComments: 0, memberRank: 0,
	memberWarnings: 0, memberBlocks: 0, deletedAt: null, guestLiked: false, meLiked: [], createdAt: date, updatedAt: date });
async function setup({ count = 8, failMembers = false } = {}) {
	const roster = Array.from({ length: count }, (_, i) => member(i+1));
	const operations = [], approved = new Set();
	let fail = failMembers, resolveReview;
	const requestFor = memberId => ({ _id: id(1000 + Number.parseInt(memberId,16)), memberId,
		attendanceDate: date, attendanceStatus: approved.has(memberId) ? 'APPROVED' : 'PENDING',
		reviewedAt: null, createdAt: date, updatedAt: date, memberData: null });
	const client = new ApolloClient({ cache: new InMemoryCache(), link: new ApolloLink(operation => new Observable(observer => {
		operations.push({ name: operation.operationName, variables: operation.variables });
		const input = operation.variables.input;
		let data;
		if (operation.operationName === 'GetAllMembersByAdmin') {
			if (fail) { observer.error(new Error('Network failure')); return; }
			data = { getAllMembersByAdmin: { list: roster.slice((input.page-1)*input.limit, input.page*input.limit), metaCounter: [{ total: count }] } };
		} else if (operation.operationName === 'GetAgentAttendancesByAdmin') {
			const request = requestFor(input.memberId);
			data = { getAgentAttendancesByAdmin: { list: date >= input.fromDate && date <= input.toDate ? [{
				memberId: input.memberId, attendanceDate: date, attendanceStatus: request.attendanceStatus,
				attendanceId: request._id, requestedAt: date, reviewedAt: null,
			}] : [], metaCounter: [{ total: 1 }] } };
		} else if (operation.operationName === 'GetAllAttendancesByAdmin') {
			data = { getAllAttendancesByAdmin: { list: approved.has(input.memberId) ? [] : [requestFor(input.memberId)],
				metaCounter: [{ total: approved.has(input.memberId) ? 0 : 1 }] } };
		} else if (operation.operationName === 'ReviewAttendance') {
			resolveReview = (error = false) => {
				if (error) { observer.error(new Error('Network failure')); return; }
				const memberId = id(Number.parseInt(input._id,16)-1000);
				approved.add(memberId);
				observer.next({ data: { reviewAttendance: { ...requestFor(memberId), attendanceStatus: input.attendanceStatus } } });
				observer.complete();
			};
			return;
		} else { observer.error(new Error('Unexpected operation: '+operation.operationName)); return; }
		observer.next({ data }); observer.complete();
	})) });
	const i18n = require('i18next').createInstance();
	await i18n.init({ lng: 'uz', ns: ['common'], defaultNS: 'common', resources: { uz: { common: require('../public/locales/uz/common.json') } } });
	const router = { locale: 'uz', pathname: '/_admin/attendance', query: {}, isReady: true };
	const root = createRoot(document.getElementById('test-root'));
	await flush(() => root.render(React.createElement(RouterContext.Provider, { value: router },
		React.createElement(I18nextProvider, { i18n }, React.createElement(ApolloProvider, { client },
			React.createElement(ThemeProvider, { theme: createTheme({ components: { MuiDialog: { defaultProps: { transitionDuration: 0 } } } }) }, React.createElement(AttendanceAdmin)))))));
	await flush();
	return { roster, operations, setFail(value) { fail = value; }, async finishReview(error = false) { await flush(() => resolveReview(error)); await flush(); },
		async cleanup() { await flush(() => root.unmount()); client.stop(); } };
}
const agents = () => [...document.querySelectorAll('.quwat-attendance-agent')];
const button = text => [...document.querySelectorAll('button')].find(b => b.textContent === text);

test('agent strip remains above the calendar, selects the first agent and switches calendar IDs with avatars', async () => {
	const ui = await setup();
	try {
		assert.equal(agents().length, 8);
		assert.ok(agents().every(b => b.querySelector('.MuiAvatar-root img')));
		assert.equal(agents()[0].getAttribute('aria-pressed'), 'true');
		const strip = document.querySelector('.quwat-attendance-agents');
		assert.ok(strip.compareDocumentPosition(document.querySelector('.quwat-attendance-calendar')) & Node.DOCUMENT_POSITION_FOLLOWING);
		assert.equal(ui.operations.find(o => o.name === 'GetAllMembersByAdmin').variables.input.search.memberType, 'AGENT');
		await flush(() => agents()[1].click()); await flush();
		assert.equal(agents().length, 8);
		assert.equal(agents()[1].getAttribute('aria-pressed'), 'true');
		assert.equal(document.querySelector('h5').textContent, 'Second Agent');
		assert.equal(ui.operations.filter(o => o.name === 'GetAgentAttendancesByAdmin').at(-1).variables.input.memberId, id(2));
		assert.equal(ui.operations.filter(o => o.name === 'GetAllMembersByAdmin').length, 1);
	} finally { await ui.cleanup(); }
});

test('month browsing preserves the agent and pending queue remains independent of the viewed month', async () => {
	const ui = await setup();
	try {
		await flush(() => agents()[1].click()); await flush();
		const prior = new Date(date+'T12:00:00Z'); prior.setUTCMonth(prior.getUTCMonth()-1, 1);
		const month = prior.toISOString().slice(0,7);
		await flush(() => Simulate.change(document.querySelector('input[type="month"]'), { target: { value: month } })); await flush();
		const calendar = ui.operations.filter(o => o.name === 'GetAgentAttendancesByAdmin').at(-1).variables.input;
		assert.equal(calendar.memberId, id(2)); assert.equal(calendar.fromDate, month+'-01');
		const pending = ui.operations.filter(o => o.name === 'GetAllAttendancesByAdmin').at(-1).variables.input;
		assert.equal(pending.memberId, id(2)); assert.equal(pending.attendanceStatus, 'PENDING');
		assert.equal(pending.fromDate, undefined);
		assert.ok(button('Ko‘rib chiqish'));
		assert.equal(agents()[1].getAttribute('aria-pressed'), 'true');
	} finally { await ui.cleanup(); }
});

test('review targets the selected agent, locks selection while submitting and refreshes calendar/queue', async () => {
	const ui = await setup();
	try {
		await flush(() => agents()[1].click()); await flush();
		await flush(() => button('Ko‘rib chiqish').click());
		assert.match(document.querySelector('[role="dialog"]').textContent, /Second Agent/);
		await flush(() => button('Tasdiqlash').click());
		assert.ok(agents().every(b => b.disabled));
		assert.deepEqual(ui.operations.find(o => o.name === 'ReviewAttendance').variables.input,
			{ _id: id(1002), attendanceStatus: 'APPROVED' });
		await flush(() => agents()[0].click());
		assert.equal(agents()[1].getAttribute('aria-pressed'), 'true');
		await ui.finishReview(true);
		assert.ok(agents().every(b => !b.disabled));
		assert.ok(document.querySelector('[role="dialog"] [role="alert"]'));
		await flush(() => button('Tasdiqlash').click());
		await ui.finishReview();
		assert.ok(agents().every(b => !b.disabled));
		assert.ok(!document.querySelector('[role="dialog"]'));
		assert.ok(document.querySelector('.quwat-calendar-day.APPROVED'));
		assert.ok(!button('Ko‘rib chiqish'));
		assert.ok(ui.operations.filter(o => o.name === 'GetAgentAttendancesByAdmin' && o.variables.input.memberId === id(2)).length >= 2);
	} finally { await ui.cleanup(); }
});

test('empty/error roster sends no attendance query and retry auto-selects an agent', async () => {
	const empty = await setup({ count: 0 });
	try {
		assert.match(document.body.textContent, /Agentlar topilmadi/);
		assert.deepEqual(empty.operations.map(o => o.name), ['GetAllMembersByAdmin']);
	} finally { await empty.cleanup(); }
	const failed = await setup({ failMembers: true });
	try {
		assert.ok(document.querySelector('[role="alert"]'));
		assert.ok(!document.querySelector('.quwat-attendance-calendar'));
		failed.setFail(false); await flush(() => button('Qayta urinish').click()); await flush();
		assert.equal(agents().length, 8);
		assert.ok(document.querySelector('.quwat-attendance-calendar'));
	} finally { await failed.cleanup(); }
});

test('existing roster pagination keeps all agents accessible and selects the first agent on a new page', async () => {
	const ui = await setup({ count: 25 });
	try {
		assert.equal(agents().length, 20);
		await flush(() => document.querySelector('[aria-label="Go to page 2"]').click()); await flush();
		assert.equal(agents().length, 5);
		assert.equal(agents()[0].getAttribute('aria-pressed'), 'true');
		assert.equal(agents()[0].textContent, 'agent21');
		assert.equal(ui.operations.filter(o => o.name === 'GetAgentAttendancesByAdmin').at(-1).variables.input.memberId, id(21));
	} finally { await ui.cleanup(); }
});
