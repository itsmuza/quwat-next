import { gql } from '@apollo/client';
import { PRODUCT_FIELDS } from '../fragments';
export const GET_PRODUCT = gql`
	${PRODUCT_FIELDS}
	query GetProduct($productId: String!) {
		getProduct(productId: $productId) {
			...ProductFields
		}
	}
`;
export const GET_PRODUCTS = gql`
	${PRODUCT_FIELDS}
	query GetProducts($input: ProductsInquiry!) {
		getProducts(input: $input) {
			list {
				...ProductFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_FAVORITE_PRODUCTS = gql`
	${PRODUCT_FIELDS}
	query GetFavorites($input: OrdinaryInquiry!) {
		getFavorites(input: $input) {
			list {
				...ProductFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_VISITED_PRODUCTS = gql`
	${PRODUCT_FIELDS}
	query GetVisited($input: OrdinaryInquiry!) {
		getVisited(input: $input) {
			list {
				...ProductFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_SAVED_PRODUCTS = gql`
	${PRODUCT_FIELDS}
	query GetSavedProducts($input: OrdinaryInquiry!) {
		getSavedProducts(input: $input) {
			list {
				...ProductFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const LIKE_TARGET_PRODUCT = gql`
	${PRODUCT_FIELDS}
	mutation LikeTargetProduct($productId: String!) {
		likeTargetProduct(productId: $productId) {
			...ProductFields
		}
	}
`;
export const SAVE_PRODUCT = gql`
	mutation SaveProduct($productId: String!) {
		saveProduct(productId: $productId)
	}
`;
export const UNSAVE_PRODUCT = gql`
	mutation UnsaveProduct($productId: String!) {
		unsaveProduct(productId: $productId)
	}
`;
