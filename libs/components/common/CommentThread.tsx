import { useText } from '../../i18n';
import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Divider, Pagination, Stack, TextField, Typography } from '@mui/material';
import { GET_COMMENTS, CREATE_COMMENT, UPDATE_COMMENT, REMOVE_COMMENT_BY_ADMIN } from '../../../apollo/user/comment';
import { userVar, sessionVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { Paginated } from '../../types/product/product';
import { totalOf } from '../../product';
import { errorText } from '../../feedback';
import QueryState from './QueryState';
interface Entry {
	_id: string;
	commentContent: string;
	memberId: string;
	createdAt: string;
	memberData?: Member | null;
}
export default function CommentThread({
	targetId,
	group,
	onChanged,
}: {
	targetId: string;
	group: 'PRODUCT' | 'MEMBER';
	onChanged?: () => unknown;
}) {
	const { t, locale, errorMessage: translateError } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [editing, setEditing] = useState('');
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const input = {
		page,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: { commentRefId: targetId, commentGroup: group },
	};
	const { data, loading, error, refetch } = useQuery<{ getComments: Paginated<Entry> }>(GET_COMMENTS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
	});
	const [create] = useMutation(CREATE_COMMENT);
	const [update] = useMutation(UPDATE_COMMENT);
	const [remove] = useMutation(REMOVE_COMMENT_BY_ADMIN);
	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!text.trim()) return;
		setBusy(true);
		setMessage('');
		try {
			if (editing) await update({ variables: { input: { _id: editing, commentContent: text.trim() } } });
			else
				await create({
					variables: { input: { commentRefId: targetId, commentGroup: group, commentContent: text.trim() } },
				});
			setText('');
			setEditing('');
			setPage(1);
			await refetch({ input: { ...input, page: 1 } });
			await onChanged?.();
		} catch (error) {
			setMessage(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	async function erase(entry: Entry) {
		if (!window.confirm(t('Izoh o‘chirilsinmi?'))) return;
		setBusy(true);
		setMessage('');
		try {
			if (entry.memberId === user._id)
				await update({ variables: { input: { _id: entry._id, commentStatus: 'DELETE' } } });
			else await remove({ variables: { commentId: entry._id } });
			await refetch();
			await onChanged?.();
		} catch (error) {
			setMessage(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack spacing={2}>
			<Typography variant="h5">{t('Izohlar')}</Typography>
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			{data?.getComments.list.map((entry) => (
				<Stack key={entry._id} spacing={1}>
					<Stack direction="row" justifyContent="space-between">
						<Link href={{ pathname: '/member', query: { memberId: entry.memberId } }}>
							{entry.memberData?.memberNick || t('Foydalanuvchi')}
						</Link>
						<Typography variant="caption">{new Date(entry.createdAt).toLocaleDateString(locale)}</Typography>
					</Stack>
					<Typography sx={{ overflowWrap: 'anywhere' }}>{entry.commentContent}</Typography>
					<Stack direction="row" spacing={1}>
						{entry.memberId === user._id && (
							<Button
								size="small"
								disabled={busy}
								onClick={() => {
									setEditing(entry._id);
									setText(entry.commentContent);
								}}
							>
								{t('Tahrirlash')}
							</Button>
						)}
						{session.status === 'authenticated' && (entry.memberId === user._id || user.memberType === 'ADMIN') && (
							<Button size="small" color="error" disabled={busy} onClick={() => void erase(entry)}>
								{t('O‘chirish')}
							</Button>
						)}
					</Stack>
					<Divider />
				</Stack>
			))}
			{data && !data.getComments.list.length && (
				<Typography color="text.secondary">{t('Hali izohlar yo‘q.')}</Typography>
			)}
			{data && (
				<Pagination
					page={page}
					count={Math.max(1, Math.ceil(totalOf(data.getComments) / 10))}
					onChange={(_, v) => setPage(v)}
				/>
			)}
			{message && <Alert severity="error">{translateError(message)}</Alert>}
			{session.status === 'authenticated' ? (
				<Stack component="form" onSubmit={submit} spacing={1}>
					<TextField
						InputLabelProps={{ shrink: true }}
						label={editing ? t('Izohni tahrirlash') : t('Izoh yozish')}
						value={text}
						onChange={(e) => setText(e.target.value)}
						inputProps={{ maxLength: 100 }}
						required
					/>
					<Stack direction="row">
						<Button variant="contained" type="submit" disabled={busy || !text.trim()}>
							{t('Yuborish')}
						</Button>
						{editing && (
							<Button
								onClick={() => {
									setEditing('');
									setText('');
								}}
							>
								{t('Bekor qilish')}
							</Button>
						)}
					</Stack>
				</Stack>
			) : (
				<Typography>
					{t('Izoh yozish uchun')} <Link href="/account/join">{t('tizimga kiring')}</Link>.
				</Typography>
			)}
		</Stack>
	);
}
