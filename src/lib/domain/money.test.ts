import { describe, expect, it } from 'vitest';
import {
	centsToDollars,
	dollarsToCents,
	formatCurrency,
	formatCurrencyCompact,
	formatNumber
} from './money';

describe('dollarsToCents', () => {
	it('converts whole dollars', () => {
		expect(dollarsToCents(100)).toBe(10000);
	});

	it('converts decimals to integer cents', () => {
		expect(dollarsToCents(99.99)).toBe(9999);
		expect(dollarsToCents(0.01)).toBe(1);
	});

	it('rounds floating point noise', () => {
		expect(dollarsToCents(19.9)).toBe(1990);
		expect(dollarsToCents(0.1 + 0.2)).toBe(30);
	});

	it('rejects NaN and Infinity', () => {
		expect(() => dollarsToCents(NaN)).toThrow(RangeError);
		expect(() => dollarsToCents(Infinity)).toThrow(RangeError);
	});

	it('rejects more than 2 decimal places', () => {
		expect(() => dollarsToCents(10.999)).toThrow(RangeError);
	});

	it('rejects zero, negative and absurd amounts', () => {
		expect(() => dollarsToCents(0)).toThrow(RangeError);
		expect(() => dollarsToCents(-5)).toThrow(RangeError);
		expect(() => dollarsToCents(2_000_000_000)).toThrow(RangeError);
	});
});

describe('centsToDollars', () => {
	it('converts back to dollars', () => {
		expect(centsToDollars(12345)).toBe(123.45);
	});
});

describe('formatCurrency', () => {
	it('formats USD', () => {
		expect(formatCurrency(12345)).toBe('$123.45');
		expect(formatCurrency(0)).toBe('$0.00');
	});

	it('formats compact notation', () => {
		expect(formatCurrencyCompact(1_250_000)).toBe('$12.5K');
	});
});

describe('formatNumber', () => {
	it('groups thousands', () => {
		expect(formatNumber(1234567)).toBe('1,234,567');
	});
});
