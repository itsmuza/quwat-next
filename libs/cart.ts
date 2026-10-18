import { ApolloClient, makeVar } from '@apollo/client';
import { GET_PRODUCT } from '../apollo/user/product';
import { sessionVar, userVar } from '../apollo/store';
import { Product } from './types/product/product';
import { ProductUnit } from './enums/product.enum';
import { errorText } from './feedback';
import { validId } from './product';
import { SaleRequestInput } from './types/sale';

export type CartProduct = Pick<
	Product,
	| '_id'
	| 'productName'
	| 'productImages'
	| 'productUnit'
	| 'productPrice'
	| 'productStatus'
	| 'productQuantity'
	| 'productReservedQuantity'
	| 'productMinOrderQuantity'
	| 'productQuantityStep'
>;
export interface CartLine {
	productId: string;
	product: CartProduct | null;
	quantity: string;
	error?: string;
}
interface CartState {
	ownerId: string;
	ready: boolean;
	syncing: boolean;
	lines: CartLine[];
	error: string;
	submitting: boolean;
	intent?: SaleRequestInput;
}
const emptyCart: CartState = { ownerId: '', ready: false, syncing: false, lines: [], error: '', submitting: false };
export const cartVar = makeVar<CartState>({ ...emptyCart });
export const cartKey = (id: string) => `quwat:cart:v1:${id}`;
export function decodeSaleIntent(value: unknown): SaleRequestInput | undefined {
	const input = value as SaleRequestInput;
	if (
		!input ||
		!/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(input.requestKey) ||
		!['CASH', 'CARD'].includes(input.paymentMethod) ||
		!Number.isSafeInteger(input.expectedTotal) ||
		input.expectedTotal < 0 ||
		!Array.isArray(input.items) ||
		!input.items.length ||
		input.items.length > 100
	)
		return;
	const seen = new Set<string>();
	let total = BigInt(0);
	for (const item of input.items) {
		if (
			!validId(item?.productId) ||
			seen.has(item.productId) ||
			!Object.values(ProductUnit).includes(item.expectedProductUnit) ||
			!Number.isSafeInteger(item.expectedUnitPrice) ||
			item.expectedUnitPrice < 0 ||
			!Number.isFinite(item.quantity) ||
			item.quantity <= 0 ||
			item.quantity > 1000000000 ||
			Math.abs(item.quantity * 1000 - Math.round(item.quantity * 1000)) > 0.000001
		)
			return;
		seen.add(item.productId);
		total += (BigInt(item.expectedUnitPrice) * BigInt(Math.round(item.quantity * 1000)) + BigInt(500)) / BigInt(1000);
	}
	if (total !== BigInt(input.expectedTotal)) return;
	return {
		requestKey: input.requestKey,
		paymentMethod: input.paymentMethod,
		expectedTotal: input.expectedTotal,
		items: input.items.map(({ productId, quantity, expectedUnitPrice, expectedProductUnit }) => ({
			productId,
			quantity,
			expectedUnitPrice,
			expectedProductUnit,
		})),
	};
}
let generation = 0;
let refreshing: { generation: number; promise: Promise<void> } | undefined;
export const clientCartOwner = () => {
	const user = userVar();
	return sessionVar().status === 'authenticated' && user.memberType === 'CLIENT' && user.memberStatus === 'ACTIVE'
		? user._id
		: '';
};
export function decodeCart(raw: string | null): CartLine[] {
	try {
		const saved = JSON.parse(raw || 'null');
		if (saved?.version !== 1 || !Array.isArray(saved.items)) return [];
		const seen = new Set<string>();
		return saved.items.slice(0, 100).flatMap((item: { productId?: unknown; quantity?: unknown }) => {
			if (!validId(item?.productId) || seen.has(item.productId)) return [];
			const quantity = String(item.quantity ?? '');
			if (quantity.length > 32 || !/^-?\d*(?:\.\d*)?$/.test(quantity)) return [];
			seen.add(item.productId);
			return [{ productId: item.productId, quantity, product: null }];
		});
	} catch {
		return [];
	}
}
export function activateCart(ownerId: string) {
	generation++;
	if (!ownerId || ownerId !== clientCartOwner()) {
		cartVar({ ...emptyCart });
		return;
	}
	let lines: CartLine[] = [];
	let error = '';
	let intent: SaleRequestInput | undefined;
	try {
		const raw = localStorage.getItem(cartKey(ownerId));
		lines = decodeCart(raw);
		intent = decodeSaleIntent(JSON.parse(raw || 'null')?.intent);
		if (
			intent &&
			(intent.items.length !== lines.length ||
				intent.items.some(
					(item) => !lines.some((line) => line.productId === item.productId && Number(line.quantity) === item.quantity),
				))
		)
			intent = undefined;
	} catch {
		error = 'Savatchani brauzer xotirasidan o‘qib bo‘lmadi.';
	}
	cartVar({ ownerId, ready: true, syncing: false, lines, error, submitting: false, intent });
}
function persistState(state: CartState) {
	if (!clientCartOwner() || state.ownerId !== clientCartOwner() || !state.ready) return;
	let error = '';
	try {
		localStorage.setItem(
			cartKey(state.ownerId),
			JSON.stringify({
				version: 1,
				items: state.lines.map(({ productId, quantity }) => ({ productId, quantity })),
				intent: state.intent,
			}),
		);
	} catch {
		error = 'Savatchani brauzer xotirasida saqlab bo‘lmadi.';
	}
	cartVar({ ...state, error });
}
function storeLines(lines: CartLine[]) {
	const state = cartVar();
	if (state.submitting || state.intent) return;
	persistState({ ...state, lines });
}
export function beginCartRequest(input: SaleRequestInput) {
	persistState({ ...cartVar(), intent: input, submitting: true });
}
export function failCartRequest(clearIntent: boolean) {
	persistState({ ...cartVar(), submitting: false, ...(clearIntent ? { intent: undefined } : {}) });
}
export function completeCartRequest(input: SaleRequestInput) {
	const state = cartVar();
	const lines = state.lines.flatMap((line) => {
		const sent = input.items.find((item) => item.productId === line.productId);
		if (!sent) return [line];
		const remaining = Math.round(Number(line.quantity) * 1000) - Math.round(sent.quantity * 1000);
		return remaining > 0 ? [{ ...line, quantity: String(remaining / 1000) }] : [];
	});
	persistState({ ...state, lines, intent: undefined, submitting: false });
}
export function cartProduct(product: Product): CartProduct {
	const {
		_id,
		productName,
		productImages,
		productUnit,
		productPrice,
		productStatus,
		productQuantity,
		productReservedQuantity,
		productMinOrderQuantity,
		productQuantityStep,
	} = product;
	return {
		_id,
		productName,
		productImages,
		productUnit,
		productPrice,
		productStatus,
		productQuantity,
		productReservedQuantity,
		productMinOrderQuantity,
		productQuantityStep,
	};
}
export const stockAvailable = (product: CartProduct) =>
	Math.max(0, Math.round(product.productQuantity * 1000) - Math.round(product.productReservedQuantity * 1000)) / 1000;
export function quantityError(product: CartProduct, input: string): string | null {
	if (product.productStatus !== 'ACTIVE') return 'Mahsulot hozir sotuvda yo‘q.';
	if (!/^\d+(?:\.\d{1,3})?$/.test(input)) return 'Miqdorni uch kasr xonasigacha kiriting.';
	const quantity = Number(input);
	if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1000000000)
		return 'Musbat va 1 000 000 000 dan oshmagan miqdor kiriting.';
	if ([ProductUnit.DONA, ProductUnit.QOP].includes(product.productUnit) && !Number.isInteger(quantity))
		return 'Dona va qop uchun butun miqdor kiriting.';
	if (quantity < product.productMinOrderQuantity) return `Minimal miqdor: ${product.productMinOrderQuantity}.`;
	const step = Math.round(product.productQuantityStep * 1000);
	if (step <= 0 || Math.round(quantity * 1000) % step !== 0) return `Miqdor qadami: ${product.productQuantityStep}.`;
	if (quantity > stockAvailable(product)) return 'Miqdor ombordagi mavjud qoldiqdan oshmoqda.';
	return null;
}
export function lineTotal(line: CartLine): number | null {
	const p = line.product;
	if (
		!p ||
		line.error ||
		quantityError(p, line.quantity) ||
		!Number.isSafeInteger(p.productPrice) ||
		p.productPrice < 0
	)
		return null;
	// Exact whole-so‘m line rounding, including three-decimal metric quantities.
	return calculatedLineAmount(p.productPrice, Number(line.quantity));
}
export function calculatedLineAmount(price: number, quantity: number): number | null {
	if (!Number.isSafeInteger(price) || price < 0 || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1000000000)
		return null;
	const amount = (BigInt(price) * BigInt(Math.round(quantity * 1000)) + BigInt(500)) / BigInt(1000);
	return amount <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(amount) : null;
}
export function cartTotal(lines: CartLine[]): number | null {
	let total = 0;
	for (const line of lines) {
		const amount = lineTotal(line);
		if (amount === null || !Number.isSafeInteger(total + amount)) return null;
		total += amount;
	}
	return total;
}
export function addToCart(product: Product): string | null {
	const state = cartVar();
	if (state.intent || state.submitting) return 'Avval yuborilgan to‘lov so‘rovini savatchada tekshiring.';
	if (!clientCartOwner() || state.ownerId !== clientCartOwner() || !state.ready)
		return 'Savatchani ishlatish uchun client hisobiga kiring.';
	const snapshot = cartProduct(product);
	if (snapshot.productStatus === 'ACTIVE' && stockAvailable(snapshot) === 0)
		return 'Mahsulot omborda mavjud emas!';
	const existing = state.lines.find((line) => line.productId === product._id);
	if (existing && quantityError(snapshot, existing.quantity)) return 'Avval savatchadagi miqdorni tekshiring.';
	const quantity = existing
		? String((Math.round(Number(existing.quantity) * 1000) + Math.round(product.productQuantityStep * 1000)) / 1000)
		: String(product.productMinOrderQuantity);
	const error = quantityError(snapshot, quantity);
	if (error) return error;
	if (!existing && state.lines.length >= 100) return 'Savatchaga 100 tagacha turli mahsulot qo‘shish mumkin.';
	const next: CartLine = { productId: product._id, product: snapshot, quantity };
	storeLines(
		existing ? state.lines.map((line) => (line.productId === product._id ? next : line)) : [...state.lines, next],
	);
	return null;
}
export function setCartQuantity(productId: string, quantity: string) {
	if (quantity.length > 32) return;
	storeLines(cartVar().lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)));
}
export function removeFromCart(productId: string) {
	storeLines(cartVar().lines.filter((line) => line.productId !== productId));
}
export function clearCart() {
	storeLines([]);
}
export function refreshCart(client: Pick<ApolloClient<object>, 'query'>): Promise<void> {
	const state = cartVar();
	if (!state.ownerId || state.ownerId !== clientCartOwner() || !state.ready) return Promise.resolve();
	if (refreshing?.generation === generation) return refreshing.promise;
	const started = generation;
	const owner = state.ownerId;
	cartVar({ ...state, syncing: true });
	const promise = (async () => {
		const results = new Map<string, { product: CartProduct | null; error?: string }>();
		for (let offset = 0; offset < state.lines.length; offset += 6) {
			if (started !== generation || owner !== clientCartOwner()) return;
			await Promise.all(
				state.lines.slice(offset, offset + 6).map(async (line) => {
					try {
						const { data } = await client.query<{ getProduct: Product }>({
							query: GET_PRODUCT,
							variables: { productId: line.productId },
							fetchPolicy: 'network-only',
						});
						if (!data?.getProduct || data.getProduct._id !== line.productId) throw new Error('No data found');
						results.set(line.productId, { product: cartProduct(data.getProduct), error: undefined });
					} catch (error) {
						results.set(line.productId, { product: line.product, error: errorText(error) });
					}
				}),
			);
		}
		if (started !== generation || owner !== clientCartOwner()) return;
		const current = cartVar();
		cartVar({
			...current,
			syncing: false,
			lines: current.lines.map((line) => ({ ...line, ...(results.get(line.productId) || {}) })),
		});
	})().finally(() => {
		if (refreshing?.generation === started) refreshing = undefined;
	});
	refreshing = { generation: started, promise };
	return promise;
}
