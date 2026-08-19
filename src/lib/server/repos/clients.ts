import { randomUUID } from 'node:crypto';
import { AppError } from '$lib/domain/errors';
import type { Client, ClientInput, ClientStatus } from '$lib/domain/types';
import { db } from '../db';

interface ClientRow {
	id: string;
	name: string;
	email: string;
	phone: string;
	company: string;
	status: ClientStatus;
	created_at: string;
	updated_at: string;
}

function rowToClient(row: ClientRow): Client {
	return {
		id: row.id,
		name: row.name,
		email: row.email,
		phone: row.phone,
		company: row.company,
		status: row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	};
}

export function listClients(): Client[] {
	return (
		db.prepare('SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC').all() as ClientRow[]
	).map(rowToClient);
}

export function getClient(id: string): Client | null {
	const row = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as ClientRow | undefined;
	return row ? rowToClient(row) : null;
}

export function createClient(input: ClientInput): Client {
	const id = randomUUID();
	const now = new Date().toISOString();
	// Default defensif — lapisan API sudah menjamin via schema zod
	const phone = input.phone ?? '';
	const company = input.company ?? '';
	const status: ClientStatus = input.status ?? 'active';
	db.prepare(
		`INSERT INTO clients (id, name, email, phone, company, status, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	).run(id, input.name, input.email, phone, company, status, now, now);
	return { id, ...input, phone, company, status, createdAt: now, updatedAt: now };
}

/** Whitelist kolom yang boleh di-update — cegah SQL injection via key. */
const CLIENT_COLUMNS = ['name', 'email', 'phone', 'company', 'status'] as const;

export function updateClient(id: string, patch: Partial<ClientInput>): Client {
	const sets: string[] = [];
	const values: unknown[] = [];
	for (const key of CLIENT_COLUMNS) {
		const value = patch[key];
		if (value !== undefined) {
			sets.push(`${key} = ?`);
			values.push(value);
		}
	}
	if (sets.length === 0) {
		throw new AppError('VALIDATION_ERROR', 'No fields to update', 422);
	}
	values.push(new Date().toISOString(), id);
	const result = db
		.prepare(`UPDATE clients SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`)
		.run(...values);
	if (result.changes === 0) {
		throw new AppError('NOT_FOUND', 'Client not found', 404);
	}
	return getClient(id) as Client;
}

export function deleteClient(id: string): void {
	const { n } = db.prepare('SELECT COUNT(*) AS n FROM orders WHERE client_id = ?').get(id) as {
		n: number;
	};
	if (n > 0) {
		throw new AppError(
			'CLIENT_HAS_ORDERS',
			`Cannot delete: ${n} order${n === 1 ? '' : 's'} still reference this client`,
			409,
			{ orderCount: n }
		);
	}
	const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
	if (result.changes === 0) {
		throw new AppError('NOT_FOUND', 'Client not found', 404);
	}
}
