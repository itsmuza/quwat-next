import { useText } from '../../i18n';
import React, { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Avatar, Button, Divider, IconButton, Pagination, Stack, TextField, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { GET_COMMENTS, CREATE_COMMENT, UPDATE_COMMENT, REMOVE_COMMENT_BY_ADMIN } from '../../../apollo/user/comment';
import { userVar, sessionVar } from '../../../apollo/store';
import { Member } from '../../types/member/member';
import { Paginated } from '../../types/product/product';
import { totalOf } from '../../product';
import { errorText, imageUrl } from '../../feedback';
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
	const [editText, setEditText] = useState('');
	const [editMessage, setEditMessage] = useState('');
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
		if (busy || !text.trim()) return;
		setBusy(true);
		setMessage('');
		try {
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
	function cancelEdit() {
		setEditing('');
		setEditText('');
		setEditMessage('');
	}
	async function saveEdit(event: FormEvent) {
		event.preventDefault();
		if (busy || !editing || !editText.trim()) return;
		setBusy(true);
		setEditMessage('');
		try {
			await update({ variables: { input: { _id: editing, commentContent: editText.trim() } } });
			await refetch();
			await onChanged?.();
			cancelEdit();
		} catch (error) {
			setEditMessage(errorText(error));
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
			{message && <Alert severity="error">{translateError(message)}</Alert>}
			{session.status === 'authenticated' ? (
				<Stack component="form" aria-label={t('Izoh yozish')} onSubmit={submit} spacing={1}>
					<TextField
						InputLabelProps={{ shrink: true }}
						label={t('Izoh yozish')}
						value={text}
						onChange={(e) => setText(e.target.value)}
						inputProps={{ maxLength: 100 }}
						disabled={busy}
						required
					/>
					<Stack direction="row">
						<Button variant="contained" type="submit" disabled={busy || !text.trim()}>
							{t('Yuborish')}
						</Button>
					</Stack>
				</Stack>
			) : (
				<Typography>
					{t('Izoh yozish uchun')} <Link href="/account/join">{t('tizimga kiring')}</Link>.
				</Typography>
			)}
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			{data?.getComments.list.map((entry) => {
				const name = entry.memberData?.memberFullName || entry.memberData?.memberNick || t('Foydalanuvchi');
				const canEdit = session.status === 'authenticated' && entry.memberId === user._id;
				const canDelete =
					session.status === 'authenticated' && (entry.memberId === user._id || user.memberType === 'ADMIN');
				const isEditing = editing === entry._id && canEdit;
				return (
					<Stack key={entry._id} spacing={1} data-comment-id={entry._id}>
						<div className="quwat-comment-row">
							<Avatar src={imageUrl(entry.memberData?.memberImage)} alt={name} className="quwat-comment-avatar">
								{name.charAt(0).toUpperCase()}
							</Avatar>
							<Stack className="quwat-comment-body" spacing={1}>
								<Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" gap={0.5}>
									<Link href={{ pathname: '/member', query: { memberId: entry.memberId } }}>{name}</Link>
								</Stack>
								{isEditing ? (
									<Stack
										component="form"
										aria-label={t('Izohni tahrirlash')}
										onSubmit={saveEdit}
										spacing={1.5}
										sx={{ p: 2, border: '1px solid #d4d4d8', borderRadius: 2, bgcolor: '#fafafa' }}
									>
										<TextField
											autoFocus
											fullWidth
											size="small"
											InputLabelProps={{ shrink: true }}
											label={t('Izohni tahrirlash')}
											value={editText}
											onChange={(event) => setEditText(event.target.value)}
											inputProps={{ maxLength: 100 }}
											disabled={busy}
											required
										/>
										{editMessage && <Alert severity="error">{translateError(editMessage)}</Alert>}
										<Stack direction="row" gap={1} flexWrap="wrap">
											<Button variant="contained" type="submit" disabled={busy || !editText.trim()}>
												{busy ? t('Yuborilmoqda…') : t('Saqlash')}
											</Button>
											<Button variant="outlined" type="button" disabled={busy} onClick={cancelEdit}>
												{t('Bekor qilish')}
											</Button>
										</Stack>
									</Stack>
								) : (
									<Typography sx={{ overflowWrap: 'anywhere' }}>{entry.commentContent}</Typography>
								)}
							</Stack>
							<Stack direction="row" alignItems="center" gap={1} className="quwat-comment-actions">
								{!isEditing && canEdit && (
									<IconButton
										className="quwat-comment-action quwat-comment-edit"
										size="small"
										aria-label={t('Tahrirlash')}
										title={t('Tahrirlash')}
										disabled={busy}
										onClick={() => {
											setEditing(entry._id);
											setEditText(entry.commentContent);
											setEditMessage('');
										}}
									>
										<EditOutlinedIcon fontSize="small" />
									</IconButton>
								)}
								{!isEditing && canDelete && (
									<IconButton
										className="quwat-comment-action quwat-comment-delete"
										size="small"
										aria-label={t('O‘chirish')}
										title={t('O‘chirish')}
										disabled={busy}
										onClick={() => void erase(entry)}
									>
										<DeleteOutlineIcon fontSize="small" />
									</IconButton>
								)}
								<Typography variant="caption" className="quwat-comment-date">
									{new Date(entry.createdAt).toLocaleDateString(locale)}
								</Typography>
							</Stack>
						</div>
						<Divider />
					</Stack>
				);
			})}
			{data && !data.getComments.list.length && (
				<Typography color="text.secondary">{t('Hali izohlar yo‘q.')}</Typography>
			)}
			{data && (
				<Pagination
					disabled={busy}
					page={page}
					count={Math.max(1, Math.ceil(totalOf(data.getComments) / 10))}
					onChange={(_, v) => {
						cancelEdit();
						setPage(v);
					}}
				/>
			)}
		</Stack>
	);
}
