import { gql } from '@apollo/client';
import { MEMBER_FIELDS } from '../fragments';
export const UPDATE_MEMBER_BY_ADMIN = gql`
	${MEMBER_FIELDS}
	mutation UpdateMemberByAdmin($input: AdminMemberUpdate!) {
		updateMemberByAdmin(input: $input) {
			...MemberFields
		}
	}
`;
export { CREATE_PRODUCT, UPDATE_PRODUCT, REMOVE_PRODUCT_BY_ADMIN } from './product';
export { REMOVE_COMMENT_BY_ADMIN } from '../user/comment';
export { REVIEW_ATTENDANCE } from './attendance';
export const DELETE_MEMBER_PERMANENTLY_BY_ADMIN = gql`
	mutation DeleteMemberPermanentlyByAdmin($memberId: String!) {
		deleteMemberPermanentlyByAdmin(memberId: $memberId)
	}
`;
