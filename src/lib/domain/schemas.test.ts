import { describe, expect, it } from 'vitest';
import {
	clientCreateSchema,
	clientUpdateSchema,
	idSchema,
	orderCreateSchema,
	orderUpdateSchema,
	statusTransitionSchema
} from './schemas';

describe('clientCreateSchema', () => {
	it('accepts a minimal valid client', () => {
		const parsed = clientCreateSchema.safeParse({ name: 'John Doe', email: 'john@example.com' });
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.status).toBe('active');
			expect(parsed.data.phone).toBe('');
		}
	});

	it('rejects missing name and invalid email', () => {
		expect(clientCreateSchema.safeParse({ email: 'nope' }).success).toBe(false);
		expect(clientCreateSchema.safeParse({ name: '', email: 'a@b.com' }).success).toBe(false);
		expect(clientCreateSchema.safeParse({ name: 'x', email: 'not-an-email' }).success).toBe(false);
	});

	it('rejects unknown client status', () => {
		expect(
			clientCreateSchema.safeParse({
				name: 'x',
				email: 'a@b.com',
				status: 'gold'
			}).success
		).toBe(false);
	});
});

describe('clientUpdateSchema', () => {
	it('allows partial updates', () => {
		expect(clientUpdateSchema.safeParse({ name: 'New Name' }).success).toBe(true);
		expect(clientUpdateSchema.safeParse({}).success).toBe(true);
	});
});

describe('orderCreateSchema', () => {
	it('accepts a valid order and defaults status/date', () => {
		const parsed = orderCreateSchema.safeParse({
			title: 'License',
			clientId: 'uuid',
			amount: 99.99
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.status).toBe('pending');
		}
	});

	it('rejects invalid amount types and values', () => {
		expect(orderCreateSchema.safeParse({ title: 'x', clientId: 'u', amount: '100' }).success).toBe(
			false
		);
		expect(orderCreateSchema.safeParse({ title: 'x', clientId: 'u', amount: 0 }).success).toBe(
			false
		);
		expect(orderCreateSchema.safeParse({ title: 'x', clientId: 'u', amount: NaN }).success).toBe(
			false
		);
		expect(
			orderCreateSchema.safeParse({ title: 'x', clientId: 'u', amount: 100, status: 'bogus' })
				.success
		).toBe(false);
	});

	it('rejects malformed order dates', () => {
		expect(
			orderCreateSchema.safeParse({
				title: 'x',
				clientId: 'u',
				amount: 10,
				orderDate: '2026/01/01'
			}).success
		).toBe(false);
	});
});

describe('orderUpdateSchema', () => {
	it('excludes status from updates', () => {
		const parsed = orderUpdateSchema.safeParse({ status: 'delivered' });
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect('status' in parsed.data).toBe(false);
		}
	});
});

describe('statusTransitionSchema', () => {
	it('requires a known status', () => {
		expect(statusTransitionSchema.safeParse({ status: 'processing' }).success).toBe(true);
		expect(statusTransitionSchema.safeParse({ status: 'bogus' }).success).toBe(false);
	});
});

describe('idSchema', () => {
	it('requires a UUID', () => {
		expect(idSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
		expect(idSchema.safeParse('not-a-uuid').success).toBe(false);
	});
});
