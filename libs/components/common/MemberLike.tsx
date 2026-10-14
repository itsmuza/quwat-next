import { useText } from '../../i18n';
import React, { useState } from 'react';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { Alert, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { LIKE_TARGET_MEMBER } from '../../../apollo/user/mutation';
import { sessionVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { errorText } from '../../feedback';
import { activeQueryNames } from '../../activeQueries';

export default function MemberLike({ member }: { member: Member }) {
	const { t, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const session = useReactiveVar(sessionVar);
	const [error, setError] = useState('');
	const [like, { loading }] = useMutation<{ likeTargetMember: Member }, { input: string }>(LIKE_TARGET_MEMBER);
	const liked = Boolean(member.meLiked?.some((item) => item.myFavorite));
	async function toggle() {
		if (session.status !== 'authenticated') {
			setError('Davom etish uchun tizimga kiring.');
			return;
		}
		setError('');
		try {
			await like({
				variables: { input: member._id },
				refetchQueries: () => activeQueryNames(client, ['GetAgents', 'GetMember']),
				awaitRefetchQueries: true,
			});
		} catch (error) {
			setError(errorText(error));
		}
	}
	return (
		<Stack spacing={1} className="quwat-member-like">
			<Stack direction="row" alignItems="center" gap={1}>
				<Tooltip title={liked ? t('Yoqtirishni bekor qilish') : t('Yoqtirish')}>
					<span>
						<IconButton
							aria-label={t('Yoqtirish')}
							aria-pressed={liked}
							disabled={loading}
							onClick={() => void toggle()}
						>
							{liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
						</IconButton>
					</span>
				</Tooltip>
				<Typography variant="body2">{member.memberLikes}</Typography>
			</Stack>
			{error && <Alert severity="error">{translateError(error)}</Alert>}
		</Stack>
	);
}
