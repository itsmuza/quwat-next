import { useText } from '../../i18n';
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { GET_MY_ATTENDANCES, REQUEST_ATTENDANCE } from '../../../apollo/user/attendance';
import { Attendance, AttendanceDays, MyAttendancesInquiry } from '../../types/attendance/attendance';
import { attendanceMonth } from '../../attendance';
import { errorText } from '../../feedback';
import QueryState from '../common/QueryState';
import AttendanceBadge from '../common/AttendanceBadge';
import AttendanceCalendar from '../attendance/AttendanceCalendar';
import useAttendanceMonth from '../attendance/useAttendanceMonth';
export default function MyAttendance() {
	const { t, errorMessage: translateError } = useText();
	const { today, month, setMonth } = useAttendanceMonth();
	const [message, setMessage] = useState('');
	const range = attendanceMonth(month);
	const calendar = useQuery<{ getMyAttendances: AttendanceDays }, { input: MyAttendancesInquiry }>(GET_MY_ATTENDANCES, {
		variables: { input: { page: 1, limit: 31, fromDate: range.fromDate, toDate: range.toDate } },
		fetchPolicy: 'network-only',
	});
	const current = useQuery<{ getMyAttendances: AttendanceDays }, { input: MyAttendancesInquiry }>(GET_MY_ATTENDANCES, {
		variables: { input: { page: 1, limit: 1, fromDate: today, toDate: today } },
		fetchPolicy: 'network-only',
		pollInterval: 30000,
	});
	const [request, { loading: busy }] = useMutation<{ requestAttendance: Attendance }>(REQUEST_ATTENDANCE);
	const day = current.data?.getMyAttendances.list.find((row) => row.attendanceDate === today);
	const status = day?.attendanceStatus;
	const refetch = calendar.refetch;
	useEffect(() => {
		if (status && status !== 'ABSENT') void refetch().catch(() => undefined);
	}, [today, status, refetch]);
	async function send() {
		if (busy || status !== 'ABSENT') return;
		setMessage('');
		try {
			const { data } = await request();
			if (!data?.requestAttendance) throw new Error('So‘rov javobi olinmadi. Qayta urinib ko‘ring.');
			await Promise.all([current.refetch(), calendar.refetch()]);
		} catch (error) {
			setMessage(errorText(error));
		}
	}
	return (
		<Stack spacing={3}>
			<Typography variant="h4">{t('Mening davomatim')}</Typography>
			<Stack direction="row" gap={2} flexWrap="wrap" alignItems="center" justifyContent="space-between">
				<TextField
					type="month"
					label={t('Oy')}
					value={month}
					inputProps={{ max: today.slice(0, 7) }}
					InputLabelProps={{ shrink: true }}
					onChange={(e) => setMonth(e.target.value)}
					sx={{ width: 220, maxWidth: '100%' }}
				/>
				<Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
					<Typography variant="body2">
						{t('Bugun:')} {today}
					</Typography>
					{day && <AttendanceBadge status={day.attendanceStatus} />}
					<Button
						variant="contained"
						disabled={busy || current.loading || Boolean(current.error) || status !== 'ABSENT'}
						onClick={() => void send()}
					>
						{busy ? t('Yuborilmoqda…') : t('Ishga keldim')}
					</Button>
				</Stack>
			</Stack>
			{message && <Alert severity="error">{translateError(message)}</Alert>}
			<QueryState loading={current.loading && !current.data} error={current.error} retry={() => current.refetch()} />
			<QueryState loading={calendar.loading} error={calendar.error} retry={() => calendar.refetch()} />
			{!calendar.loading && !calendar.error && calendar.data && (
				<AttendanceCalendar month={month} today={today} days={calendar.data.getMyAttendances.list} />
			)}
		</Stack>
	);
}
