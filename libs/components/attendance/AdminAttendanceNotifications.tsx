import React, { useEffect, useRef, useState } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Badge,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Drawer,
	IconButton,
	Snackbar,
	Stack,
	Typography,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { useReducedMotion } from 'framer-motion';
import { sessionVar, userVar } from '../../../apollo/store';
import { GET_ATTENDANCE_NOTIFICATIONS, REVIEW_ATTENDANCE } from '../../../apollo/admin/attendance';
import { Attendance, ReviewAttendanceInput } from '../../types/attendance/attendance';
import { useText } from '../../i18n';
import { timestamp } from '../../attendance';
import { totalOf } from '../../product';
import { errorText } from '../../feedback';
import { activeQueryNames } from '../../activeQueries';
import QueryState from '../common/QueryState';
import useNotificationFeed from '../notifications/useNotificationFeed';

const pendingInput = { attendanceStatus: 'PENDING' };
const attendanceKey = (entry: Attendance) => entry._id;
const agentName = (entry: Attendance) =>
	entry.memberData?.memberFullName || entry.memberData?.memberNick || `#${entry.memberId.slice(-6).toUpperCase()}`;

export default function AdminAttendanceNotifications({ onLightBackground = false }: { onLightBackground?: boolean }) {
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	if (session.status !== 'authenticated' || user.memberType !== 'ADMIN' || user.memberStatus !== 'ACTIVE') return null;
	return <AttendanceInbox key={user._id} onLightBackground={onLightBackground} />;
}

function AttendanceInbox({ onLightBackground }: { onLightBackground: boolean }) {
	const { t, locale, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const reducedMotion = useReducedMotion();
	const alive = useRef(true);
	const submitting = useRef(false);
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<{
		request: Attendance;
		status: ReviewAttendanceInput['attendanceStatus'];
	} | null>(null);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState('');
	const [success, setSuccess] = useState('');
	const [toast, setToast] = useState(false);
	const previousCount = useRef<number | null>(null);
	const { source, list, loading, error, refresh, moreLoading, moreError } = useNotificationFeed<Attendance>({
		query: GET_ATTENDANCE_NOTIFICATIONS,
		field: 'getAttendanceNotifications',
		keyOf: attendanceKey,
		input: pendingInput,
		pollInterval: 5000,
	});
	const count = totalOf(source);
	useEffect(() => {
		alive.current = true;
		return () => {
			alive.current = false;
		};
	}, []);
	useEffect(() => {
		if (!source) return;
		if (previousCount.current !== null && count > previousCount.current) setToast(true);
		previousCount.current = count;
	}, [source, count]);
	async function decide() {
		if (!selected || submitting.current) return;
		submitting.current = true;
		setBusy(true);
		setActionError('');
		const choice = selected;
		try {
			await client.mutate<{ reviewAttendance: Attendance }, { input: ReviewAttendanceInput }>({
				mutation: REVIEW_ATTENDANCE,
				variables: { input: { _id: choice.request._id, attendanceStatus: choice.status } },
			});
			if (!alive.current) return;
			setSelected(null);
			setSuccess(choice.status === 'APPROVED' ? 'Davomat tasdiqlandi.' : 'Davomat so‘rovi rad etildi.');
			await client.refetchQueries({
				include: activeQueryNames(client, [
					'GetAttendanceNotifications',
					'GetAllAttendancesByAdmin',
					'GetAgentAttendancesByAdmin',
					'GetDailyAttendancesByAdmin',
				]),
			});
		} catch (error) {
			if (alive.current) {
				setActionError(errorText(error));
				refresh();
			}
		} finally {
			submitting.current = false;
			if (alive.current) setBusy(false);
		}
	}
	return (
		<>
			<IconButton
				className="quwat-navbar-notifications"
				sx={onLightBackground ? { color: '#18181b', border: 0 } : undefined}
				aria-label={t('Davomat bildirishnomalari: {{count}} ta kutilmoqda', { count })}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={open ? 'quwat-attendance-notifications-panel' : undefined}
				onClick={() => {
					setOpen(true);
					setToast(false);
					refresh();
				}}
			>
				<Badge badgeContent={count} max={99} color="error">
					<NotificationsNoneOutlinedIcon />
				</Badge>
			</IconButton>
			<Drawer
				className="quwat-notifications-drawer"
				anchor="right"
				open={open}
				onClose={busy ? undefined : () => setOpen(false)}
				transitionDuration={reducedMotion ? 0 : { enter: 280, exit: 220 }}
				PaperProps={{
					id: 'quwat-attendance-notifications-panel',
					className: 'quwat-notifications-panel',
					role: 'dialog',
					'aria-modal': true,
					'aria-labelledby': 'quwat-attendance-notifications-title',
				}}
			>
				<header className="quwat-notifications-header">
					<div>
						<Typography id="quwat-attendance-notifications-title" component="h2" variant="h6">
							{t('Davomat bildirishnomalari')}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{t('{{count}} ta kutilayotgan so‘rov', { count })}
						</Typography>
					</div>
					<IconButton
						autoFocus
						disabled={busy}
						aria-label={t('Bildirishnomalarni yopish')}
						onClick={() => setOpen(false)}
					>
						<CloseIcon />
					</IconButton>
				</header>
				<div className="quwat-notifications-body">
					<Stack spacing={2}>
						{success && (
							<Alert severity="success" onClose={() => setSuccess('')}>
								{t(success)}
							</Alert>
						)}
						{actionError && !selected && <Alert severity="error">{translateError(actionError)}</Alert>}
						<QueryState loading={loading && !source} error={error} retry={refresh} />
						{source && !list.length && <Alert severity="info">{t('Hozircha davomat so‘rovlari yo‘q.')}</Alert>}
						{list.map((request) => (
							<article key={request._id} className="quwat-notification-card quwat-attendance-notification">
								<Typography fontWeight={600}>{agentName(request)}</Typography>
								<Typography variant="body2">
									{t('Davomat')} · {request.attendanceDate}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{t('Tasdiq kutilmoqda')}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{timestamp(request.createdAt, locale)} · {t('Toshkent vaqti')}
								</Typography>
								<div className="quwat-notification-actions">
									<Button
										startIcon={<BlockOutlinedIcon />}
										variant="outlined"
										color="error"
										disabled={busy}
										onClick={() => {
											setActionError('');
											setSelected({ request, status: 'REJECTED' });
										}}
									>
										{t('Rad etish')}
									</Button>
									<Button
										startIcon={<CheckOutlinedIcon />}
										variant="contained"
										color="success"
										disabled={busy}
										onClick={() => {
											setActionError('');
											setSelected({ request, status: 'APPROVED' });
										}}
									>
										{t('Tasdiqlash')}
									</Button>
								</div>
							</article>
						))}
						<QueryState loading={moreLoading} error={moreError} retry={refresh} />
					</Stack>
				</div>
			</Drawer>
			<Dialog
				open={Boolean(selected)}
				onClose={busy ? undefined : () => setSelected(null)}
				fullWidth
				maxWidth="sm"
				aria-labelledby="quwat-attendance-notification-decision"
			>
				<DialogTitle id="quwat-attendance-notification-decision">
					{t(selected?.status === 'REJECTED' ? 'So‘rovni rad etish' : 'Tasdiqlash')}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{selected &&
							t(
								selected.status === 'APPROVED'
									? '{{name}}ning {{date}} kungi davomatini tasdiqlaysizmi?'
									: '{{name}}ning {{date}} kungi davomat so‘rovini rad etasizmi?',
								{ name: agentName(selected.request), date: selected.request.attendanceDate },
							)}
					</DialogContentText>
					{actionError && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{translateError(actionError)}
						</Alert>
					)}
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setSelected(null)}>
						{t('Ortga')}
					</Button>
					<Button
						disabled={busy}
						variant="contained"
						color={selected?.status === 'REJECTED' ? 'error' : 'success'}
						onClick={() => void decide()}
					>
						{t(selected?.status === 'REJECTED' ? 'Rad etish' : 'Tasdiqlash')}
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={toast && !open}
				autoHideDuration={4000}
				onClose={() => setToast(false)}
				message={t('Yangi davomat so‘rovi keldi.')}
			/>
		</>
	);
}
