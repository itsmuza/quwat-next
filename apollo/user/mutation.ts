import { gql } from '@apollo/client';
import { MEMBER_FIELDS } from '../fragments';
export const SIGN_UP = gql`
	${MEMBER_FIELDS}
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
			...MemberFields
			accessToken
		}
	}
`;
export const LOGIN = gql`
	${MEMBER_FIELDS}
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			...MemberFields
			accessToken
		}
	}
`;
export const UPDATE_MEMBER = gql`
	${MEMBER_FIELDS}
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
			...MemberFields
			accessToken
		}
	}
`;
export const LIKE_TARGET_MEMBER = gql`
	${MEMBER_FIELDS}
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
			...MemberFields
		}
	}
`;
export { LIKE_TARGET_PRODUCT, SAVE_PRODUCT, UNSAVE_PRODUCT } from './product';
export { CREATE_COMMENT, UPDATE_COMMENT } from './comment';
export { IMAGE_UPLOADER, IMAGES_UPLOADER } from './upload';
export { REQUEST_ATTENDANCE } from './attendance';

export { REQUEST_SALE, CANCEL_SALE, APPROVE_SALE } from './sale';
