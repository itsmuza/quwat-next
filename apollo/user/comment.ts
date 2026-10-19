import { gql } from '@apollo/client';
import { MEMBER_FIELDS } from '../fragments';
export const GET_COMMENTS = gql`
	${MEMBER_FIELDS}
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
					...MemberFields
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;
export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;
export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($commentId: String!) {
		removeCommentByAdmin(commentId: $commentId) {
			_id
			commentStatus
		}
	}
`;
