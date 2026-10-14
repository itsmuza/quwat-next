import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { expireSession, isAuthError } from '../libs/auth/session';
let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;
function createApolloClient() {
	const authLink = new ApolloLink((operation, forward) => {
		const token = getJwtToken();
		operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
			authToken: token,
			headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		}));
		return forward(operation);
	});
	const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
		if (
			typeof window !== 'undefined' &&
			operation.getContext().authToken === getJwtToken() &&
			isAuthError({ graphQLErrors, networkError, operation })
		) {
			expireSession();
			void apolloClient?.clearStore();
		} else if (
			typeof window !== 'undefined' &&
			graphQLErrors?.some((error) => /specific roles|forbidden|only active/i.test(error.message))
		) {
			window.dispatchEvent(new Event('quwat:session-check'));
		}
	});
	const uploadLink = createUploadLink({
		uri: process.env.REACT_APP_API_GRAPHQL_URL || 'http://localhost:3007/graphql',
		headers: { 'apollo-require-preflight': 'true' },
	});
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: ApolloLink.from([errorLink, authLink, uploadLink]),
		cache: new InMemoryCache({
			typePolicies: {
				// meLiked is the current viewer's complete state, including an empty array after unlike.
				Product: { keyFields: ['_id'], fields: { meLiked: { merge: false } } },
				Member: { keyFields: ['_id'], fields: { meLiked: { merge: false } } },
			},
		}),
	});
}
export function initializeApollo(initialState: NormalizedCacheObject | null = null) {
	const client = apolloClient ?? createApolloClient();
	if (initialState) client.cache.restore(initialState);
	if (typeof window === 'undefined') return client;
	apolloClient = client;
	return client;
}
export function useApollo(initialState: NormalizedCacheObject | null) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
