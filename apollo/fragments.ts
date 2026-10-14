import { gql } from '@apollo/client';
export const MEMBER_FIELDS = gql`
	fragment MemberFields on Member {
		_id
		memberType
		memberStatus
		memberAuthType
		memberPhone
		memberNick
		memberFullName
		memberImage
		memberAddress
		memberDesc
		memberPoints
		memberLikes
		memberViews
		memberComments
		memberRank
		memberWarnings
		memberBlocks
		deletedAt
		createdAt
		updatedAt
		meLiked {
			memberId
			likeRefId
			myFavorite
		}
	}
`;
export const PRODUCT_FIELDS = gql`
	fragment ProductFields on Product {
		_id
		productName
		productType
		productUnit
		productStatus
		productPrice
		productBrand
		productDesc
		productImages
		productQuantity
		productReservedQuantity
		productMinOrderQuantity
		productQuantityStep
		productLikes
		productViews
		productComments
		productRank
		archivedAt
		createdAt
		updatedAt
		meSaved
		meLiked {
			memberId
			likeRefId
			myFavorite
		}
	}
`;
