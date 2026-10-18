import { ApolloClient } from '@apollo/client';
import { SET_GUEST_LIKE } from '../apollo/user/guest-like';
import { LikeGroup } from './enums/like.enum';
const storageKey = 'quwat:guest-id';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let memoryId = '';
export function getGuestId(): string {
	if (typeof window === 'undefined') return '';
	try {
		const stored = localStorage.getItem(storageKey);
		if (stored && uuid.test(stored)) return stored;
	} catch {
		/* Private browsers may block storage; keep an in-memory identity. */
	}
	if (!memoryId) {
		const bytes = window.crypto.getRandomValues(new Uint8Array(16));
		bytes[6] = (bytes[6] & 15) | 64;
		bytes[8] = (bytes[8] & 63) | 128;
		const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
		memoryId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}
	try {
		localStorage.setItem(storageKey, memoryId);
	} catch {
		/* Use the in-memory identity. */
	}
	return memoryId;
}
interface GuestLikeResult {
	likeRefId: string;
	likeGroup: LikeGroup;
	liked: boolean;
	likeCount: number;
}
export async function setGuestLike<TCacheShape extends object>(
	client: ApolloClient<TCacheShape>,
	likeGroup: LikeGroup,
	likeRefId: string,
	liked: boolean,
) {
	const guestId = getGuestId();
	return client.mutate<{ setGuestLike: GuestLikeResult }>({
		mutation: SET_GUEST_LIKE,
		variables: { input: { likeGroup, likeRefId, liked } },
		context: { headers: { 'x-quwat-guest-id': guestId } },
		update(cache, { data }) {
			const result = data?.setGuestLike;
			if (!result) return;
			cache.modify({
				id: cache.identify({ __typename: likeGroup === LikeGroup.PRODUCT ? 'Product' : 'Member', _id: likeRefId }),
				fields: {
					guestLiked: () => result.liked,
					[likeGroup === LikeGroup.PRODUCT ? 'productLikes' : 'memberLikes']: () => result.likeCount,
				},
			});
		},
	});
}
