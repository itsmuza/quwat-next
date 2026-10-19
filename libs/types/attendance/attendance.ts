import { OrdinaryInquiry, Paginated } from '../product/product';
export type AttendanceStatus = 'ABSENT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type StoredAttendanceStatus = Exclude<AttendanceStatus, 'ABSENT'>;
export interface AttendanceMember {
	_id: string;
	memberNick: string;
	memberFullName?: string | null;
}
export interface Attendance {
	_id: string;
	memberId: string;
	attendanceDate: string;
	attendanceStatus: StoredAttendanceStatus;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
	memberData?: AttendanceMember | null;
}
export interface AttendanceDay {
	memberId: string;
	attendanceDate: string;
	attendanceStatus: AttendanceStatus;
	attendanceId: string | null;
	requestedAt: string | null;
	reviewedAt: string | null;
	memberData?: AttendanceMember | null;
}
export type Attendances = Paginated<Attendance>;
export type AttendanceDays = Paginated<AttendanceDay>;
export interface MyAttendancesInquiry extends OrdinaryInquiry {
	fromDate?: string;
	toDate?: string;
	attendanceStatus?: AttendanceStatus;
}
export interface AdminAttendancesInquiry extends OrdinaryInquiry {
	fromDate?: string;
	toDate?: string;
	attendanceStatus?: StoredAttendanceStatus;
	memberId?: string;
}
export interface AgentAttendancesInquiry extends MyAttendancesInquiry {
	memberId: string;
}
export interface DailyAttendancesInquiry extends OrdinaryInquiry {
	date?: string;
	attendanceStatus?: AttendanceStatus;
}
export interface ReviewAttendanceInput {
	_id: string;
	attendanceStatus: 'APPROVED' | 'REJECTED';
}
