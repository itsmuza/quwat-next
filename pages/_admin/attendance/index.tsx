import { useText } from '../../../libs/i18n';
import React, { useEffect, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import {
	Alert,
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Pagination,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { serverSideTranslations } from '../../../libs/serverTranslations';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { GET_ALL_MEMBERS_BY_ADMIN } from '../../../apollo/admin/query';
import {
	GET_AGENT_ATTENDANCES_BY_ADMIN,
	GET_ALL_ATTENDANCES_BY_ADMIN,
	REVIEW_ATTENDANCE,
} from '../../../apollo/admin/attendance';
import {
	Attendance,
	AttendanceDay,
	Attendances,
	AttendanceDays,
	ReviewAttendanceInput,
	AgentAttendancesInquiry,
} from '../../../libs/types/attendance/attendance';
import { Member, Members } from '../../../libs/types/member/member';
import { activeQueryNames } from '../../../libs/activeQueries';
import { attendanceMonth } from '../../../libs/attendance';
import { totalOf } from '../../../libs/product';
import { errorText, imageUrl } from '../../../libs/feedback';
import QueryState from '../../../libs/components/common/QueryState';
import AttendanceCalendar from '../../../libs/components/attendance/AttendanceCalendar';
import useAttendanceMonth from '../../../libs/components/attendance/useAttendanceMonth';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function AgentCalendar({ agent, onBusyChange }: { agent: Member; onBusyChange: (busy: boolean) => void }) {
	const { t, locale, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const { today, month, setMonth } = useAttendanceMonth();
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<{ id: string; date: string } | null>(null);
	const [message, setMessage] = useState('');
	const range = attendanceMonth(month);
	const calendar = useQuery<{ getAgentAttendancesByAdmin: AttendanceDays }, { input: AgentAttendancesInquiry }>(
		GET_AGENT_ATTENDANCES_BY_ADMIN,
		{
			variables: { input: { memberId: agent._id, page: 1, limit: 31, fromDate: range.fromDate, toDate: range.toDate } },
			fetchPolicy: 'network-only',
			pollInterval: 30000,
		},
	);
	const pending = useQuery<{ getAllAttendancesByAdmin: Attendances }>(GET_ALL_ATTENDANCES_BY_ADMIN, {
		variables: { input: { memberId: agent._id, page, limit: 20, attendanceStatus: 'PENDING' } },
		fetchPolicy: 'network-only',
		pollInterval: 30000,
	});
	const [review, { loading: busy }] = useMutation<{ reviewAttendance: Attendance }, { input: ReviewAttendanceInput }>(
		REVIEW_ATTENDANCE,
	);
	const requests = !pending.loading && !pending.error ? pending.data?.getAllAttendancesByAdmin : undefined;
	const pendingPages = requests ? Math.max(1, Math.ceil(totalOf(requests) / 20)) : undefined;
	useEffect(() => {
		if (pendingPages && page > pendingPages) setPage(pendingPages);
	}, [page, pendingPages]);
	async function decide(attendanceStatus: 'APPROVED' | 'REJECTED') {
		if (!selected || busy) return;
		setMessage('');
		onBusyChange(true);
		try {
			await review({ variables: { input: { _id: selected.id, attendanceStatus } } });
			setSelected(null);
			await Promise.all([
				calendar.refetch(),
				pending.refetch(),
				client.refetchQueries({ include: activeQueryNames(client, ['GetAttendanceNotifications']) }),
			]).catch(() => undefined);
		} catch (error) {
			setMessage(errorText(error));
		} finally {
			onBusyChange(false);
		}
	}
	function selectDay(day: AttendanceDay) {
		if (day.attendanceId) {
			setMessage('');
			setSelected({ id: day.attendanceId, date: day.attendanceDate });
		}
	}
	return (
		<Stack spacing={3}>
			<Typography variant="h5">{agent.memberFullName || agent.memberNick}</Typography>
			<TextField
				type="month"
				label={t('Oy')}
				value={month}
				inputProps={{ max: today.slice(0, 7) }}
				InputLabelProps={{ shrink: true }}
				onChange={(e) => setMonth(e.target.value)}
				sx={{ width: 220, maxWidth: '100%' }}
			/>
			<QueryState loading={calendar.loading} error={calendar.error} retry={() => calendar.refetch()} />
			{!calendar.loading && !calendar.error && calendar.data && (
				<AttendanceCalendar
					month={month}
					today={today}
					days={calendar.data.getAgentAttendancesByAdmin.list}
					onReview={selectDay}
				/>
			)}
			<QueryState loading={pending.loading && !pending.data} error={pending.error} retry={() => pending.refetch()} />
			{requests && requests.list.length > 0 && (
				<Stack spacing={2}>
					<Typography variant="h6">{t('Kutilayotgan so‘rovlar')}</Typography>
					{requests.list.map((request) => (
						<Stack
							key={request._id}
							className="quwat-record"
							direction="row"
							justifyContent="space-between"
							alignItems="center"
							flexWrap="wrap"
							gap={1}
						>
							<Typography>{request.attendanceDate}</Typography>
							<Button
								disabled={busy}
								onClick={() => {
									setMessage('');
									setSelected({ id: request._id, date: request.attendanceDate });
								}}
							>
								{t('Ko‘rib chiqish')}
							</Button>
						</Stack>
					))}
					{totalOf(requests) > 20 && (
						<Pagination page={page} count={Math.ceil(totalOf(requests) / 20)} onChange={(_, value) => setPage(value)} />
					)}
				</Stack>
			)}
			<Dialog
				open={Boolean(selected)}
				onClose={busy ? undefined : () => setSelected(null)}
				fullWidth
				maxWidth="sm"
				aria-labelledby="attendance-review-title"
			>
				<DialogTitle id="attendance-review-title">{t('Davomat so‘rovi')}</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{agent.memberFullName || agent.memberNick} — {selected?.date}
						{t('. Ishga kelganini tasdiqlang yoki so‘rovni rad eting. Yakuniy qarorni o‘zgartirib bo‘lmaydi.')}
					</DialogContentText>
					{message && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{translateError(message)}
						</Alert>
					)}
				</DialogContent>
				<DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
					<Button disabled={busy} onClick={() => setSelected(null)}>
						{t('Ortga')}
					</Button>
					<Button disabled={busy} color="error" onClick={() => void decide('REJECTED')}>
						{t('Rad etish')}
					</Button>
					<Button
						disabled={busy}
						variant="contained"
						color="success"
						sx={{ color: '#fff' }}
						onClick={() => void decide('APPROVED')}
					>
						{t('Tasdiqlash')}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
function AttendanceAdmin() {
	const { t, locale, errorMessage: translateError } = useText();
	const [page, setPage] = useState(1);
	const [agentId, setAgentId] = useState<string | null>(null);
	const [reviewBusy, setReviewBusy] = useState(false);
	const members = useQuery<{ getAllMembersByAdmin: Members }>(GET_ALL_MEMBERS_BY_ADMIN, {
		variables: { input: { page, limit: 20, sort: 'createdAt', direction: 'DESC', search: { memberType: 'AGENT' } } },
		fetchPolicy: 'network-only',
	});
	const rows = !members.loading && !members.error ? members.data?.getAllMembersByAdmin : undefined;
	const agent = rows?.list.find((member) => member._id === agentId) || rows?.list[0];
	return (
		<Stack className="quwat-page quwat-attendance-admin" spacing={3}>
			<Typography variant="h4">{t('Agentlar davomati')}</Typography>
			<QueryState loading={members.loading} error={members.error} retry={() => members.refetch()} />
			{rows && rows.list.length > 0 && (
				<div>
					<div className="quwat-attendance-agents" aria-label={t('Agentlar')}>
						{rows.list.map((member) => {
							const name = member.memberFullName || member.memberNick;
							return (
								<Button
									key={member._id}
									className="quwat-attendance-agent"
									disabled={reviewBusy}
									onClick={() => setAgentId(member._id)}
									aria-label={t('{{name}} davomati', { name })}
									aria-pressed={agent?._id === member._id}
								>
									<Avatar src={imageUrl(member.memberImage)} alt={name} imgProps={{ loading: 'lazy' }} />
									<span className="quwat-attendance-agent-name" title={name}>
										{name}
									</span>
								</Button>
							);
						})}
					</div>
					{rows.list.length > 2 && (
						<div className="quwat-attendance-agent-scroll-hint">
							<SwapHorizRoundedIcon aria-hidden="true" />
							<span>{t('Boshqa agentlarni ko‘rish uchun suring')}</span>
						</div>
					)}
				</div>
			)}
			{rows && !rows.list.length && <Alert severity="info">{t('Agentlar topilmadi.')}</Alert>}
			{totalOf(rows) > 20 && (
				<Pagination
					page={page}
					count={Math.ceil(totalOf(rows) / 20)}
					disabled={reviewBusy}
					onChange={(_, value) => {
						setAgentId(null);
						setPage(value);
					}}
				/>
			)}
			{agent && <AgentCalendar key={agent._id} agent={agent} onBusyChange={setReviewBusy} />}
		</Stack>
	);
}
export default withAdminLayout(AttendanceAdmin);
