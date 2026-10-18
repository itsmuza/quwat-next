import { DocumentNode, useApolloClient, useQuery, useReactiveVar } from '@apollo/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { socketVar } from '../../../apollo/store';
import { totalOf } from '../../product';

interface NotificationPage<T> {
	list: T[];
	metaCounter: { total: number }[];
	unreadCount?: number;
}
const noFilters = {};
export default function useNotificationFeed<T>({
	query,
	field,
	keyOf,
	input = noFilters,
	pollInterval = 15000,
	socketEvent,
}: {
	query: DocumentNode;
	field: string;
	keyOf: (entry: T) => string;
	input?: Record<string, unknown>;
	pollInterval?: number;
	socketEvent?: string;
}) {
	const client = useApolloClient();
	const socket = useReactiveVar(socketVar);
	const alive = useRef(true);
	const [reload, setReload] = useState(0);
	const [remainder, setRemainder] = useState<{
		source: NotificationPage<T>;
		list: T[];
		loading: boolean;
		error?: unknown;
	} | null>(null);
	const { data, loading, error, refetch, startPolling, stopPolling } = useQuery<Record<string, NotificationPage<T>>>(
		query,
		{
			variables: { input: { ...input, page: 1, limit: 100 } },
			fetchPolicy: 'no-cache',
			notifyOnNetworkStatusChange: true,
		},
	);
	const source = data?.[field];
	const rest = remainder?.source === source ? remainder : null;
	const refresh = useCallback(() => {
		void refetch()
			.then(() => {
				if (alive.current) setReload((value) => value + 1);
			})
			.catch(() => undefined);
	}, [refetch]);
	useEffect(() => {
		alive.current = true;
		return () => {
			alive.current = false;
		};
	}, []);
	useEffect(() => {
		if (!source || source.list.length >= totalOf(source)) return;
		let cancelled = false;
		setRemainder({ source, list: [], loading: true });
		void (async () => {
			const seen = new Set(source.list.map(keyOf));
			const list: T[] = [];
			try {
				for (let page = 2; page <= Math.ceil(totalOf(source) / 100); page++) {
					const result = await client.query<Record<string, NotificationPage<T>>>({
						query,
						variables: { input: { ...input, page, limit: 100 } },
						fetchPolicy: 'no-cache',
					});
					if (cancelled) return;
					for (const entry of result.data[field].list) {
						const id = keyOf(entry);
						if (!seen.has(id)) {
							seen.add(id);
							list.push(entry);
						}
					}
					setRemainder({ source, list: [...list], loading: page < Math.ceil(totalOf(source) / 100) });
				}
			} catch (error) {
				if (!cancelled) setRemainder({ source, list: [...list], loading: false, error });
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [source, client, query, field, input, keyOf, reload]);
	useEffect(() => {
		const visible = () => {
			if (document.hidden) stopPolling();
			else {
				refresh();
				startPolling(pollInterval);
			}
		};
		if (!document.hidden) startPolling(pollInterval);
		document.addEventListener('visibilitychange', visible);
		window.addEventListener('focus', refresh);
		const message = (event: MessageEvent) => {
			try {
				if (socketEvent && JSON.parse(event.data).event === socketEvent && !document.hidden) refresh();
			} catch {
				/* Ignore other messages. */
			}
		};
		socket?.addEventListener('message', message);
		socket?.addEventListener('open', refresh);
		return () => {
			stopPolling();
			document.removeEventListener('visibilitychange', visible);
			window.removeEventListener('focus', refresh);
			socket?.removeEventListener('message', message);
			socket?.removeEventListener('open', refresh);
		};
	}, [socket, socketEvent, refresh, pollInterval, startPolling, stopPolling]);
	return {
		source,
		list: [...(source?.list || []), ...(rest?.list || [])],
		loading,
		error,
		moreLoading: rest?.loading,
		moreError: rest?.error,
		refresh,
	};
}
