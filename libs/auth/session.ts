import { sessionVar, userVar, emptyUser, socketVar } from '../../apollo/store';
export function isAuthError(error: unknown): boolean {
	const value = error as {
		graphQLErrors?: { message?: string; extensions?: { code?: string }; code?: string }[];
		networkError?: { statusCode?: number };
	};
	return (
		value?.networkError?.statusCode === 401 ||
		Boolean(
			value?.graphQLErrors?.some(
				(item) =>
					item.extensions?.code === 'UNAUTHENTICATED' ||
					item.code === 'UNAUTHENTICATED' ||
					/not authenticated|bearer token|token.*expired|you have been blocked/i.test(item.message || ''),
			),
		)
	);
}
export function expireSession() {
	if (typeof window !== 'undefined') {
		localStorage.removeItem('accessToken');
		if (userVar()._id) window.dispatchEvent(new Event('quwat:logout'));
	}
	socketVar()?.close();
	socketVar(undefined);
	userVar({ ...emptyUser });
	sessionVar({ status: 'anonymous', error: '' });
}
