import { dev } from '$app/environment';
import { seedDemoData } from '$lib/server/seed';
import { fail, ok } from '$lib/server/http';

/**
 * Demo data loader — HANYA tersedia di development, atau saat ALLOW_SEED=1.
 * Idempotent: tidak menambah data bila tabel clients sudah terisi.
 */
export function GET({ url }: { url: URL }) {
	if (!dev && process.env.ALLOW_SEED !== '1') {
		return fail(new Error('Seeding is disabled outside development'));
	}
	try {
		const force = url.searchParams.get('reset') === '1';
		return ok(seedDemoData(force));
	} catch (err) {
		return fail(err);
	}
}
