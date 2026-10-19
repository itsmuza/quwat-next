import { ApolloClient } from '@apollo/client';
import { GET_ALL_PRODUCTS_BY_ADMIN } from '../apollo/admin/product';
import { AllProductsInquiry, Product, Products } from './types/product/product';
import { totalOf } from './product';

// The backend has no admin detail query. Its paginated list includes every status.
export async function loadAdminProduct<TCache extends object>(
	client: ApolloClient<TCache>,
	productId: string,
	current: () => boolean = () => true,
): Promise<Product | null> {
	const limit = 100;
	for (let page = 1; current(); page += 1) {
		const { data } = await client.query<{ getAllProductsByAdmin: Products }, { input: AllProductsInquiry }>({
			query: GET_ALL_PRODUCTS_BY_ADMIN,
			variables: { input: { page, limit, sort: 'createdAt', direction: 'DESC', search: {} } },
			fetchPolicy: 'network-only',
		});
		const products = data.getAllProductsByAdmin;
		const product = products.list.find((item) => item._id === productId);
		if (product) return product;
		if (!products.list.length || page * limit >= totalOf(products)) return null;
	}
	return null;
}

export function invalidateProductCatalog<TCache extends object>(client: ApolloClient<TCache>, productId?: string) {
	for (const fieldName of ['getProducts', 'getFavorites', 'getVisited', 'getSavedProducts']) {
		client.cache.evict({ id: 'ROOT_QUERY', fieldName });
	}
	if (productId) client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getProduct', args: { productId } });
}
