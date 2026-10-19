import React from 'react';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { Avatar } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { sessionVar, userVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../feedback';
import { useText } from '../../i18n';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import MemberLike from './MemberLike';

export default function MemberCard({
	member,
	showNickname = true,
	showProfileLink = false,
	showDescription = false,
}: {
	member: Member;
	showNickname?: boolean;
	showProfileLink?: boolean;
	showDescription?: boolean;
}) {
	const { t } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const self = session.status === 'authenticated' && user.memberType === 'AGENT' && member._id === user._id;
	const profileRoute = self ? '/mypage' : { pathname: '/agent/detail', query: { agentId: member._id } };
	return (
		<Card className="quwat-member-card">
			<Link passHref href={profileRoute} className="quwat-member-profile">
				<div className="quwat-member-cover">
					<span>{t('Agent')}</span>
				</div>
				<CardHeader>
					<div className="quwat-member-image">
						<Avatar src={imageUrl(member.memberImage)} className="quwat-member-avatar" />
					</div>
					<CardTitle
						title={member.memberFullName || member.memberNick}
						className={showNickname ? '' : 'quwat-member-name-centered'}
					>
						{member.memberFullName || member.memberNick}
					</CardTitle>
					{showNickname && <CardDescription>@{member.memberNick}</CardDescription>}
					{showDescription && (
						<CardDescription className="quwat-home-member-description">
							{member.memberDesc || t('Quwat jamoasi')}
						</CardDescription>
					)}
				</CardHeader>
			</Link>
			<CardFooter>
				<MemberLike member={member} />
				{showProfileLink && (
					<Link passHref href={profileRoute} className="quwat-member-details">
						{t(self ? 'Shaxsiy bo‘lim' : 'Profilni ko‘rish')}
						<ChevronRightRoundedIcon aria-hidden="true" />
					</Link>
				)}
			</CardFooter>
		</Card>
	);
}
