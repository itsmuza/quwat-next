import { useText } from '../../i18n';
import React from 'react';
import { attendanceLabels, attendanceMonth } from '../../attendance';
import { AttendanceDay } from '../../types/attendance/attendance';
export default function AttendanceCalendar({
	month,
	today,
	days,
	onReview,
}: {
	month: string;
	today: string;
	days: AttendanceDay[];
	onReview?: (day: AttendanceDay) => void;
}) {
	const { t } = useText();
	const calendar = attendanceMonth(month);
	const byDate = new Map(days.map((day) => [day.attendanceDate, day]));
	return (
		<div className="quwat-attendance-calendar" aria-label={t('Oylik davomat kalendari')}>
			<div className="quwat-calendar-grid">
				{[t('Dush'), t('Sesh'), t('Chor'), t('Pays'), t('Jum'), t('Shan'), t('Yak')].map((day) => (
					<div key={day} className="quwat-calendar-weekday">
						{day}
					</div>
				))}
				{Array.from({ length: calendar.leading }, (_, index) => (
					<div key={`empty-${index}`} aria-hidden="true" />
				))}
				{calendar.dates.map((date) => {
					const day = byDate.get(date);
					const status = date <= today ? day?.attendanceStatus : undefined;
					const label = status
						? t(attendanceLabels[status])
						: date > today
						? t('Kelajakdagi kun')
						: t('Davomat hisobi boshlanmagan');
					const className = `quwat-calendar-day ${status || 'UNTRACKED'}${date === today ? ' is-today' : ''}`;
					const content = (
						<>
							<strong>{Number(date.slice(-2))}</strong>
							<span>
								{status === 'APPROVED'
									? t('✓ Kelgan')
									: status === 'PENDING'
									? t('Kutilmoqda')
									: status === 'REJECTED'
									? t('Rad etilgan')
									: status === 'ABSENT'
									? t('Kelmagan')
									: '—'}
							</span>
						</>
					);
					return onReview && status === 'PENDING' && day?.attendanceId ? (
						<button
							key={date}
							type="button"
							className={className}
							aria-label={`${date} — ${label}`}
							title={t(label)}
							onClick={() => onReview(day)}
						>
							{content}
						</button>
					) : (
						<div key={date} className={className} aria-label={`${date} — ${label}`} title={t(label)}>
							{content}
						</div>
					);
				})}
			</div>
			<div className="quwat-calendar-legend">
				<span>
					<i className="APPROVED" /> {t('Kelgan')}
				</span>
				<span>
					<i className="ABSENT" /> {t('Kelmagan / rad etilgan')}
				</span>
				<span>
					<i className="PENDING" /> {t('Tasdiq kutilmoqda')}
				</span>
				<span>
					<i className="UNTRACKED" /> {t('Hisoblanmaydi')}
				</span>
			</div>
		</div>
	);
}
