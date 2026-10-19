import { CommentGroup } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';

export interface CommentInput {
	commentGroup: CommentGroup;
	commentContent: string;
	commentRefId: string;
}

interface CISearch {
	commentRefId: string;
	commentGroup: CommentGroup;
}

export interface CommentsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: CISearch;
}
