import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { MeLiked, Paginated } from '../product/product';
export interface Member {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	memberPhone: string;
	memberNick: string;
	memberFullName?: string | null;
	memberImage?: string | null;
	memberAddress?: string | null;
	memberDesc?: string | null;
	memberPoints: number;
	memberLikes: number;
	memberViews: number;
	memberComments: number;
	memberRank: number;
	memberWarnings: number;
	memberBlocks: number;
	deletedAt?: string | null;
	createdAt: string;
	updatedAt: string;
	guestLiked?: boolean;
	meLiked?: MeLiked[] | null;
	accessToken?: string | null;
}
export type Members = Paginated<Member>;
