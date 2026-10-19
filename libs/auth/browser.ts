import { restoreSession } from './index';

// Called once by _app; other tabs validate rotated tokens without renewing them again.
export function watchSession(client: { clearStore: () => Promise<unknown> }): () => void {
	void restoreSession();
	const sync = (event: StorageEvent) => {
		if (event.key === 'accessToken' || event.key === null) void restoreSession({ renew: false });
	};
	const refresh = () => {
		void restoreSession();
	};
	const visible = () => {
		if (document.visibilityState === 'visible') refresh();
	};
	const clear = () => {
		void client.clearStore();
	};
	window.addEventListener('storage', sync);
	window.addEventListener('quwat:session-check', refresh);
	window.addEventListener('focus', refresh);
	document.addEventListener('visibilitychange', visible);
	window.addEventListener('quwat:logout', clear);
	return () => {
		window.removeEventListener('storage', sync);
		window.removeEventListener('quwat:session-check', refresh);
		window.removeEventListener('focus', refresh);
		document.removeEventListener('visibilitychange', visible);
		window.removeEventListener('quwat:logout', clear);
	};
}
