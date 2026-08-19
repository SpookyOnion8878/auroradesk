export type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'NOT_FOUND'
	| 'ILLEGAL_STATUS_TRANSITION'
	| 'DUPLICATE_ORDER_ID'
	| 'CLIENT_HAS_ORDERS'
	| 'INTERNAL';

/** Error domain yang dibawa ke lapisan HTTP (server). Client memetakan lewat ApiError. */
export class AppError extends Error {
	constructor(
		public code: ErrorCode,
		message: string,
		public status: number,
		public details?: unknown
	) {
		super(message);
		this.name = 'AppError';
	}
}
