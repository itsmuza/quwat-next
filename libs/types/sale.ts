import { ProductType, ProductUnit } from '../enums/product.enum';
import { Paginated } from './product/product';
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type SalePaymentMethod = 'CASH' | 'CARD';
export interface SaleRequestInput {
	requestKey: string;
	paymentMethod: SalePaymentMethod;
	expectedTotal: number;
	items: { productId: string; quantity: number; expectedUnitPrice: number; expectedProductUnit: ProductUnit }[];
}
export interface SaleLine {
	productId: string;
	productName: string;
	productType: ProductType;
	productUnit: ProductUnit;
	productBrand?: string | null;
	productImage?: string | null;
	unitPrice: number;
	quantity: number;
	lineTotal: number;
}
export interface Sale {
	_id: string;
	clientId: string;
	clientName: string;
	requestKey: string;
	saleStatus: SaleStatus;
	paymentMethod: SalePaymentMethod;
	items: SaleLine[];
	totalAmount: number;
	agentId?: string | null;
	agentName?: string | null;
	completedAt?: string | null;
	completedDate?: string | null;
	cancelledAt?: string | null;
	createdAt: string;
	updatedAt: string;
}
export type Sales = Paginated<Sale>;
export interface DailySalesReport {
	date: string;
	salesCount: number;
	totalAmount: number;
	products: {
		productId: string;
		productName: string;
		productUnit: ProductUnit;
		quantity: number;
		totalAmount: number;
	}[];
}
export const saleStatusLabels: Record<SaleStatus, string> = {
	PENDING: 'Tasdiq kutilmoqda',
	COMPLETED: 'To‘lov tasdiqlangan',
	CANCELLED: 'Bekor qilingan',
};
export const paymentLabels: Record<SalePaymentMethod, string> = { CASH: 'Naqd', CARD: 'Bank kartasi' };
