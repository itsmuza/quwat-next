import { gql } from '@apollo/client';
import { MEMBER_FIELDS } from '../fragments';
export const GET_AGENTS = gql`
	${MEMBER_FIELDS}
	query GetAgents($input: AgentsInquiry!) {
		getAgents(input: $input) {
			list {
				...MemberFields
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_MEMBER = gql`
	${MEMBER_FIELDS}
	query GetMember($input: String!) {
		getMember(memberId: $input) {
			...MemberFields
		}
	}
`;
export const CHECK_AUTH = gql`
	query CheckAuth {
		checkAuth
	}
`;
export { GET_PRODUCT, GET_PRODUCTS, GET_FAVORITE_PRODUCTS, GET_VISITED_PRODUCTS, GET_SAVED_PRODUCTS } from './product';
export { GET_COMMENTS } from './comment';
export { GET_MY_ATTENDANCES } from './attendance';

export { GET_MY_SALES, GET_PENDING_SALES } from './sale';
