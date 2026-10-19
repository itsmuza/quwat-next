import { gql } from '@apollo/client';
import { SALE_FIELDS } from './sale';

export const NOTIFICATION_SALE_FIELDS = gql`
	${SALE_FIELDS}
	fragment NotificationSaleFields on Sale {
		...SaleFields
		rejectedAt
		rejectedById
		rejectedByName
	}
`;
export const GET_SALE_NOTIFICATIONS = gql`
	${NOTIFICATION_SALE_FIELDS}
	query GetSaleNotifications($input: OrdinaryInquiry!) {
		getSaleNotifications(input: $input) {
			list {
				sale {
					...NotificationSaleFields
				}
				readAt
			}
			metaCounter {
				total
			}
			unreadCount
		}
	}
`;
export const MARK_SALE_NOTIFICATION_READ = gql`
	mutation MarkSaleNotificationRead($input: SaleIdInput!) {
		markSaleNotificationRead(input: $input)
	}
`;
export const REJECT_SALE = gql`
	${NOTIFICATION_SALE_FIELDS}
	mutation RejectSale($input: SaleIdInput!) {
		rejectSale(input: $input) {
			...NotificationSaleFields
		}
	}
`;
export const GET_SALE_FOR_AGENT = gql`
	${NOTIFICATION_SALE_FIELDS}
	query GetSaleForAgent($input: SaleIdInput!) {
		getSaleForAgent(input: $input) {
			...NotificationSaleFields
		}
	}
`;
