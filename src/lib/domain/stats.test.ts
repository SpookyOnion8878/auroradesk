import { describe, expect, it } from 'vitest';
import type { Client, Order } from './types';
import {
	growthMetrics,
	growthRate,
	kpis,
	revenueTimeline,
	statusDistribution,
	sumAmountCents,
	topClientsByOrders,
	clientOrders,
	safePercent
} from './stats';

function client(id: string, status: Client['status'] = 'active'): Client {
	return {
		id,
		name: `Client ${id}`,
		email: `${id}@example.com`,
		phone: '',
		company: '',
		status,
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z'
	};
}

function order(
	id: string,
	clientId: string,
	amount: number,
	status: Order['status'],
	date: string
): Order {
	return {
		id,
		orderId: `ORD-2026-${id}`,
		title: `Order ${id}`,
		clientId,
		clientName: null,
		amountCents: amount,
		status,
		orderDate: date,
		createdAt: `${date}T00:00:00.000Z`,
		updatedAt: `${date}T00:00:00.000Z`
	};
}

const alice = client('a', 'vip');
const bob = client('b', 'active');
const carol = client('c', 'inactive');

const orders: Order[] = [
	order('1', 'a', 100_00, 'delivered', '2026-01-05'),
	order('2', 'a', 200_00, 'delivered', '2026-02-05'),
	order('3', 'b', 50_00, 'pending', '2026-02-10'),
	order('4', 'b', 75_00, 'cancelled', '2026-03-01'),
	order('5', 'c', 300_00, 'processing', '2026-03-15')
];

describe('sumAmountCents', () => {
	it('sums all amounts', () => {
		expect(sumAmountCents(orders)).toBe(72500);
	});

	it('returns 0 for empty list', () => {
		expect(sumAmountCents([])).toBe(0);
	});
});

describe('safePercent', () => {
	it('computes rounded percent', () => {
		expect(safePercent(3, 4)).toBe(75);
	});

	it('avoids division by zero', () => {
		expect(safePercent(1, 0)).toBe(0);
	});
});

describe('kpis', () => {
	const k = kpis([alice, bob, carol], orders);

	it('counts clients by status', () => {
		expect(k.totalClients).toBe(3);
		expect(k.activeClients).toBe(1);
		expect(k.vipClients).toBe(1);
		expect(k.inactiveClients).toBe(1);
	});

	it('computes order and revenue totals', () => {
		expect(k.totalOrders).toBe(5);
		expect(k.pendingOrders).toBe(2);
		expect(k.deliveredOrders).toBe(2);
		expect(k.cancelledOrders).toBe(1);
		expect(k.totalRevenueCents).toBe(72500);
		expect(k.avgOrderValueCents).toBe(14500);
	});
});

describe('statusDistribution', () => {
	it('returns only non-zero slices sorted by canonical order', () => {
		const dist = statusDistribution(orders);
		expect(dist.map((d) => d.status)).toEqual(['pending', 'processing', 'delivered', 'cancelled']);
		expect(dist.find((d) => d.status === 'delivered')?.count).toBe(2);
		expect(dist.find((d) => d.status === 'pending')?.percent).toBe(20);
	});

	it('returns empty for no orders', () => {
		expect(statusDistribution([])).toEqual([]);
	});
});

describe('topClientsByOrders', () => {
	it('ranks clients by order count, then revenue', () => {
		const top = topClientsByOrders([alice, bob, carol], orders, 5);
		expect(top[0].client.id).toBe('a');
		expect(top[0].orderCount).toBe(2);
		expect(top[0].revenueCents).toBe(30000);
		expect(top[1].client.id).toBe('b');
	});

	it('respects the limit', () => {
		expect(topClientsByOrders([alice, bob, carol], orders, 2)).toHaveLength(2);
	});
});

describe('clientOrders', () => {
	it('filters orders by client', () => {
		expect(clientOrders(orders, 'a')).toHaveLength(2);
		expect(clientOrders(orders, 'zzz')).toEqual([]);
	});
});

describe('revenueTimeline', () => {
	it('aggregates revenue per month from real data', () => {
		const timeline = revenueTimeline(orders, 'all');
		const jan = timeline.find((p) => p.label.startsWith('Jan'));
		expect(jan?.revenueCents).toBe(10000);
		expect(jan?.orderCount).toBe(1);
		const feb = timeline.find((p) => p.label.startsWith('Feb'));
		expect(feb?.revenueCents).toBe(25000);
		expect(feb?.orderCount).toBe(2);
	});

	it('covers 12 months for the 12m period (empty months zeroed)', () => {
		const timeline = revenueTimeline(orders, '12m');
		expect(timeline).toHaveLength(12);
		expect(timeline.every((p) => p.revenueCents >= 0)).toBe(true);
	});

	it('returns at least one point for empty data', () => {
		const timeline = revenueTimeline([], 'all');
		expect(timeline.length).toBeGreaterThanOrEqual(1);
	});
});

describe('growthRate', () => {
	it('computes percentage growth', () => {
		expect(growthRate(120, 100)).toBe(20);
		expect(growthRate(90, 100)).toBe(-10);
	});

	it('returns null when previous is zero', () => {
		expect(growthRate(100, 0)).toBeNull();
	});
});

describe('growthMetrics', () => {
	const m = growthMetrics([alice, bob, carol], orders);

	it('computes rates and averages', () => {
		expect(m.vipConversionPercent).toBe(33);
		expect(m.completionRatePercent).toBe(40);
		expect(m.cancellationRatePercent).toBe(20);
		expect(m.avgRevenuePerClientCents).toBeCloseTo(24166.67);
	});
});
