import { createClient } from './repos/clients';
import { createOrder } from './repos/orders';
import { db } from './db';
import type { OrderStatus } from '$lib/domain/types';

/** Deterministic PRNG (mulberry32) — dataset reproducible across runs. */
function rng(seed: number) {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const CLIENTS = [
	{
		name: 'Alice Johnson',
		email: 'alice@acme.com',
		phone: '+1-555-0101',
		company: 'Acme Corp',
		status: 'vip'
	},
	{
		name: 'Bob Martinez',
		email: 'bob@globex.com',
		phone: '+1-555-0102',
		company: 'Globex',
		status: 'active'
	},
	{
		name: 'Carol Chen',
		email: 'carol@initech.com',
		phone: '+1-555-0103',
		company: 'Initech',
		status: 'active'
	},
	{
		name: 'David Kim',
		email: 'david@umbrella.com',
		phone: '+1-555-0104',
		company: 'Umbrella Corp',
		status: 'inactive'
	},
	{
		name: 'Eva Novak',
		email: 'eva@stark.com',
		phone: '+1-555-0105',
		company: 'Stark Industries',
		status: 'vip'
	},
	{
		name: 'Frank Osei',
		email: 'frank@wayne.com',
		phone: '+1-555-0106',
		company: 'Wayne Enterprises',
		status: 'active'
	},
	{
		name: 'Grace Lee',
		email: 'grace@hooli.com',
		phone: '+1-555-0107',
		company: 'Hooli',
		status: 'active'
	},
	{
		name: 'Hassan Ali',
		email: 'hassan@pied.com',
		phone: '+1-555-0108',
		company: 'Pied Piper',
		status: 'vip'
	},
	{
		name: 'Isabella Rossi',
		email: 'isabella@massimo.com',
		phone: '+1-555-0109',
		company: 'Massimo',
		status: 'active'
	},
	{
		name: 'Jamal Wright',
		email: 'jamal@verex.com',
		phone: '+1-555-0110',
		company: 'Verex Group',
		status: 'inactive'
	},
	{
		name: 'Kira Petrova',
		email: 'kira@aurora.com',
		phone: '+1-555-0111',
		company: 'Aurora Labs',
		status: 'active'
	},
	{
		name: 'Liam O’Brien',
		email: 'liam@finch.com',
		phone: '+1-555-0112',
		company: 'Finch & Co',
		status: 'vip'
	},
	{
		name: 'Mei Tan',
		email: 'mei@nimbus.com',
		phone: '+1-555-0113',
		company: 'Nimbus',
		status: 'active'
	},
	{
		name: 'Noah Bauer',
		email: 'noah@kessler.com',
		phone: '+1-555-0114',
		company: 'Kessler GmbH',
		status: 'active'
	}
] as const;

const TITLES = [
	'Premium Software License',
	'Annual Support Contract',
	'Hardware Installation',
	'Cloud Migration Service',
	'Training Package',
	'Consulting Retainer',
	'Data Backup Solution',
	'Network Setup',
	'Security Audit',
	'Workstation Refresh',
	'Custom Integration',
	'Managed Services'
];

const STATUS_POOL: OrderStatus[] = [
	'delivered',
	'delivered',
	'delivered',
	'delivered',
	'shipped',
	'shipped',
	'processing',
	'processing',
	'confirmed',
	'confirmed',
	'pending',
	'pending',
	'cancelled'
];

/**
 * Demo data — idempotent by default. Bila `force`, hapus dulu lalu isi ulang
 * (berguna untuk me-reset dataset demo). Dipanggil dari GET /api/dev/seed.
 */
export function seedDemoData(force = false): { clients: number; orders: number } {
	const rand = rng(20260601);

	if (force) {
		db.exec('DELETE FROM order_status_history; DELETE FROM orders; DELETE FROM clients;');
	} else {
		const { n } = db.prepare('SELECT COUNT(*) AS n FROM clients').get() as { n: number };
		if (n > 0) return { clients: 0, orders: 0 };
	}

	const created = CLIENTS.map((c) => createClient({ ...c }));

	const today = new Date();
	const iso = (daysAgo: number) => {
		const d = new Date(today);
		d.setDate(d.getDate() - daysAgo);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	};

	const ORDER_COUNT = 64;
	let made = 0;
	for (let i = 0; i < ORDER_COUNT; i++) {
		const client = created[Math.floor(rand() * created.length)];
		const title = TITLES[Math.floor(rand() * TITLES.length)];
		// Amount: skewed toward mid-range, occasional large enterprise deals.
		const base = 200 + Math.floor(rand() * 6000);
		const spike = rand() > 0.85 ? Math.floor(rand() * 4000) : 0;
		const amount = base + spike;
		const status = STATUS_POOL[Math.floor(rand() * STATUS_POOL.length)];
		// Spread across the last ~360 days, denser toward recent.
		const daysAgo = Math.floor(Math.pow(rand(), 1.25) * 360) + 1;
		createOrder({
			clientId: client.id,
			title,
			amount,
			status,
			orderDate: iso(daysAgo)
		});
		made++;
	}

	return { clients: created.length, orders: made };
}
