const MAX_AMOUNT_CENTS = 100_000_000_000;

/**
 * Konversi dollars (number) → integer cents.
 * Menolak NaN/Infinity dan nilai dengan > 2 desimal (mencegah kehilangan presisi).
 */
export function dollarsToCents(dollars: number): number {
	if (!Number.isFinite(dollars)) {
		throw new RangeError('Amount must be a finite number');
	}
	const cents = Math.round(dollars * 100);
	if (Math.abs(dollars * 100 - cents) > 1e-6) {
		throw new RangeError('Amount supports at most 2 decimal places');
	}
	if (!Number.isInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) {
		throw new RangeError('Amount out of range');
	}
	return cents;
}

export function centsToDollars(cents: number): number {
	return cents / 100;
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdCompact = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	notation: 'compact',
	maximumFractionDigits: 1
});

export function formatCurrency(cents: number): string {
	return usd.format(centsToDollars(cents));
}

export function formatCurrencyCompact(cents: number): string {
	return usdCompact.format(centsToDollars(cents));
}

export function formatNumber(n: number): string {
	return new Intl.NumberFormat('en-US').format(n);
}
