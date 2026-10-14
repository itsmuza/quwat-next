import { gql } from '@apollo/client';
export const SALE_FIELDS = gql`
	fragment SaleFields on Sale {
		_id
		clientId
		clientName
		requestKey
		saleStatus
		paymentMethod
		totalAmount
		agentId
		agentName
		completedDate
		completedAt
		cancelledAt
		createdAt
		updatedAt
		items {
			productId
			productName
			productType
			productUnit
			productBrand
			productImage
			unitPrice
			quantity
			lineTotal
		}
	}
`;
export const REQUEST_SALE = gql`
	${SALE_FIELDS}
	mutation RequestSale($input: RequestSaleInput!) {
		requestSale(input: $input) {
			...SaleFields
		}
	}
`;
export const CANCEL_SALE = gql`
	${SALE_FIELDS}
	mutation CancelSale($input: SaleIdInput!) {
		cancelSale(input: $input) {
			...SaleFields
		}
	}
`;
export const APPROVE_SALE = gql`
	${SALE_FIELDS}
	mutation ApproveSale($input: SaleIdInput!) {
		approveSale(input: $input) {
			...SaleFields
		}
	}
`;
export const GET_MY_SALES = gql`
	${SALE_FIELDS}
	query GetMySales($input: SalesInquiry!) {
		getMySales(input: $input) {
			list {
				...SaleFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_PENDING_SALES = gql`
	${SALE_FIELDS}
	query GetPendingSales($input: OrdinaryInquiry!) {
		getPendingSales(input: $input) {
			list {
				...SaleFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_ALL_SALES_BY_ADMIN = gql`
	${SALE_FIELDS}
	query GetAllSalesByAdmin($input: AdminSalesInquiry!) {
		getAllSalesByAdmin(input: $input) {
			list {
				...SaleFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_DAILY_SALES_BY_ADMIN = gql`
	query GetDailySalesByAdmin($input: DailySalesInput!) {
		getDailySalesByAdmin(input: $input) {
			date
			salesCount
			totalAmount
			products {
				productId
				productName
				productUnit
				quantity
				totalAmount
			}
		}
	}
`;
