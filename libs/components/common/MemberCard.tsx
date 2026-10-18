import React from 'react';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { Avatar } from '@mui/material';
import { sessionVar, userVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../feedback';
import { useText } from '../../i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import MemberLike from './MemberLike';

export default function MemberCard({ member, showNickname = true }: { member: Member; showNickname?: boolean }) {
	const { t } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const self = session.status === 'authenticated' && user.memberType === 'AGENT' && member._id === user._id;
	return (
		<Card className="quwat-member-card">
			<Link
				passHref
				href={self ? '/mypage' : { pathname: '/agent/detail', query: { agentId: member._id } }}
				className="quwat-member-profile"
			>
				<div className="quwat-member-cover">
					<span>{t('Agent')}</span>
				</div>
				<CardHeader>
					<Avatar src={imageUrl(member.memberImage)} className="quwat-member-avatar" />
					<CardTitle
						title={member.memberFullName || member.memberNick}
						className={showNickname ? '' : 'quwat-member-name-centered'}
					>
						{member.memberFullName || member.memberNick}
					</CardTitle>
					{showNickname && <CardDescription>@{member.memberNick}</CardDescription>}
				</CardHeader>
			</Link>
			<CardFooter>
				<MemberLike member={member} />
			</CardFooter>
		</Card>
	);
}
