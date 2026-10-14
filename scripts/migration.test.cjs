require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { parseInquiry, validateProduct, money, totalOf } = require('../libs/product.ts');
const { tashkentDate, validDate, validRange } = require('../libs/attendance.ts');
const { isAuthError } = require('../libs/auth/session.ts');
const { ProductUnit, ProductType } = require('../libs/enums/product.enum.ts');
const { loadAdminProduct } = require('../libs/adminProduct.ts');
const { errorText } = require('../libs/feedback.ts');
const cart = require('../libs/cart.ts');
const { MemberType, MemberStatus, MemberAuthType } = require('../libs/enums/member.enum.ts');
const { userVar, sessionVar, emptyUser } = require('../apollo/store.ts');
const Module = require('module');
const originalLoad = Module._load;
test('GraphQL validation feedback exposes the server reason and translates comment errors', () => {
	const validationError = (message) => ({
		graphQLErrors: [{ message: 'Bad Request Exception', extensions: { originalError: { message } } }],
	});
	assert.equal(
		errorText(validationError(['commentContent must be longer than or equal to 1 characters'])),
		'Izoh 1–100 belgidan iborat bo‘lishi kerak.',
	);
	assert.equal(
		errorText(validationError(['commentRefId must be a mongodb id'])),
		'Izoh yoziladigan sahifani yangilab, qayta urinib ko‘ring.',
	);
	assert.equal(
		errorText(validationError(['page must not be less than 1', 'limit must not be greater than 100'])),
		'page must not be less than 1, limit must not be greater than 100',
	);
	assert.equal(
		errorText({ message: 'Bad Request Exception' }),
		'Kiritilgan ma’lumotlarni tekshirib, qayta urinib ko‘ring.',
	);
	assert.equal(errorText({ graphQLErrors: [{ message: 'Wrong password' }] }), 'Parol noto‘g‘ri. Qayta urinib ko‘ring.');
});
let responses = {},
	calls = [];
const fakeClient = {
	async query(options) {
		const name = options.query.definitions.find((d) => d.kind === 'OperationDefinition').name.value;
		calls.push({ name, options });
		if (responses[name] instanceof Error) throw responses[name];
		return { data: responses[name] };
	},
	async mutate(options) {
		const name = options.mutation.definitions.find((d) => d.kind === 'OperationDefinition').name.value;
		calls.push({ name, options });
		if (responses[name] instanceof Error) throw responses[name];
		return { data: responses[name] };
	},
	async clearStore() {
		calls.push({ name: 'clearStore' });
	},
};
Module._load = function (request, parent, ...rest) {
	if (
		request.endsWith('/apollo/client') &&
		(parent?.filename.endsWith('/libs/auth/index.ts') || parent?.filename.endsWith('/libs/upload.ts'))
	)
		return { initializeApollo: () => fakeClient };
	return originalLoad.call(this, request, parent, ...rest);
};
const auth = require('../libs/auth/index.ts');
const { uploadImages } = require('../libs/upload.ts');
Module._load = originalLoad;
const storage = new Map();
global.localStorage = {
	getItem: (key) => storage.get(key) || null,
	setItem: (key, value) => storage.set(key, value),
	removeItem: (key) => storage.delete(key),
};
global.window = { dispatchEvent() {} };
const id = '507f1f77bcf86cd799439011';
const jwt = (claims = { _id: id, exp: Math.floor(Date.now() / 1000) + 3600 }) =>
	`e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.fixture`;
const member = (role) => ({
	...emptyUser,
	_id: id,
	memberNick: 'tester',
	memberPhone: '123',
	memberType: role,
	memberStatus: MemberStatus.ACTIVE,
	memberAuthType: MemberAuthType.PHONE,
	accessToken: jwt(),
});
function reset() {
	storage.clear();
	calls = [];
	responses = {};
	userVar({ ...emptyUser });
	sessionVar({ status: 'anonymous', error: '' });
}

test('catalog URLs cannot inject owner/status or unsupported sort and handle invalid JSON', () => {
	const parsed = parseInquiry(
		JSON.stringify({
			page: -1,
			limit: 101,
			sort: 'memberId',
			search: {
				memberId: id,
				productStatus: 'DRAFT',
				typeList: ['ASBOBLAR', 'HOUSE'],
				unitList: ['DONA', 'PIECE'],
				text: '  mix  ',
				pricesRange: { start: -10, end: 4000000000 },
				inStock: true,
			},
		}),
	);
	assert.equal(parsed.page, 1);
	assert.equal(parsed.limit, 20);
	assert.equal(parsed.sort, 'createdAt');
	assert.deepEqual(parsed.search, {
		text: 'mix',
		inStock: true,
		typeList: ['ASBOBLAR'],
		unitList: ['DONA'],
		pricesRange: { end: 4000000000 },
	});
	assert.deepEqual(parseInquiry('{broken').search, {});
	assert.deepEqual(parseInquiry(['{}']).search, {});
});
test('catalog ranges, maximum filters, pagination and sort survive a valid URL round trip', () => {
	const input = {
		page: 3,
		limit: 100,
		sort: 'productPrice',
		direction: 'ASC',
		search: {
			brandList: [' A ', 'A'],
			pricesRange: { start: 4000000000, end: Number.MAX_SAFE_INTEGER },
			periodsRange: { start: '2026-10-01T00:00:00.000Z', end: '2026-10-12T23:59:59.999Z' },
			unitList: ['METR'],
		},
	};
	const parsed = parseInquiry(JSON.stringify(input));
	assert.equal(parsed.page, 3);
	assert.equal(parsed.limit, 100);
	assert.deepEqual(parsed.search.brandList, ['A']);
	assert.equal(parsed.search.pricesRange.end, Number.MAX_SAFE_INTEGER);
	assert.deepEqual(parsed.search.periodsRange, input.search.periodsRange);
	assert.equal(
		parseInquiry(JSON.stringify({ search: { pricesRange: { start: 2, end: 1 } } })).search.pricesRange,
		undefined,
	);
});
test('WholeSom allows prices beyond GraphQL Int but rejects decimals, negatives and unsafe integers', () => {
	const product = {
		productName: '  Bolg‘a  ',
		productType: ProductType.ASBOBLAR,
		productUnit: ProductUnit.DONA,
		productPrice: 4000000000,
	};
	assert.equal(validateProduct(product), null);
	assert.match(money(4000000000), /so‘m/);
	for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN])
		assert.ok(validateProduct({ ...product, productPrice: value }));
});
test('unit minimum and step enforce whole packaged units, precision and divisibility', () => {
	const base = {
		productName: 'Mahsulot',
		productType: ProductType.ASBOBLAR,
		productUnit: ProductUnit.DONA,
		productPrice: 1,
	};
	assert.ok(validateProduct({ ...base, productMinOrderQuantity: 1.5 }));
	assert.ok(validateProduct({ ...base, productMinOrderQuantity: 3, productQuantityStep: 2 }));
	assert.equal(
		validateProduct({
			...base,
			productUnit: ProductUnit.METR,
			productMinOrderQuantity: 0.003,
			productQuantityStep: 0.001,
		}),
		null,
	);
	assert.ok(validateProduct({ ...base, productUnit: ProductUnit.KG, productQuantityStep: 0.0001 }));
	assert.ok(validateProduct({ ...base, productName: ' x ' }));
});
test('Tashkent midnight and strict date ranges do not depend on browser timezone', () => {
	assert.equal(tashkentDate(new Date('2026-10-11T18:59:59Z')), '2026-10-11');
	assert.equal(tashkentDate(new Date('2026-10-11T19:00:00Z')), '2026-10-12');
	assert.equal(validDate('2026-02-30'), false);
	assert.equal(validDate('2028-02-29'), true);
	assert.equal(validRange('2026-10-13', '2026-10-12'), false);
	assert.equal(validRange('', ''), true);
});
test('admin stock accepts zero/whole/metric totals and rejects below-reserved or invalid quantities', () => {
	const product = {
		productName: 'Bolg‘a',
		productType: ProductType.ASBOBLAR,
		productUnit: ProductUnit.DONA,
		productPrice: 65000,
	};
	for (const quantity of [0, 25, 1000000000])
		assert.equal(validateProduct({ ...product, productQuantity: quantity }), null);
	for (const quantity of [-1, 1.5, 1000000001, NaN, Infinity])
		assert.ok(validateProduct({ ...product, productQuantity: quantity }));
	assert.ok(validateProduct({ ...product, productQuantity: 2 }, 3));
	assert.equal(validateProduct({ ...product, productQuantity: 3 }, 3), null);
	assert.equal(validateProduct({ ...product, productUnit: ProductUnit.KG, productQuantity: 10.125 }, 0.125), null);
	assert.ok(validateProduct({ ...product, productUnit: ProductUnit.METR, productQuantity: 10.1234 }));
});
test('empty backend counters and nullable metadata yield a usable zero total', () => {
	assert.equal(totalOf({ metaCounter: [] }), 0);
	assert.equal(totalOf({ metaCounter: null }), 0);
	assert.equal(totalOf({ metaCounter: [{ total: 42 }] }), 42);
});
test('admin detail resolves an archived product beyond the first page without the public detail API', async () => {
	const inquiries = [];
	const archived = { _id: id, productStatus: 'ARCHIVED' };
	const client = {
		async query({ query, variables }) {
			assert.equal(query.definitions.find((d) => d.kind === 'OperationDefinition').name.value, 'GetAllProductsByAdmin');
			inquiries.push(variables.input);
			return {
				data: {
					getAllProductsByAdmin: {
						list: variables.input.page === 1 ? Array.from({ length: 100 }, (_, i) => ({ _id: String(i) })) : [archived],
						metaCounter: [{ total: 101 }],
					},
				},
			};
		},
	};
	assert.equal(await loadAdminProduct(client, id), archived);
	assert.deepEqual(
		inquiries.map((input) => input.page),
		[1, 2],
	);
	assert.ok(inquiries.every((input) => input.limit === 100 && Object.keys(input.search).length === 0));
});
test('admin detail stops for missing products, cancellation and query failures', async () => {
	let calls = 0;
	const client = {
		async query() {
			calls += 1;
			return { data: { getAllProductsByAdmin: { list: [], metaCounter: [] } } };
		},
	};
	assert.equal(await loadAdminProduct(client, id, () => false), null);
	assert.equal(calls, 0);
	assert.equal(await loadAdminProduct(client, id), null);
	assert.equal(calls, 1);
	await assert.rejects(
		loadAdminProduct(
			{
				query: async () => {
					throw new Error('Network unavailable');
				},
			},
			id,
		),
		/Network unavailable/,
	);
});
test('permission conflicts and ordinary network failures are not classified as expired sessions', () => {
	assert.equal(isAuthError({ graphQLErrors: [{ message: 'Allowed only for members with specific roles!' }] }), false);
	assert.equal(isAuthError({ networkError: { statusCode: 500 } }), false);
	assert.equal(isAuthError({ graphQLErrors: [{ message: 'You are not authenticated, please login first!' }] }), true);
	assert.equal(isAuthError({ networkError: { statusCode: 401 } }), true);
});
test('login stores current Member data instead of inventing roles from the JWT', async () => {
	for (const role of Object.values(MemberType)) {
		reset();
		responses.Login = { login: member(role) };
		await auth.logIn('tester', 'secret');
		assert.equal(userVar().memberType, role);
		assert.equal(userVar().memberNick, 'tester');
		assert.equal(userVar().accessToken, undefined);
		assert.equal(sessionVar().status, 'authenticated');
		assert.ok(calls.some((c) => c.name === 'clearStore'));
	}
});
test('failed login propagates the error and does not create an authenticated session', async () => {
	reset();
	responses.Login = new Error('Wrong password');
	await assert.rejects(auth.logIn('tester', 'wrong'), /Wrong password/);
	assert.equal(userVar()._id, '');
	assert.equal(storage.size, 0);
});
test('public signup never sends a role or ownership field', async () => {
	reset();
	responses.Signup = { signup: member(MemberType.CLIENT) };
	await auth.signUp('tester', 'secret', '123');
	const call = calls.find((c) => c.name === 'Signup');
	assert.deepEqual(call.options.variables.input, {
		memberNick: 'tester',
		memberPassword: 'secret',
		memberPhone: '123',
	});
	assert.equal(userVar().memberType, 'CLIENT');
});
test('refresh validates auth before looking up the member and uses the latest role', async () => {
	reset();
	storage.set('accessToken', jwt());
	responses.CheckAuth = { checkAuth: 'hi tester' };
	responses.GetMember = { getMember: member(MemberType.AGENT) };
	await auth.restoreSession();
	assert.deepEqual(
		calls.map((c) => c.name),
		['CheckAuth', 'GetMember'],
	);
	assert.equal(userVar().memberType, 'AGENT');
	assert.deepEqual(calls[1].options.variables, { input: id });
});
test('expired and malformed identity tokens trigger no profile request', async () => {
	for (const token of [jwt({ _id: id, exp: 1 }), jwt({ _id: 'bad', exp: 9999999999 }), 'broken']) {
		reset();
		storage.set('accessToken', token);
		await auth.restoreSession();
		assert.equal(calls.length, 0);
		assert.equal(sessionVar().status, 'anonymous');
		assert.equal(storage.size, 0);
	}
});
test('network restoration errors allow retry while blocked or mismatched profiles deny access', async () => {
	reset();
	storage.set('accessToken', jwt());
	responses.CheckAuth = new Error('network');
	await auth.restoreSession();
	assert.equal(sessionVar().status, 'error');
	assert.ok(storage.get('accessToken'));
	responses.CheckAuth = { checkAuth: 'ok' };
	responses.GetMember = { getMember: { ...member(MemberType.ADMIN), memberStatus: 'BLOCK' } };
	await auth.restoreSession();
	assert.equal(sessionVar().status, 'anonymous');
	assert.equal(storage.size, 0);
	reset();
	storage.set('accessToken', jwt());
	responses.CheckAuth = { checkAuth: 'ok' };
	responses.GetMember = { getMember: { ...member(MemberType.ADMIN), _id: '507f1f77bcf86cd799439012' } };
	await auth.restoreSession();
	assert.equal(sessionVar().status, 'anonymous');
});
test('logout resets user and clears the previous account cache', async () => {
	reset();
	responses.Login = { login: member(MemberType.CLIENT) };
	await auth.logIn('tester', 'secret');
	await auth.logOut();
	assert.equal(userVar()._id, '');
	assert.equal(sessionVar().status, 'anonymous');
	assert.equal(storage.size, 0);
	assert.equal(calls.filter((c) => c.name === 'clearStore').length, 2);
});

test('uploads reject unsupported files and excessive selections before a request', async () => {
	reset();
	const png = new File(['fixture'], 'test.png', { type: 'image/png' });
	await assert.rejects(uploadImages([], 'product'));
	await assert.rejects(uploadImages(Array(6).fill(png), 'product'));
	await assert.rejects(uploadImages([new File(['fixture'], 'test.txt', { type: 'text/plain' })], 'product'));
	assert.equal(calls.length, 0);
});
test('product upload sends the actual file list and rejects partial image results', async () => {
	reset();
	const files = [new File(['a'], 'a.png', { type: 'image/png' }), new File(['b'], 'b.jpg', { type: 'image/jpeg' })];
	responses.ImagesUploader = { imagesUploader: ['uploads/product/a.png', 'uploads/product/b.jpg'] };
	assert.equal((await uploadImages(files, 'product')).length, 2);
	assert.deepEqual(calls[0].options.variables, { files, target: 'product' });
	responses.ImagesUploader = { imagesUploader: ['uploads/product/a.png'] };
	await assert.rejects(uploadImages(files, 'product'), /rasmlar yuklanmadi/);
});
test('profile upload is restricted to one file and returns a member path', async () => {
	reset();
	const png = new File(['fixture'], 'test.png', { type: 'image/png' });
	await assert.rejects(uploadImages([png, png], 'member'));
	responses.ImageUploader = { imageUploader: 'uploads/member/test.png' };
	assert.deepEqual(await uploadImages([png], 'member'), ['uploads/member/test.png']);
	assert.equal(calls[0].options.variables.target, 'member');
});

const cartProductFixture = (extra = {}) => ({
	_id: '607f1f77bcf86cd799439011',
	productName: 'Test mahsulot',
	productImages: [],
	productUnit: ProductUnit.DONA,
	productStatus: 'ACTIVE',
	productPrice: 25000,
	productQuantity: 10,
	productReservedQuantity: 2,
	productMinOrderQuantity: 1,
	productQuantityStep: 1,
	...extra,
});
function clientCart(idValue = id) {
	reset();
	userVar({ ...member(MemberType.CLIENT), _id: idValue });
	sessionVar({ status: 'authenticated', error: '' });
	cart.activateCart(idValue);
}
test('cart is client-only and adding twice increments one line independently of Saved', () => {
	clientCart();
	const product = cartProductFixture({ meSaved: true });
	assert.equal(cart.addToCart(product), null);
	assert.equal(cart.addToCart(product), null);
	assert.equal(cart.cartVar().lines.length, 1);
	assert.equal(cart.cartVar().lines[0].quantity, '2');
	assert.equal(cart.cartTotal(cart.cartVar().lines), 50000);
	assert.equal(product.meSaved, true);
	assert.deepEqual(JSON.parse(storage.get(cart.cartKey(id))).items, [{ productId: product._id, quantity: '2' }]);
	for (const role of [MemberType.ADMIN, MemberType.AGENT]) {
		userVar(member(role));
		cart.activateCart(id);
		assert.notEqual(cart.addToCart(product), null);
		assert.equal(cart.cartVar().lines.length, 0);
	}
	reset();
	cart.activateCart('');
	assert.notEqual(cart.addToCart(product), null);
});
test('cart quantity respects stock minus reservations, minimum, step and packaged-unit precision', () => {
	const p = cartProductFixture({ productMinOrderQuantity: 2, productQuantityStep: 2 });
	assert.equal(cart.quantityError(p, '2'), null);
	for (const input of ['', '0', '-1', '1', '3', '2.5', '10', 'NaN', '1000000001'])
		assert.ok(cart.quantityError(p, input));
	const metric = cartProductFixture({
		productUnit: ProductUnit.METR,
		productMinOrderQuantity: 0.001,
		productQuantityStep: 0.001,
		productQuantity: 0.3,
		productReservedQuantity: 0.1,
	});
	assert.equal(cart.stockAvailable(metric), 0.2);
	assert.equal(cart.quantityError(metric, '0.2'), null);
	assert.ok(cart.quantityError(metric, '0.201'));
	assert.ok(cart.quantityError(metric, '0.0001'));
	clientCart();
	assert.ok(cart.addToCart(cartProductFixture({ productStatus: 'ARCHIVED' })));
	assert.ok(cart.addToCart(cartProductFixture({ productQuantity: 0, productReservedQuantity: 0 })));
});
test('cart arithmetic rounds each metric line exactly and rejects unsafe line or combined totals', () => {
	const metric = cartProductFixture({
		productUnit: ProductUnit.KG,
		productMinOrderQuantity: 0.001,
		productQuantityStep: 0.001,
		productPrice: 100,
	});
	const line = (product, quantity) => ({ productId: product._id, product, quantity });
	assert.equal(cart.lineTotal(line(metric, '1.005')), 101);
	assert.equal(cart.lineTotal(line(metric, '0.005')), 1);
	assert.equal(cart.lineTotal(line(metric, '0.004')), 0);
	assert.equal(cart.cartTotal([line(metric, '1.005'), line(metric, '0.005')]), 102);
	assert.equal(cart.lineTotal(line(cartProductFixture({ productPrice: 4000000000 }), '2')), 8000000000);
	const huge = cartProductFixture({ productPrice: Number.MAX_SAFE_INTEGER });
	assert.equal(cart.lineTotal(line(huge, '2')), null);
	assert.equal(cart.cartTotal([line(huge, '1'), line(huge, '1')]), null);
	assert.equal(cart.lineTotal(line(metric, '')), null);
});
test('cart restoration rejects malformed/duplicate records and stores no stale price snapshots', () => {
	assert.deepEqual(cart.decodeCart('{broken'), []);
	assert.deepEqual(cart.decodeCart(JSON.stringify({ version: 2, items: [] })), []);
	const p = cartProductFixture();
	const lines = cart.decodeCart(
		JSON.stringify({
			version: 1,
			items: [
				{ productId: 'bad', quantity: 1 },
				{ productId: p._id, quantity: '2', productPrice: 1 },
				{ productId: p._id, quantity: '3' },
			],
		}),
	);
	assert.equal(lines.length, 1);
	assert.equal(lines[0].quantity, '2');
	assert.equal(lines[0].product, null);
});
test('cart persists across refresh, isolates accounts and removes only the selected line', async () => {
	clientCart();
	const first = cartProductFixture(),
		second = cartProductFixture({ _id: '607f1f77bcf86cd799439012' });
	cart.addToCart(first);
	cart.addToCart(second);
	cart.setCartQuantity(first._id, '3');
	const other = '507f1f77bcf86cd799439099';
	userVar({ ...member(MemberType.CLIENT), _id: other });
	cart.activateCart(other);
	assert.equal(cart.cartVar().lines.length, 0);
	userVar(member(MemberType.CLIENT));
	cart.activateCart(id);
	assert.equal(cart.cartVar().lines.length, 2);
	assert.equal(cart.cartVar().lines[0].quantity, '3');
	await cart.refreshCart({
		query: async ({ variables }) => ({ data: { getProduct: variables.productId === first._id ? first : second } }),
	});
	assert.equal(cart.cartTotal(cart.cartVar().lines), 100000);
	cart.removeFromCart(first._id);
	assert.deepEqual(
		cart.cartVar().lines.map((line) => line.productId),
		[second._id],
	);
});
test('cart refresh updates prices and availability, preserves typed quantities and supports retry', async () => {
	clientCart();
	const p = cartProductFixture();
	cart.addToCart(p);
	await cart.refreshCart({
		query: async () => {
			throw new Error('Network error');
		},
	});
	assert.equal(cart.cartTotal(cart.cartVar().lines), null);
	let resolve;
	const pending = cart.refreshCart({
		query: () =>
			new Promise((done) => {
				resolve = done;
			}),
	});
	cart.setCartQuantity(p._id, '3');
	resolve({ data: { getProduct: { ...p, productPrice: 30000 } } });
	await pending;
	assert.equal(cart.cartVar().lines[0].quantity, '3');
	assert.equal(cart.cartTotal(cart.cartVar().lines), 90000);
	await cart.refreshCart({ query: async () => ({ data: { getProduct: { ...p, productQuantity: 3 } } }) });
	assert.equal(cart.cartTotal(cart.cartVar().lines), null);
	await cart.refreshCart({
		query: async () => {
			throw new Error('No data found');
		},
	});
	assert.equal(cart.cartTotal(cart.cartVar().lines), null);
	assert.equal(cart.cartVar().lines.length, 1);
});
test('old account cart requests cannot restore data after logout or an account switch', async () => {
	clientCart();
	const p = cartProductFixture();
	cart.addToCart(p);
	let resolve;
	const pending = cart.refreshCart({
		query: () =>
			new Promise((done) => {
				resolve = done;
			}),
	});
	userVar({ ...member(MemberType.CLIENT), _id: '507f1f77bcf86cd799439099' });
	cart.activateCart(userVar()._id);
	resolve({ data: { getProduct: p } });
	await pending;
	assert.equal(cart.cartVar().lines.length, 0);
	assert.equal(cart.cartVar().ownerId, userVar()._id);
	reset();
	cart.activateCart('');
	assert.equal(cart.cartVar().lines.length, 0);
});

const { sendCartRequest } = require('../libs/sales.ts');
global.crypto = require('node:crypto').webcrypto;
const saleClient = (handler) => ({
	mutate: handler,
	refetchQueries: async () => [],
	getObservableQueries: () => new Map(),
});
const acceptedSale = (input, owner = id, extra = {}) => ({
	_id: '707f1f77bcf86cd799439011',
	clientId: owner,
	requestKey: input.requestKey,
	totalAmount: input.expectedTotal,
	saleStatus: 'PENDING',
	...extra,
});
test('sale submission sends only IDs, validated quantities and expected prices/units, then clears confirmed cart', async () => {
	clientCart();
	cart.addToCart(cartProductFixture());
	let submitted;
	const result = await sendCartRequest(
		saleClient(async ({ variables }) => {
			submitted = variables.input;
			return { data: { requestSale: acceptedSale(submitted) } };
		}),
		'CARD',
	);
	assert.equal(result.saleStatus, 'PENDING');
	assert.equal(submitted.paymentMethod, 'CARD');
	assert.equal(submitted.expectedTotal, 25000);
	assert.deepEqual(submitted.items, [
		{ productId: cartProductFixture()._id, quantity: 1, expectedUnitPrice: 25000, expectedProductUnit: 'DONA' },
	]);
	assert.equal(submitted.clientId, undefined);
	assert.equal(submitted.agentId, undefined);
	assert.equal(cart.cartVar().lines.length, 0);
	assert.equal(cart.cartVar().intent, undefined);
});
test('ambiguous network retries preserve the same UUID and payload across reload without double requests', async () => {
	clientCart();
	cart.addToCart(cartProductFixture());
	let previous;
	await assert.rejects(
		sendCartRequest(
			saleClient(async ({ variables }) => {
				previous = variables.input;
				throw new Error('Network error');
			}),
			'CASH',
		),
	);
	assert.ok(cart.cartVar().intent);
	assert.equal(cart.cartVar().submitting, false);
	cart.setCartQuantity(cartProductFixture()._id, '5');
	assert.equal(cart.cartVar().lines[0].quantity, '1');
	cart.activateCart(id);
	assert.equal(cart.cartVar().intent.requestKey, previous.requestKey);
	await sendCartRequest(
		saleClient(async ({ variables }) => {
			assert.deepEqual(variables.input, previous);
			return { data: { requestSale: acceptedSale(previous) } };
		}),
		'CARD',
	);
	assert.equal(cart.cartVar().lines.length, 0);
});
test('confirmed stock/price rejection unlocks edits, while a cancelled retry keeps the cart intact', async () => {
	clientCart();
	cart.addToCart(cartProductFixture());
	await assert.rejects(
		sendCartRequest(
			saleClient(async () => {
				throw { graphQLErrors: [{ message: 'Insufficient sale stock' }] };
			}),
			'CASH',
		),
	);
	assert.equal(cart.cartVar().intent, undefined);
	assert.equal(cart.cartVar().lines.length, 1);
	await assert.rejects(
		sendCartRequest(
			saleClient(async ({ variables }) => ({
				data: { requestSale: acceptedSale(variables.input, id, { saleStatus: 'CANCELLED' }) },
			})),
			'CASH',
		),
		/bekor qilingan/,
	);
	assert.equal(cart.cartVar().lines.length, 1);
	assert.equal(cart.cartVar().intent, undefined);
});
test('payment requests reject invalid carts, other roles and duplicate in-flight submissions', async () => {
	clientCart();
	cart.addToCart(cartProductFixture());
	let finish;
	const client = saleClient(
		({ variables }) =>
			new Promise((resolve) => {
				finish = () => resolve({ data: { requestSale: acceptedSale(variables.input) } });
			}),
	);
	const pending = sendCartRequest(client, 'CASH');
	await assert.rejects(sendCartRequest(client, 'CASH'), /tayyor emas/);
	finish();
	await pending;
	clientCart();
	cart.addToCart(cartProductFixture());
	cart.setCartQuantity(cartProductFixture()._id, '100');
	await assert.rejects(sendCartRequest(client, 'CASH'), /miqdor/);
	userVar(member(MemberType.ADMIN));
	await assert.rejects(sendCartRequest(client, 'CASH'), /Client/);
});
test('late payment responses cannot clear or change another client cart', async () => {
	clientCart();
	cart.addToCart(cartProductFixture());
	let finish;
	const pending = sendCartRequest(
		saleClient(
			({ variables }) =>
				new Promise((resolve) => {
					finish = () => resolve({ data: { requestSale: acceptedSale(variables.input) } });
				}),
		),
		'CASH',
	);
	const other = '507f1f77bcf86cd799439099';
	userVar({ ...member(MemberType.CLIENT), _id: other });
	cart.activateCart(other);
	cart.addToCart(cartProductFixture());
	finish();
	await pending;
	assert.equal(cart.cartVar().ownerId, other);
	assert.equal(cart.cartVar().lines.length, 1);
});
test('persisted sale intent rejects forged totals, invalid UUIDs or units and never exposes auth identity fields', () => {
	const input = {
		requestKey: require('node:crypto').randomUUID(),
		paymentMethod: 'CASH',
		expectedTotal: 25000,
		items: [
			{ productId: cartProductFixture()._id, quantity: 1, expectedUnitPrice: 25000, expectedProductUnit: 'DONA' },
		],
		clientId: id,
	};
	assert.equal(cart.decodeSaleIntent(input).clientId, undefined);
	assert.equal(cart.decodeSaleIntent({ ...input, expectedTotal: 1 }), undefined);
	assert.equal(cart.decodeSaleIntent({ ...input, requestKey: 'bad' }), undefined);
	assert.equal(
		cart.decodeSaleIntent({ ...input, items: [{ ...input.items[0], expectedProductUnit: 'bad' }] }),
		undefined,
	);
});

test('attendance months include every date, Monday-aligned offsets and leap-day boundaries', () => {
 const { attendanceMonth, validMonth } = require('../libs/attendance.ts');
 assert.equal(attendanceMonth('2026-10').dates.length, 31);
 assert.equal(attendanceMonth('2026-10').leading, 3);
 assert.equal(attendanceMonth('2026-10').toDate, '2026-10-31');
 assert.equal(attendanceMonth('2026-02').dates.length, 28);
 assert.equal(attendanceMonth('2024-02').dates.length, 29);
 assert.equal(attendanceMonth('2026-11').leading, 6);
 assert.equal(attendanceMonth('2026-12').toDate, '2026-12-31');
 for(const value of ['2026-13','2026-00','2026-2','0000-01','invalid','2026-02-15']) {
  assert.equal(validMonth(value), false);
  assert.throws(()=>attendanceMonth(value));
 }
});
