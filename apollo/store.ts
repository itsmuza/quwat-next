import { makeVar } from '@apollo/client';
import { Member } from '../libs/types/member/member';
import { MemberType, MemberStatus, MemberAuthType } from '../libs/enums/member.enum';
export const themeVar = makeVar({});
type SessionUser = Omit<Member, 'memberType' | 'memberStatus' | 'memberAuthType'> & {
	memberType: MemberType | '';
	memberStatus: MemberStatus | '';
	memberAuthType: MemberAuthType | '';
};
export const emptyUser: SessionUser = {
	_id: '',
	memberType: '',
	memberStatus: '',
	memberAuthType: '',
	memberPhone: '',
	memberNick: '',
	memberImage: '',
	memberFullName: '',
	memberAddress: '',
	memberDesc: '',
	memberPoints: 0,
	memberLikes: 0,
	memberViews: 0,
	memberComments: 0,
	memberRank: 0,
	memberWarnings: 0,
	memberBlocks: 0,
	createdAt: '',
	updatedAt: '',
};
export const userVar = makeVar<SessionUser>({ ...emptyUser });
export const sessionVar = makeVar<{ status: 'loading' | 'authenticated' | 'anonymous' | 'error'; error: string }>({
	status: 'loading',
	error: '',
});
export const socketVar = makeVar<WebSocket | undefined>(undefined);
