import { describe, expect, it } from 'vitest';
import {
	ORDER_STATUS_FLOW,
	ORDER_STATUS_META,
	canTransition,
	nextStatuses,
	isTerminal
} from './order-status';

describe('order status state machine', () => {
	it('allows forward progression', () => {
		expect(canTransition('pending', 'confirmed')).toBe(true);
		expect(canTransition('confirmed', 'processing')).toBe(true);
		expect(canTransition('processing', 'shipped')).toBe(true);
		expect(canTransition('shipped', 'delivered')).toBe(true);
	});

	it('allows cancellation from all non-terminal states', () => {
		expect(canTransition('pending', 'cancelled')).toBe(true);
		expect(canTransition('confirmed', 'cancelled')).toBe(true);
		expect(canTransition('processing', 'cancelled')).toBe(true);
		expect(canTransition('shipped', 'cancelled')).toBe(true);
	});

	it('forbids skips and backwards moves', () => {
		expect(canTransition('pending', 'delivered')).toBe(false);
		expect(canTransition('confirmed', 'pending')).toBe(false);
		expect(canTransition('processing', 'pending')).toBe(false);
	});

	it('treats delivered and cancelled as terminal', () => {
		expect(isTerminal('delivered')).toBe(true);
		expect(isTerminal('cancelled')).toBe(true);
		expect(isTerminal('pending')).toBe(false);
		expect(nextStatuses('delivered')).toEqual([]);
		expect(nextStatuses('cancelled')).toEqual([]);
	});

	it('covers every status with metadata', () => {
		for (const status of Object.keys(ORDER_STATUS_FLOW) as (keyof typeof ORDER_STATUS_FLOW)[]) {
			expect(ORDER_STATUS_META[status].label.length).toBeGreaterThan(0);
			expect(ORDER_STATUS_META[status].dot).toMatch(/^#/);
		}
	});
});
