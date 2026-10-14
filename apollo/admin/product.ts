import { gql } from '@apollo/client';
import { PRODUCT_FIELDS } from '../fragments';
export const GET_ALL_PRODUCTS_BY_ADMIN = gql`
	${PRODUCT_FIELDS}
	query GetAllProductsByAdmin($input: AllProductsInquiry!) {
		getAllProductsByAdmin(input: $input) {
			list {
				...ProductFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const CREATE_PRODUCT = gql`
	${PRODUCT_FIELDS}
	mutation CreateProduct($input: ProductInput!) {
		createProduct(input: $input) {
			...ProductFields
		}
	}
`;
export const UPDATE_PRODUCT = gql`
	${PRODUCT_FIELDS}
	mutation UpdateProduct($input: ProductUpdate!) {
		updateProduct(input: $input) {
			...ProductFields
		}
	}
`;
export const REMOVE_PRODUCT_BY_ADMIN = gql`
	${PRODUCT_FIELDS}
	mutation RemoveProductByAdmin($productId: String!) {
		removeProductByAdmin(productId: $productId) {
			...ProductFields
		}
	}
`;
