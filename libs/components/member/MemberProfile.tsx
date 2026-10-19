import { useText } from '../../i18n';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Avatar, Divider, Stack, Typography } from '@mui/material';
import { GET_MEMBER } from '../../../apollo/user/query';
import { sessionVar, userVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { imageUrl } from '../../feedback';
import { validId } from '../../product';
import CommentThread from '../common/CommentThread';
import QueryState from '../common/QueryState';
import MemberLike from '../common/MemberLike';
export default function MemberProfile({ agent }: { agent?: boolean }) {
	const { t } = useText();
	const router = useRouter();
	const id = agent ? router.query.agentId : router.query.memberId;
	const session = useReactiveVar(sessionVar);
	const user = useReactiveVar(userVar);
	const self = agent && session.status === 'authenticated' && user.memberType === 'AGENT' && id === user._id;
	useEffect(() => {
		if (router.isReady && self) void router.replace('/mypage');
	}, [router, self]);
	const { data, loading, error, refetch } = useQuery<{ getMember: Member }>(GET_MEMBER, {
		variables: { input: id },
		skip: !router.isReady || !validId(id) || session.status === 'loading' || Boolean(self),
		fetchPolicy: 'cache-and-network',
	});
	const member = data?.getMember;
	if (self) return <QueryState loading />;
	return (
		<Stack className="quwat-page" spacing={3}>
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			{router.isReady && !validId(id) && <Alert severity="warning">{t('Foydalanuvchi manzili noto‘g‘ri.')}</Alert>}
			{member && (
				<>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
						<Avatar src={imageUrl(member.memberImage)} sx={{ width: 120, height: 120 }} />
						<Stack spacing={1}>
							<Typography variant="h4">{member.memberFullName || member.memberNick}</Typography>
							<Typography>@{member.memberNick}</Typography>
							<Typography>{member.memberType === 'AGENT' ? t('Agent') : t('Foydalanuvchi')}</Typography>
							<Typography sx={{ whiteSpace: 'pre-wrap' }}>{member.memberDesc}</Typography>
							<MemberLike member={member} />
						</Stack>
					</Stack>
					<Divider />
					<CommentThread key={member._id} targetId={member._id} group="MEMBER" />
				</>
			)}
		</Stack>
	);
}
