import { z } from 'zod';
import { CLIENT_STATUSES, ORDER_STATUSES } from './order-status';

const orderDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const clientCreateSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(200),
	email: z.string().trim().email('Invalid email address').max(254),
	phone: z.string().trim().max(50).default(''),
	company: z.string().trim().max(200).default(''),
	status: z.enum(CLIENT_STATUSES).default('active')
});

export const clientUpdateSchema = clientCreateSchema.partial();

export const orderCreateSchema = z.object({
	orderId: z.string().trim().min(1, 'Order ID is required').max(60).optional(),
	title: z.string().trim().min(1, 'Title is required').max(300),
	clientId: z.string().min(1, 'Client is required'),
	amount: z
		.number()
		.finite('Amount must be a number')
		.positive('Amount must be greater than 0')
		.max(1_000_000_000, 'Amount is too large'),
	status: z.enum(ORDER_STATUSES).default('pending'),
	orderDate: z.string().regex(orderDateRegex, 'Invalid date (expected YYYY-MM-DD)').optional()
});

/** Update order TIDAK boleh mengubah status — pakai endpoint status. */
export const orderUpdateSchema = orderCreateSchema.omit({ status: true }).partial();

export const statusTransitionSchema = z.object({
	status: z.enum(ORDER_STATUSES)
});

export const idSchema = z.uuid('Invalid id');
