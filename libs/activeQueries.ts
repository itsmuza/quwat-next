import { ApolloClient } from '@apollo/client';

export function activeQueryNames<TCacheShape extends object>(
	client: ApolloClient<TCacheShape>,
	names: readonly string[],
): string[] {
	return Array.from(client.getObservableQueries('active').values())
		.map((query) => query.queryName)
		.filter((name): name is string => Boolean(name && names.includes(name)));
}
