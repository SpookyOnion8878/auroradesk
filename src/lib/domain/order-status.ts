import type { ClientStatus, OrderStatus } from './types';

export const ORDER_STATUSES: readonly OrderStatus[] = [
	'pending',
	'confirmed',
	'processing',
	'shipped',
	'delivered',
	'cancelled'
];

export const CLIENT_STATUSES: readonly ClientStatus[] = ['active', 'inactive', 'vip'];

/** State machine — satu-satunya sumber kebenaran transisi status order. */
export const ORDER_STATUS_FLOW: Record<OrderStatus, { next: readonly OrderStatus[] }> = {
	pending: { next: ['confirmed', 'cancelled'] },
	confirmed: { next: ['processing', 'cancelled'] },
	processing: { next: ['shipped', 'cancelled'] },
	shipped: { next: ['delivered', 'cancelled'] },
	delivered: { next: [] },
	cancelled: { next: [] }
};

export const ORDER_STATUS_META: Record<
	OrderStatus,
	{ label: string; badge: string; dot: string; chartColor: string }
> = {
	pending: {
		label: 'Pending',
		badge: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
		dot: '#f59e0b',
		chartColor: '#f59e0b'
	},
	confirmed: {
		label: 'Confirmed',
		badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500',
		dot: '#06b6d4',
		chartColor: '#06b6d4'
	},
	processing: {
		label: 'Processing',
		badge: 'border-blue-500/30 bg-blue-500/10 text-blue-500',
		dot: '#3b82f6',
		chartColor: '#3b82f6'
	},
	shipped: {
		label: 'Shipped',
		badge: 'border-purple-500/30 bg-purple-500/10 text-purple-500',
		dot: '#a855f7',
		chartColor: '#a855f7'
	},
	delivered: {
		label: 'Delivered',
		badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
		dot: '#10b981',
		chartColor: '#10b981'
	},
	cancelled: {
		label: 'Cancelled',
		badge: 'border-rose-500/30 bg-rose-500/10 text-rose-500',
		dot: '#f43f5e',
		chartColor: '#f43f5e'
	}
};

export const CLIENT_STATUS_META: Record<
	ClientStatus,
	{ label: string; badge: string; dot: string }
> = {
	active: {
		label: 'Active',
		badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
		dot: '#10b981'
	},
	inactive: {
		label: 'Inactive',
		badge: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
		dot: '#6b7280'
	},
	vip: {
		label: 'VIP',
		badge: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
		dot: '#f59e0b'
	}
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return ORDER_STATUS_FLOW[from].next.includes(to);
}

export function nextStatuses(from: OrderStatus): readonly OrderStatus[] {
	return ORDER_STATUS_FLOW[from].next;
}

export function isTerminal(status: OrderStatus): boolean {
	return ORDER_STATUS_FLOW[status].next.length === 0;
}
