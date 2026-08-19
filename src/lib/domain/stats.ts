import { ORDER_STATUSES, ORDER_STATUS_META } from './order-status';
import type { Client, Order, OrderStatus } from './types';

export function safePercent(part: number, total: number): number {
	if (total <= 0) return 0;
	return Math.round((part / total) * 100);
}

export function sumAmountCents(orders: Order[]): number {
	return orders.reduce((sum, o) => sum + o.amountCents, 0);
}

export interface StatusSlice {
	status: OrderStatus;
	count: number;
	percent: number;
	color: string;
}

/** Distribusi status order (hanya status dengan count > 0), disortir sesuai ORDER_STATUSES. */
export function statusDistribution(orders: Order[]): StatusSlice[] {
	return ORDER_STATUSES.map((status) => {
		const count = orders.filter((o) => o.status === status).length;
		return {
			status,
			count,
			percent: safePercent(count, orders.length),
			color: ORDER_STATUS_META[status].chartColor
		};
	}).filter((s) => s.count > 0);
}

export interface ClientPerformance {
	client: Client;
	orderCount: number;
	revenueCents: number;
}

/** Performa klien dihitung dari data order nyata (bukan field tersimpan). */
export function topClientsByOrders(
	clients: Client[],
	orders: Order[],
	limit = 5
): ClientPerformance[] {
	const byClient = new Map<string, { orderCount: number; revenueCents: number }>();
	for (const order of orders) {
		const entry = byClient.get(order.clientId) ?? { orderCount: 0, revenueCents: 0 };
		entry.orderCount += 1;
		entry.revenueCents += order.amountCents;
		byClient.set(order.clientId, entry);
	}
	return clients
		.map((client) => {
			const stats = byClient.get(client.id) ?? { orderCount: 0, revenueCents: 0 };
			return { client, ...stats };
		})
		.sort((a, b) => b.orderCount - a.orderCount || b.revenueCents - a.revenueCents)
		.slice(0, limit);
}

export function recentOrders(orders: Order[], limit = 5): Order[] {
	return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function clientOrders(orders: Order[], clientId: string): Order[] {
	return orders.filter((o) => o.clientId === clientId);
}

export interface Kpis {
	totalClients: number;
	activeClients: number;
	vipClients: number;
	inactiveClients: number;
	totalOrders: number;
	pendingOrders: number;
	totalRevenueCents: number;
	avgOrderValueCents: number;
	deliveredOrders: number;
	cancelledOrders: number;
}

export function kpis(clients: Client[], orders: Order[]): Kpis {
	const totalRevenueCents = sumAmountCents(orders);
	return {
		totalClients: clients.length,
		activeClients: clients.filter((c) => c.status === 'active').length,
		vipClients: clients.filter((c) => c.status === 'vip').length,
		inactiveClients: clients.filter((c) => c.status === 'inactive').length,
		totalOrders: orders.length,
		pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
		totalRevenueCents,
		avgOrderValueCents: orders.length > 0 ? Math.round(totalRevenueCents / orders.length) : 0,
		deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
		cancelledOrders: orders.filter((o) => o.status === 'cancelled').length
	};
}

export type RevenuePeriod = '30d' | '90d' | '12m' | 'all';

export interface RevenuePoint {
	/** 'YYYY-MM' */
	monthKey: string;
	label: string;
	revenueCents: number;
	orderCount: number;
}

function monthKeyOf(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(monthKey: string): string {
	const [year, month] = monthKey.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
		month: 'short',
		year: '2-digit'
	});
}

function addMonths(monthKey: string, delta: number): string {
	const [year, month] = monthKey.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1 + delta, 1));
	return monthKeyOf(date);
}

function monthRange(from: string, to: string): string[] {
	const keys: string[] = [];
	let cursor = from;
	let guard = 0;
	while (cursor <= to && guard < 600) {
		keys.push(cursor);
		cursor = addMonths(cursor, 1);
		guard += 1;
	}
	return keys;
}

/**
 * Timeline revenue per bulan dari data nyata. Bulan tanpa order tetap muncul dengan nilai 0.
 * - '30d'/'90d': hanya bulan yang bersinggungan dengan window
 * - '12m': 12 bulan terakhir (termasuk bulan kosong)
 * - 'all': dari bulan order pertama sampai bulan order terakhir (atau bulan ini bila kosong)
 */
export function revenueTimeline(orders: Order[], period: RevenuePeriod): RevenuePoint[] {
	const byMonth = new Map<string, { revenueCents: number; orderCount: number }>();
	const today = new Date();
	const todayKey = monthKeyOf(today);

	const cutoff = (() => {
		switch (period) {
			case '30d':
				return new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 30)
				);
			case '90d':
				return new Date(
					Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 90)
				);
			case '12m':
				return new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), 1));
			case 'all':
				return null;
		}
	})();

	let minKey: string | null = null;
	let maxKey: string | null = null;

	for (const order of orders) {
		const date = new Date(`${order.orderDate}T00:00:00Z`);
		if (Number.isNaN(date.getTime())) continue;
		if (cutoff && date < cutoff) continue;
		const key = monthKeyOf(date);
		const entry = byMonth.get(key) ?? { revenueCents: 0, orderCount: 0 };
		entry.revenueCents += order.amountCents;
		entry.orderCount += 1;
		byMonth.set(key, entry);
		if (minKey === null || key < minKey) minKey = key;
		if (maxKey === null || key > maxKey) maxKey = key;
	}

	let keys: string[];
	if (period === '12m') {
		keys = monthRange(addMonths(todayKey, -11), todayKey);
	} else if (minKey === null) {
		keys = period === 'all' ? [todayKey] : [todayKey];
	} else {
		const from = period === 'all' ? minKey : cutoff ? monthKeyOf(cutoff) : minKey;
		keys = monthRange(from, maxKey ?? todayKey);
	}

	return keys.map((key) => {
		const entry = byMonth.get(key) ?? { revenueCents: 0, orderCount: 0 };
		return { monthKey: key, label: monthLabel(key), ...entry };
	});
}

export function growthRate(current: number, previous: number): number | null {
	if (previous === 0) return null;
	return Math.round(((current - previous) / previous) * 1000) / 10;
}

export interface GrowthMetrics {
	vipConversionPercent: number;
	completionRatePercent: number;
	avgRevenuePerClientCents: number;
	cancellationRatePercent: number;
}

export function growthMetrics(clients: Client[], orders: Order[]): GrowthMetrics {
	return {
		vipConversionPercent: safePercent(
			clients.filter((c) => c.status === 'vip').length,
			clients.length
		),
		completionRatePercent: safePercent(
			orders.filter((o) => o.status === 'delivered').length,
			orders.length
		),
		avgRevenuePerClientCents: clients.length > 0 ? sumAmountCents(orders) / clients.length : 0,
		cancellationRatePercent: safePercent(
			orders.filter((o) => o.status === 'cancelled').length,
			orders.length
		)
	};
}
