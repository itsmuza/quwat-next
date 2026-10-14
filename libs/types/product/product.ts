import { ProductStatus, ProductType, ProductUnit } from '../../enums/product.enum';
export interface MeLiked {
	memberId: string;
	likeRefId: string;
	myFavorite: boolean;
}
export interface TotalCounter {
	total?: number;
}
export interface Paginated<T> {
	list: T[];
	metaCounter?: TotalCounter[] | null;
}
export interface OrdinaryInquiry {
	page: number;
	limit: number;
}
export interface Product {
	_id: string;
	productName: string;
	productType: ProductType;
	productStatus: ProductStatus;
	productUnit: ProductUnit;
	productPrice: number;
	productBrand?: string | null;
	productDesc?: string | null;
	productImages: string[];
	productQuantity: number;
	productReservedQuantity: number;
	productMinOrderQuantity: number;
	productQuantityStep: number;
	productLikes: number;
	productViews: number;
	productComments: number;
	productRank: number;
	archivedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	meLiked?: MeLiked[] | null;
	meSaved: boolean;
}
export type Products = Paginated<Product>;
export interface ProductInput {
	productName: string;
	productType: ProductType;
	productUnit: ProductUnit;
	productPrice: number;
	productStatus?: ProductStatus;
	productBrand?: string;
	productDesc?: string;
	productImages?: string[];
	productQuantity?: number;
	productMinOrderQuantity?: number;
	productQuantityStep?: number;
}
export type ProductUpdate = Partial<ProductInput> & { _id: string; expectedProductQuantity?: number };
export interface ProductSearch {
	typeList?: ProductType[];
	unitList?: ProductUnit[];
	brandList?: string[];
	pricesRange?: { start?: number; end?: number };
	periodsRange?: { start?: string; end?: string };
	inStock?: boolean;
	text?: string;
}
export type ProductSort = 'createdAt' | 'updatedAt' | 'productLikes' | 'productViews' | 'productRank' | 'productPrice';
export interface ProductsInquiry extends OrdinaryInquiry {
	sort?: ProductSort;
	direction?: 'ASC' | 'DESC';
	search: ProductSearch;
}
export interface AllProductsInquiry extends Omit<ProductsInquiry, 'search'> {
	search: ProductSearch & { productStatus?: ProductStatus };
}
