import { gql } from '@apollo/client';
export const SET_GUEST_LIKE = gql`
	mutation SetGuestLike($input: GuestLikeInput!) {
		setGuestLike(input: $input) {
			likeRefId
			likeGroup
			liked
			likeCount
		}
	}
`;
