import { useEffect } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { sessionVar, userVar } from '../../../apollo/store';
import { activateCart, cartKey, cartVar, clientCartOwner, refreshCart } from '../../cart';

export function useClientCart() {
	useReactiveVar(sessionVar);
	useReactiveVar(userVar);
	const state = useReactiveVar(cartVar);
	const owner = clientCartOwner();
	return {
		...state,
		lines: owner && state.ownerId === owner ? state.lines : [],
		ready: Boolean(owner && state.ownerId === owner && state.ready),
		isClient: Boolean(owner),
	};
}
export default function CartSession() {
	const client = useApolloClient();
	useReactiveVar(userVar);
	useReactiveVar(sessionVar);
	const owner = clientCartOwner();
	useEffect(() => {
		activateCart(owner);
		if (owner) void refreshCart(client);
		const sync = (event: StorageEvent) => {
			if (owner && (event.key === cartKey(owner) || event.key === null)) {
				activateCart(owner);
				void refreshCart(client);
			}
		};
		window.addEventListener('storage', sync);
		return () => {
			window.removeEventListener('storage', sync);
			activateCart('');
		};
	}, [owner, client]);
	return null;
}
