import { MemberStatus, MemberType } from '../../enums/member.enum';
export interface MemberUpdate {
	memberPhone?: string;
	memberNick?: string;
	memberPassword?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
}
export interface AdminMemberUpdate extends MemberUpdate {
	_id: string;
	memberType?: MemberType;
	memberStatus?: MemberStatus;
}
