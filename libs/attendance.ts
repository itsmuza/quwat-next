import { AttendanceStatus } from './types/attendance/attendance';
export const attendanceLabels: Record<AttendanceStatus, string> = {
	ABSENT: 'Kelmagan',
	PENDING: 'Tasdiq kutilmoqda',
	APPROVED: 'Kelgan',
	REJECTED: 'Rad etilgan',
};
export function tashkentDate(date = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Tashkent',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	return ['year', 'month', 'day'].map((key) => parts.find((p) => p.type === key)?.value).join('-');
}
export function timestamp(value?: string | null, locale = 'uz-Latn-UZ'): string {
	return value
		? new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Tashkent', dateStyle: 'short', timeStyle: 'short' }).format(
				new Date(value),
		  )
		: '—';
}
export function validDate(value: string): boolean {
	return (
		/^\d{4}-\d{2}-\d{2}$/.test(value) &&
		Number.isFinite(Date.parse(value)) &&
		new Date(value).toISOString().slice(0, 10) === value
	);
}
export function validRange(from: string, to: string): boolean {
	return (!from || validDate(from)) && (!to || validDate(to)) && (!from || !to || from <= to);
}
export function validMonth(value: string): boolean {
	return /^\d{4}-\d{2}$/.test(value) && !value.startsWith('0000') && validDate(`${value}-01`);
}
export function attendanceMonth(value: string) {
	if (!validMonth(value)) throw new Error('Oy qiymatini tekshiring.');
	const first = new Date(`${value}-01T00:00:00Z`);
	const last = new Date(first);
	last.setUTCMonth(last.getUTCMonth() + 1);
	last.setUTCDate(0);
	return {
		fromDate: `${value}-01`,
		toDate: last.toISOString().slice(0, 10),
		leading: (first.getUTCDay() + 6) % 7,
		dates: Array.from({ length: last.getUTCDate() }, (_, index) => `${value}-${String(index + 1).padStart(2, '0')}`),
	};
}
