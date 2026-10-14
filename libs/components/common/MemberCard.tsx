import React from 'react';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { Avatar, Stack } from '@mui/material';
import { sessionVar, userVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../feedback';
import MemberLike from './MemberLike';
export default function MemberCard({ member }: { member: Member }) {
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const self = session.status === 'authenticated' && user.memberType === 'AGENT' && member._id === user._id;
	return (
		<Stack className="top-agent-card" alignItems="center">
			<Link passHref href={self ? '/mypage' : { pathname: '/agent/detail', query: { agentId: member._id } }}>
				<Stack alignItems="center">
					<Avatar src={imageUrl(member.memberImage)} sx={{ width: 209, height: 209 }} />
					<strong>{member.memberFullName || member.memberNick}</strong>
					<span>@{member.memberNick}</span>
				</Stack>
			</Link>
			<MemberLike member={member} />
		</Stack>
	);
}
