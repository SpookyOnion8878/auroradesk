import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createClient, deleteClient, getClient, listClients, updateClient } from './clients';
import { createOrder, listOrders } from './orders';
import { db, closeDb } from '../db';

beforeEach(() => {
	// Isolasi tiap test (DB :memory: dibagi antar test dalam file yang sama)
	db.exec('DELETE FROM order_status_history; DELETE FROM orders; DELETE FROM clients;');
});

afterAll(() => {
	closeDb();
});

function baseClient() {
	return { name: 'Alice Johnson', email: 'alice@acme.com', phone: '+1-555-0101', company: 'Acme' };
}

describe('clients repo', () => {
	it('creates and reads a client', () => {
		const created = createClient({ ...baseClient(), status: 'vip' });
		expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
		expect(created.name).toBe('Alice Johnson');
		expect(created.status).toBe('vip');
		expect(created.createdAt).toBeTruthy();

		const fetched = getClient(created.id);
		expect(fetched?.company).toBe('Acme');
	});

	it('lists clients sorted by name (case-insensitive)', () => {
		createClient({ ...baseClient(), name: 'zeta corp' });
		createClient({ ...baseClient(), name: 'Alpha inc' });
		const names = listClients().map((c) => c.name);
		expect(names[0]).toBe('Alpha inc');
		expect(names[names.length - 1]).toBe('zeta corp');
	});

	it('updates a client', () => {
		const c = createClient({ ...baseClient(), name: 'To Rename' });
		const updated = updateClient(c.id, { name: 'Renamed', status: 'inactive' });
		expect(updated.name).toBe('Renamed');
		expect(updated.status).toBe('inactive');
	});

	it('rejects update with no fields', () => {
		const c = createClient(baseClient());
		expect(() => updateClient(c.id, {})).toThrowError(
			expect.objectContaining({ code: 'VALIDATION_ERROR' })
		);
	});

	it('throws NOT_FOUND for unknown ids', () => {
		expect(() => updateClient('00000000-0000-4000-8000-000000000000', { name: 'x' })).toThrowError(
			expect.objectContaining({ code: 'NOT_FOUND' })
		);
		expect(() => deleteClient('00000000-0000-4000-8000-000000000000')).toThrowError(
			expect.objectContaining({ code: 'NOT_FOUND' })
		);
	});

	it('deletes a client without orders', () => {
		const c = createClient({ ...baseClient(), name: 'Ghost' });
		deleteClient(c.id);
		expect(getClient(c.id)).toBeNull();
	});

	it('blocks deletion when client has orders', () => {
		const c = createClient({ ...baseClient(), name: 'Busy' });
		createOrder({ title: 'License', clientId: c.id, amount: 100, status: 'pending' });

		expect(() => deleteClient(c.id)).toThrowError(
			expect.objectContaining({ code: 'CLIENT_HAS_ORDERS' })
		);
		expect(getClient(c.id)).not.toBeNull();
		expect(listOrders()).toHaveLength(1);
	});

	it('enforces DB-level constraints too', () => {
		expect(() => createClient({ ...baseClient(), email: 'not-an-email' })).toThrowError(
			/constraint/i
		);
	});
});
