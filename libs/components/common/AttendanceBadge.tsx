import { useText } from '../../i18n';
import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { AttendanceStatus } from '../../types/attendance/attendance';
import { attendanceLabels } from '../../attendance';

export default function AttendanceBadge({ status }: { status: AttendanceStatus }) {
	const { t } = useText();
	return (
		<Chip
			label={t(attendanceLabels[status])}
			icon={
				status === 'APPROVED' ? (
					<CheckCircleOutlineIcon />
				) : status === 'PENDING' ? (
					<HourglassEmptyIcon />
				) : status === 'REJECTED' ? (
					<CancelOutlinedIcon />
				) : (
					<RemoveCircleOutlineIcon />
				)
			}
			color={
				status === 'APPROVED'
					? 'success'
					: status === 'REJECTED'
					? 'error'
					: status === 'PENDING'
					? 'warning'
					: 'default'
			}
		/>
	);
}
