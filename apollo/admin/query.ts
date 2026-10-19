import { gql } from '@apollo/client';
import { MEMBER_FIELDS } from '../fragments';
export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	${MEMBER_FIELDS}
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				...MemberFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export { GET_ALL_PRODUCTS_BY_ADMIN } from './product';
export { GET_ALL_ATTENDANCES_BY_ADMIN, GET_DAILY_ATTENDANCES_BY_ADMIN, GET_AGENT_ATTENDANCES_BY_ADMIN } from './attendance';

export { GET_ALL_SALES_BY_ADMIN, GET_DAILY_SALES_BY_ADMIN } from '../user/sale';
