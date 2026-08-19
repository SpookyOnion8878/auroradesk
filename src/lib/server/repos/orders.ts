import { randomUUID } from 'node:crypto';
import { AppError } from '$lib/domain/errors';
import { canTransition } from '$lib/domain/order-status';
import { dollarsToCents } from '$lib/domain/money';
import { isValidIsoDate, todayIso } from '$lib/domain/dates';
import type { Order, OrderInput, OrderStatus, OrderStatusHistoryEntry } from '$lib/domain/types';
import { db } from '../db';

interface OrderRow {
	id: string;
	order_id: string;
	title: string;
	client_id: string;
	client_name: string | null;
	amount_cents: number;
	status: OrderStatus;
	order_date: string;
	created_at: string;
	updated_at: string;
}

interface HistoryRow {
	id: string;
	order_id: string;
	status: OrderStatus;
	changed_at: string;
}

const ORDER_SELECT = `
  SELECT o.id, o.order_id, o.title, o.client_id, c.name AS client_name,
         o.amount_cents, o.status, o.order_date, o.created_at, o.updated_at
  FROM orders o
  LEFT JOIN clients c ON c.id = o.client_id`;

function rowToOrder(row: OrderRow): Order {
	return {
		id: row.id,
		orderId: row.order_id,
		title: row.title,
		clientId: row.client_id,
		clientName: row.client_name,
		amountCents: row.amount_cents,
		status: row.status,
		orderDate: row.order_date,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function listOrders(): Order[] {
	return (
		db.prepare(`${ORDER_SELECT} ORDER BY o.order_date DESC, o.created_at DESC`).all() as OrderRow[]
	).map(rowToOrder);
}

export function getOrder(id: string): Order | null {
	const row = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(id) as OrderRow | undefined;
	return row ? rowToOrder(row) : null;
}

/** Generate order_id business key: ORD-YYYY-NNN (sequential per tahun). */
function generateOrderId(): string {
	const year = new Date().getFullYear();
	const prefix = `ORD-${year}-`;
	const { n } = db
		.prepare(`SELECT COUNT(*) AS n FROM orders WHERE order_id LIKE ?`)
		.get(`${prefix}%`) as { n: number };
	for (let i = n + 1; i < n + 1001; i++) {
		const candidate = `${prefix}${String(i).padStart(3, '0')}`;
		const exists = db.prepare('SELECT 1 FROM orders WHERE order_id = ?').get(candidate);
		if (!exists) return candidate;
	}
	throw new AppError('INTERNAL', 'Could not generate a unique order ID', 500);
}

export function createOrder(input: OrderInput): Order {
	const clientExists = db.prepare('SELECT 1 FROM clients WHERE id = ?').get(input.clientId);
	if (!clientExists) {
		throw new AppError('NOT_FOUND', 'Client not found', 404);
	}

	let amountCents: number;
	try {
		amountCents = dollarsToCents(input.amount);
	} catch (e) {
		throw new AppError('VALIDATION_ERROR', e instanceof Error ? e.message : 'Invalid amount', 422);
	}

	const orderId = input.orderId?.trim() || generateOrderId();
	const status: OrderStatus = input.status ?? 'pending';
	const orderDate =
		input.orderDate && isValidIsoDate(input.orderDate) ? input.orderDate : todayIso();
	const now = new Date().toISOString();
	const id = randomUUID();
	const historyId = randomUUID();

	const tx = db.transaction(() => {
		db.prepare(
			`INSERT INTO orders (id, order_id, title, client_id, amount_cents, status, order_date, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			id,
			orderId,
			input.title.trim(),
			input.clientId,
			amountCents,
			status,
			orderDate,
			now,
			now
		);
		db.prepare(
			`INSERT INTO order_status_history (id, order_id, status, changed_at) VALUES (?, ?, ?, ?)`
		).run(historyId, id, status, now);
	});

	try {
		tx();
	} catch (e) {
		if (isUniqueConstraint(e)) {
			throw new AppError('DUPLICATE_ORDER_ID', `Order ID "${orderId}" already exists`, 409);
		}
		throw e;
	}

	return getOrder(id) as Order;
}

export function updateOrder(id: string, patch: Partial<OrderInput>): Order {
	if (!getOrder(id)) {
		throw new AppError('NOT_FOUND', 'Order not found', 404);
	}

	if (patch.clientId !== undefined) {
		const clientExists = db.prepare('SELECT 1 FROM clients WHERE id = ?').get(patch.clientId);
		if (!clientExists) throw new AppError('NOT_FOUND', 'Client not found', 404);
	}

	const sets: string[] = [];
	const values: unknown[] = [];

	if (patch.orderId !== undefined) {
		const orderId = patch.orderId.trim();
		if (!orderId) throw new AppError('VALIDATION_ERROR', 'Order ID cannot be empty', 422);
		sets.push('order_id = ?');
		values.push(orderId);
	}
	if (patch.title !== undefined) {
		sets.push('title = ?');
		values.push(patch.title.trim());
	}
	if (patch.clientId !== undefined) {
		sets.push('client_id = ?');
		values.push(patch.clientId);
	}
	if (patch.amount !== undefined) {
		try {
			sets.push('amount_cents = ?');
			values.push(dollarsToCents(patch.amount));
		} catch (e) {
			throw new AppError(
				'VALIDATION_ERROR',
				e instanceof Error ? e.message : 'Invalid amount',
				422
			);
		}
	}
	if (patch.orderDate !== undefined) {
		if (!isValidIsoDate(patch.orderDate)) {
			throw new AppError('VALIDATION_ERROR', 'Invalid date (expected YYYY-MM-DD)', 422);
		}
		sets.push('order_date = ?');
		values.push(patch.orderDate);
	}

	if (sets.length === 0) {
		throw new AppError('VALIDATION_ERROR', 'No fields to update', 422);
	}

	values.push(new Date().toISOString(), id);
	let result;
	try {
		result = db
			.prepare(`UPDATE orders SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`)
			.run(...values);
	} catch (e) {
		if (isUniqueConstraint(e)) {
			throw new AppError('DUPLICATE_ORDER_ID', 'Order ID already exists', 409);
		}
		throw e;
	}
	if (result.changes === 0) {
		throw new AppError('NOT_FOUND', 'Order not found', 404);
	}
	return getOrder(id) as Order;
}

export function deleteOrder(id: string): void {
	const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
	if (result.changes === 0) {
		throw new AppError('NOT_FOUND', 'Order not found', 404);
	}
}

export function listOrderHistory(orderId: string): OrderStatusHistoryEntry[] {
	return (
		db
			.prepare(
				'SELECT id, order_id, status, changed_at FROM order_status_history WHERE order_id = ? ORDER BY changed_at ASC'
			)
			.all(orderId) as HistoryRow[]
	).map((row) => ({
		id: row.id,
		orderId: row.order_id,
		status: row.status,
		changedAt: row.changed_at
	}));
}

/**
 * Transisi status — satu-satunya jalur legal untuk mengubah status order.
 * Validasi state machine + tulis history dalam satu transaksi.
 */
export function setOrderStatus(
	id: string,
	status: OrderStatus
): { order: Order; history: OrderStatusHistoryEntry[] } {
	const current = getOrder(id);
	if (!current) {
		throw new AppError('NOT_FOUND', 'Order not found', 404);
	}
	if (!canTransition(current.status, status)) {
		throw new AppError(
			'ILLEGAL_STATUS_TRANSITION',
			`Cannot move order from "${current.status}" to "${status}"`,
			409,
			{ from: current.status, to: status }
		);
	}

	const now = new Date().toISOString();
	const historyId = randomUUID();
	const tx = db.transaction(() => {
		db.prepare(
			`INSERT INTO order_status_history (id, order_id, status, changed_at) VALUES (?, ?, ?, ?)`
		).run(historyId, id, status, now);
		db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, id);
	});
	tx();

	return { order: getOrder(id) as Order, history: listOrderHistory(id) };
}

function isUniqueConstraint(e: unknown): boolean {
	return (
		typeof e === 'object' &&
		e !== null &&
		'code' in e &&
		(typeof e.code === 'string' ? e.code.startsWith('SQLITE_CONSTRAINT') : false)
	);
}
