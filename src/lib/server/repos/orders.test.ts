import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createClient } from './clients';
import {
	createOrder,
	deleteOrder,
	getOrder,
	listOrderHistory,
	setOrderStatus,
	updateOrder
} from './orders';
import { db, closeDb } from '../db';

beforeEach(() => {
	// Isolasi tiap test (DB :memory: dibagi antar test dalam file yang sama)
	db.exec('DELETE FROM order_status_history; DELETE FROM orders; DELETE FROM clients;');
});

afterAll(() => {
	closeDb();
});

function makeClient() {
	return createClient({ name: 'Bob Martinez', email: 'bob@globex.com' });
}

describe('orders repo', () => {
	it('creates an order with generated business ID and history entry', () => {
		const client = makeClient();
		const order = createOrder({ title: 'License', clientId: client.id, amount: 250 });
		expect(order.orderId).toMatch(/^ORD-\d{4}-\d{3}$/);
		expect(order.amountCents).toBe(25000);
		expect(order.status).toBe('pending');
		expect(order.clientName).toBe('Bob Martinez');
		expect(listOrderHistory(order.id)).toHaveLength(1);
		expect(listOrderHistory(order.id)[0].status).toBe('pending');
	});

	it('accepts explicit order id and dedupes per order', () => {
		const client = makeClient();
		createOrder({ title: 'A', clientId: client.id, amount: 10, orderId: 'INV-001' });
		expect(() =>
			createOrder({ title: 'B', clientId: client.id, amount: 20, orderId: 'INV-001' })
		).toThrowError(expect.objectContaining({ code: 'DUPLICATE_ORDER_ID' }));
	});

	it('rejects orders for missing clients', () => {
		expect(() =>
			createOrder({ title: 'X', clientId: '00000000-0000-4000-8000-000000000000', amount: 10 })
		).toThrowError(expect.objectContaining({ code: 'NOT_FOUND' }));
	});

	it('rejects invalid amounts', () => {
		const client = makeClient();
		expect(() => createOrder({ title: 'X', clientId: client.id, amount: 10.999 })).toThrowError(
			expect.objectContaining({ code: 'VALIDATION_ERROR' })
		);
	});

	it('updates fields but never status', () => {
		const client = makeClient();
		const order = createOrder({ title: 'Old', clientId: client.id, amount: 100 });
		const updated = updateOrder(order.id, { title: 'New', amount: 150 });
		expect(updated.title).toBe('New');
		expect(updated.amountCents).toBe(15000);
		expect(updated.status).toBe('pending');
	});

	it('maps duplicate order id on update to 409', () => {
		const client = makeClient();
		const a = createOrder({ title: 'A', clientId: client.id, amount: 10, orderId: 'X-1' });
		createOrder({ title: 'B', clientId: client.id, amount: 10, orderId: 'X-2' });
		expect(() => updateOrder(a.id, { orderId: 'X-2' })).toThrowError(
			expect.objectContaining({ code: 'DUPLICATE_ORDER_ID' })
		);
	});

	it('walks the full happy-path status flow with history', () => {
		const client = makeClient();
		const order = createOrder({ title: 'Flow', clientId: client.id, amount: 500 });

		for (const next of ['confirmed', 'processing', 'shipped', 'delivered'] as const) {
			const { order: updated } = setOrderStatus(order.id, next);
			expect(updated.status).toBe(next);
		}

		const history = listOrderHistory(order.id);
		expect(history.map((h) => h.status)).toEqual([
			'pending',
			'confirmed',
			'processing',
			'shipped',
			'delivered'
		]);
	});

	it('rejects illegal transitions', () => {
		const client = makeClient();
		const order = createOrder({ title: 'Skip', clientId: client.id, amount: 50 });
		expect(() => setOrderStatus(order.id, 'delivered')).toThrowError(
			expect.objectContaining({ code: 'ILLEGAL_STATUS_TRANSITION' })
		);
		expect(() => setOrderStatus(order.id, 'pending')).toThrowError(
			expect.objectContaining({ code: 'ILLEGAL_STATUS_TRANSITION' })
		);
	});

	it('allows cancellation then blocks further moves', () => {
		const client = makeClient();
		const order = createOrder({
			title: 'Cancel',
			clientId: client.id,
			amount: 30,
			status: 'confirmed'
		});
		const { order: cancelled } = setOrderStatus(order.id, 'cancelled');
		expect(cancelled.status).toBe('cancelled');
		expect(() => setOrderStatus(order.id, 'delivered')).toThrowError(
			expect.objectContaining({ code: 'ILLEGAL_STATUS_TRANSITION' })
		);
	});

	it('deletes orders and cascades history', () => {
		const client = makeClient();
		const order = createOrder({ title: 'Doomed', clientId: client.id, amount: 10 });
		setOrderStatus(order.id, 'confirmed');
		expect(listOrderHistory(order.id).length).toBeGreaterThanOrEqual(2);

		deleteOrder(order.id);
		expect(getOrder(order.id)).toBeNull();
		expect(listOrderHistory(order.id)).toEqual([]);
	});

	it('throws NOT_FOUND for missing orders', () => {
		expect(() => setOrderStatus('00000000-0000-4000-8000-000000000000', 'delivered')).toThrowError(
			expect.objectContaining({ code: 'NOT_FOUND' })
		);
		expect(() => deleteOrder('00000000-0000-4000-8000-000000000000')).toThrowError(
			expect.objectContaining({ code: 'NOT_FOUND' })
		);
	});
});
