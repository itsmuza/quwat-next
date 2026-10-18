import { useText } from '../../../libs/i18n';
import React, { useEffect, useState } from 'react';
import { useApolloClient, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	MenuItem,
	Pagination,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { serverSideTranslations } from '../../../libs/serverTranslations';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { userVar } from '../../../apollo/store';
import { Member, Members } from '../../../libs/types/member/member';
import { MemberType, MemberStatus } from '../../../libs/enums/member.enum';
import { AdminMemberUpdate } from '../../../libs/types/member/member.update';
import { errorText, imageUrl } from '../../../libs/feedback';
import { totalOf } from '../../../libs/product';
import { restoreSession } from '../../../libs/auth';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import PermanentDeleteButton from '../../../libs/components/admin/PermanentDeleteButton';
import QueryState from '../../../libs/components/common/QueryState';
const roleLabels = { CLIENT: 'Mijoz', ADMIN: 'Administrator', AGENT: 'Agent' };
const statusLabels = { ACTIVE: 'Faol', BLOCK: 'Bloklangan', DELETE: 'O‘chirilgan' };
const roleColors = {
	CLIENT: { color: '#1646a0' },
	AGENT: { color: '#6941a5' },
	ADMIN: { color: '#8a4b08' },
};
const statusColors = {
	ACTIVE: { color: '#1e6539' },
	BLOCK: { color: '#9a4b09' },
	DELETE: { color: '#9f2924' },
};
const selectColors = (colors: { color: string }) => ({
	'& .MuiOutlinedInput-root': {
		color: colors.color,
		backgroundColor: 'transparent',
		fontWeight: 600,
		'& fieldset': { borderColor: '#d4d4d8' },
		'&:hover fieldset, &.Mui-focused fieldset': { borderColor: '#71717a' },
	},
	'& .MuiSelect-icon': { color: '#71717a' },
});
type MemberChange =
	| { member: Member; field: 'memberType'; value: MemberType }
	| { member: Member; field: 'memberStatus'; value: MemberStatus };
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function AdminUsers() {
	const { t, locale, errorMessage: translateError } = useText();
	const user = useReactiveVar(userVar);
	const client = useApolloClient();
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [submitted, setSubmitted] = useState('');
	const [role, setRole] = useState('');
	const [status, setStatus] = useState('');
	const [edit, setEdit] = useState<MemberChange | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const input = {
		page,
		limit: 20,
		search: { text: submitted || undefined, memberType: role || undefined, memberStatus: status || undefined },
	};
	const { data, loading, error, refetch } = useQuery<{ getAllMembersByAdmin: Members }>(GET_ALL_MEMBERS_BY_ADMIN, {
		variables: { input },
		fetchPolicy: 'network-only',
	});
	const [update] = useMutation<{ updateMemberByAdmin: Member }, { input: AdminMemberUpdate }>(UPDATE_MEMBER_BY_ADMIN);
	const pageCount = Math.max(1, Math.ceil(totalOf(data?.getAllMembersByAdmin) / 20));
	useEffect(() => {
		if (data && !loading && !error && page > pageCount) setPage(pageCount);
	}, [data, loading, error, page, pageCount]);
	function requestChange(change: MemberChange) {
		if (busy || change.value === change.member[change.field]) return;
		setMessage('');
		setEdit(change);
	}
	async function save() {
		if (!edit || busy) return;
		setBusy(true);
		setMessage('');
		try {
			const changes: AdminMemberUpdate = {
				_id: edit.member._id,
				...(edit.field === 'memberType' ? { memberType: edit.value } : { memberStatus: edit.value }),
			};
			await update({ variables: { input: changes } });
			const own = edit.member._id === user._id;
			setEdit(null);
			if (own) await restoreSession();
			else await refetch();
		} catch (error) {
			setMessage(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack className="quwat-page" spacing={3}>
			<Typography variant="h4">{t('Foydalanuvchilar')}</Typography>
			<Stack
				component="form"
				direction={{ xs: 'column', sm: 'row' }}
				gap={2}
				onSubmit={(e: React.FormEvent) => {
					e.preventDefault();
					setSubmitted(text);
					setPage(1);
				}}
			>
				<TextField label={t('Ism bo‘yicha qidirish')} value={text} onChange={(e) => setText(e.target.value)} />
				<TextField
					select
					label={t('Rol')}
					value={role}
					onChange={(e) => {
						setRole(e.target.value);
						setPage(1);
					}}
					sx={{ minWidth: 170 }}
				>
					<MenuItem value="">{t('Barchasi')}</MenuItem>
					{Object.values(MemberType).map((v) => (
						<MenuItem key={v} value={v}>
							{t(roleLabels[v])}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					label={t('Status')}
					value={status}
					onChange={(e) => {
						setStatus(e.target.value);
						setPage(1);
					}}
					sx={{ minWidth: 170 }}
				>
					<MenuItem value="">{t('Barchasi')}</MenuItem>
					{Object.values(MemberStatus).map((v) => (
						<MenuItem key={v} value={v}>
							{t(statusLabels[v])}
						</MenuItem>
					))}
				</TextField>
				<Button variant="contained" type="submit">
					{t('Qidirish')}
				</Button>
			</Stack>
			{message && <Alert severity="error">{translateError(message)}</Alert>}
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			<div className="quwat-records quwat-admin-user-records">
				{data?.getAllMembersByAdmin.list.map((m) => (
					<article className="quwat-record quwat-admin-user" key={m._id}>
						<Avatar
							className="quwat-admin-user-avatar"
							variant="rounded"
							src={imageUrl(m.memberImage)}
							alt={m.memberFullName || m.memberNick}
						>
							{(m.memberFullName || m.memberNick).charAt(0).toUpperCase()}
						</Avatar>
						<Typography className="quwat-admin-user-heading" variant="h6" component="h2">
							{m.memberFullName || m.memberNick}
						</Typography>
						<dl className="quwat-admin-user-details">
							{[
								[t('Rol'), t(roleLabels[m.memberType])],
								[t('Telefon'), m.memberPhone || t('Ko‘rsatilmagan')],
								[t('Manzil'), m.memberAddress || t('Ko‘rsatilmagan')],
								[
									t('Ro‘yxatdan o‘tgan'),
									new Date(m.createdAt).toLocaleDateString(locale, { timeZone: 'Asia/Tashkent' }),
								],
							].map(([label, value]) => (
								<div key={t(label)}>
									<dt>{t(label)}</dt>
									<dd>{value}</dd>
								</div>
							))}
						</dl>
						<div className="quwat-admin-user-controls">
							<div className="quwat-admin-user-fields">
								<TextField
									select
									label={t('Rol')}
									SelectProps={{
										renderValue: (selected) => (
											<span className="quwat-admin-select-value">
												<span className="quwat-admin-select-label" aria-hidden="true">
													{t('Rol')}
												</span>
												<span>{t(roleLabels[selected as MemberType])}</span>
											</span>
										),
									}}
									InputLabelProps={{ shrink: true }}
									value={m.memberType}
									disabled={busy}
									onChange={(e) =>
										requestChange({ member: m, field: 'memberType', value: e.target.value as MemberType })
									}
									sx={selectColors(roleColors[m.memberType])}
								>
									{Object.values(MemberType).map((v) => (
										<MenuItem key={v} value={v} sx={{ color: roleColors[v].color, fontWeight: 600 }}>
											{t(roleLabels[v])}
										</MenuItem>
									))}
								</TextField>
								<TextField
									select
									label={t('Status')}
									SelectProps={{
										renderValue: (selected) => (
											<span className="quwat-admin-select-value">
												<span className="quwat-admin-select-label" aria-hidden="true">
													{t('Status')}
												</span>
												<span>{t(statusLabels[selected as MemberStatus])}</span>
											</span>
										),
									}}
									InputLabelProps={{ shrink: true }}
									value={m.memberStatus}
									disabled={busy}
									onChange={(e) =>
										requestChange({ member: m, field: 'memberStatus', value: e.target.value as MemberStatus })
									}
									sx={selectColors(statusColors[m.memberStatus])}
								>
									{Object.values(MemberStatus).map((v) => (
										<MenuItem key={v} value={v} sx={{ color: statusColors[v].color, fontWeight: 600 }}>
											{t(statusLabels[v])}
										</MenuItem>
									))}
								</TextField>
							</div>
							<div className="quwat-admin-user-danger">
								{m._id !== user._id && m.memberType !== MemberType.ADMIN && (
									<PermanentDeleteButton
										kind="member"
										id={m._id}
										name={m.memberFullName || m.memberNick}
										disabled={busy}
										onBusy={setBusy}
										onDeleted={async () => {
											client.cache.evict({ id: client.cache.identify({ __typename: 'Member', _id: m._id }) });
											for (const fieldName of [
												'getAgents',
												'getMember',
												'getProducts',
												'getProduct',
												'getFavorites',
												'getVisited',
												'getSavedProducts',
												'getComments',
												'getAttendanceNotifications',
												'getAllAttendancesByAdmin',
												'getAgentAttendancesByAdmin',
												'getDailyAttendancesByAdmin',
											])
												client.cache.evict({ id: 'ROOT_QUERY', fieldName });
											await refetch();
										}}
									/>
								)}
							</div>
						</div>
					</article>
				))}
			</div>
			{data && !data.getAllMembersByAdmin.list.length && (
				<Alert severity="info">{t('Foydalanuvchilar topilmadi.')}</Alert>
			)}
			<Pagination page={page} count={pageCount} onChange={(_, v) => setPage(v)} />
			<Dialog
				open={Boolean(edit)}
				onClose={busy ? undefined : () => setEdit(null)}
				fullWidth
				maxWidth="sm"
				aria-labelledby="member-change-title"
				aria-describedby="member-change-description"
			>
				<DialogTitle id="member-change-title">
					{edit?.field === 'memberType' ? t('Rolni o‘zgartirish') : t('Statusni o‘zgartirish')}
				</DialogTitle>
				<DialogContent>
					<DialogContentText id="member-change-description">
						{edit &&
							t('{{name}}: {{before}} → {{after}}. O‘zgarish saqlansinmi?', {
								name: edit.member.memberFullName || edit.member.memberNick,
								before:
									edit.field === 'memberType'
										? t(roleLabels[edit.member.memberType])
										: t(statusLabels[edit.member.memberStatus]),
								after: edit.field === 'memberType' ? t(roleLabels[edit.value]) : t(statusLabels[edit.value]),
							})}
					</DialogContentText>
					{message && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{translateError(message)}
						</Alert>
					)}
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setEdit(null)}>
						{t('Bekor qilish')}
					</Button>
					<Button variant="contained" disabled={busy} onClick={() => void save()}>
						{t('Saqlash')}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
export default withAdminLayout(AdminUsers);
