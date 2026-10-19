import { ApolloClient } from '@apollo/client';
import { REQUEST_SALE } from '../apollo/user/sale';
import { activeQueryNames } from './activeQueries';
import { beginCartRequest, cartTotal, cartVar, clientCartOwner, completeCartRequest, failCartRequest } from './cart';
import { Sale, SalePaymentMethod, SaleRequestInput } from './types/sale';
export function newRequestKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	bytes[6] = (bytes[6] & 15) | 64;
	bytes[8] = (bytes[8] & 63) | 128;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export async function sendCartRequest(client: ApolloClient<object>, method: SalePaymentMethod): Promise<Sale> {
	const state = cartVar(),
		owner = clientCartOwner();
	if (!owner || state.ownerId !== owner || !state.ready || state.submitting)
		throw new Error('Client savatchasi tayyor emas.');
	const total = cartTotal(state.lines);
	if (!state.intent && (state.syncing || !state.lines.length || total === null))
		throw new Error('Savatchadagi miqdor va qoldiqni tekshiring.');
	const input: SaleRequestInput = state.intent || {
		requestKey: newRequestKey(),
		paymentMethod: method,
		expectedTotal: total!,
		items: state.lines.map((line) => ({
			productId: line.productId,
			quantity: Number(line.quantity),
			expectedUnitPrice: line.product!.productPrice,
			expectedProductUnit: line.product!.productUnit,
		})),
	};
	beginCartRequest(input);
	let sale: Sale;
	try {
		const { data } = await client.mutate<{ requestSale: Sale }, { input: SaleRequestInput }>({
			mutation: REQUEST_SALE,
			variables: { input },
		});
		if (
			!data?.requestSale ||
			data.requestSale.clientId !== owner ||
			data.requestSale.requestKey !== input.requestKey ||
			data.requestSale.totalAmount !== input.expectedTotal
		)
			throw new Error('So‘rov javobini tekshirib bo‘lmadi. Qayta yuboring.');
		sale = data.requestSale;
	} catch (error) {
		if (owner === clientCartOwner()) {
			const value = error as { graphQLErrors?: { message: string }[] };
			const rejected = Boolean(
				value.graphQLErrors?.some((item) =>
					/^(Invalid sale|Active sale product not found|Sale product (price|unit) changed|Insufficient sale stock|Sale total changed|Sale amount exceeds|Sales transactions require)/i.test(
						item.message,
					),
				),
			);
			failCartRequest(rejected);
		}
		throw error;
	}
	if (owner === clientCartOwner()) {
		if (sale.saleStatus === 'CANCELLED') {
			failCartRequest(true);
			throw new Error('Avvalgi so‘rov bekor qilingan. Yangi so‘rov yuborishingiz mumkin.');
		}
		completeCartRequest(input);
		void client
			.refetchQueries({
				include: activeQueryNames(client, [
					'GetProducts',
					'GetProduct',
					'GetFavorites',
					'GetVisited',
					'GetSavedProducts',
					'GetMySales',
				]),
			})
			.catch(() => undefined);
	}
	return sale;
}
