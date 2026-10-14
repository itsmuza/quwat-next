import { gql } from '@apollo/client';
export const GET_ALL_ATTENDANCES_BY_ADMIN = gql`
	query GetAllAttendancesByAdmin($input: AdminAttendancesInquiry!) {
		getAllAttendancesByAdmin(input: $input) {
			list {
				_id
				memberId
				attendanceDate
				attendanceStatus
				reviewedAt
				createdAt
				updatedAt
				memberData {
					_id
					memberNick
					memberFullName
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const GET_DAILY_ATTENDANCES_BY_ADMIN = gql`
	query GetDailyAttendancesByAdmin($input: DailyAttendancesInquiry!) {
		getDailyAttendancesByAdmin(input: $input) {
			list {
				memberId
				attendanceDate
				attendanceStatus
				attendanceId
				requestedAt
				reviewedAt
				memberData {
					_id
					memberNick
					memberFullName
				}
			}
			metaCounter {
				total
			}
		}
	}
`;
export const REVIEW_ATTENDANCE = gql`
	mutation ReviewAttendance($input: ReviewAttendanceInput!) {
		reviewAttendance(input: $input) {
			_id
			memberId
			attendanceDate
			attendanceStatus
			reviewedAt
			updatedAt
			memberData {
				_id
				memberNick
				memberFullName
			}
		}
	}
`;
export const GET_AGENT_ATTENDANCES_BY_ADMIN = gql`
	query GetAgentAttendancesByAdmin($input: AgentAttendancesInquiry!) {
		getAgentAttendancesByAdmin(input: $input) {
			list {
				memberId
				attendanceDate
				attendanceStatus
				attendanceId
				requestedAt
				reviewedAt
			}
			metaCounter {
				total
			}
		}
	}
`;
