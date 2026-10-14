import { useCallback, useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { loadAdminProduct } from '../../adminProduct';
import { Product } from '../../types/product/product';

export default function useAdminProduct(id: string | undefined, enabled: boolean) {
	const client = useApolloClient();
	const request = useRef(0);
	const [state, setState] = useState<{ id?: string; product?: Product | null; loading: boolean; error?: unknown }>({
		loading: false,
	});
	const refetch = useCallback(async () => {
		if (!enabled || !id) return;
		const version = ++request.current;
		setState({ id, loading: true });
		try {
			const product = await loadAdminProduct(client, id, () => version === request.current);
			if (version === request.current) setState({ id, product, loading: false });
		} catch (error) {
			if (version === request.current) setState({ id, loading: false, error });
		}
	}, [client, enabled, id]);
	useEffect(() => {
		void refetch();
		return () => {
			request.current += 1;
		};
	}, [refetch]);
	return {
		product: enabled && state.id === id ? state.product : undefined,
		loading: enabled && (state.id !== id || state.loading),
		error: enabled && state.id === id ? state.error : undefined,
		refetch,
	};
}
