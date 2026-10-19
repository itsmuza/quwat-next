import { gql } from '@apollo/client';
export const GET_MY_ATTENDANCES = gql`
	query GetMyAttendances($input: MyAttendancesInquiry!) {
		getMyAttendances(input: $input) {
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
export const REQUEST_ATTENDANCE = gql`
	mutation RequestAttendance {
		requestAttendance {
			_id
			memberId
			attendanceDate
			attendanceStatus
			reviewedAt
			createdAt
			updatedAt
		}
	}
`;
