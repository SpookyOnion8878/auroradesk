import { api } from '$lib/api';
import type { Client, Order } from '$lib/domain/types';

/**
 * Satu-satunya state data aplikasi (runes module-level).
 * Dipakai object-property agar tetap reaktif & aman saat di-compile sebagai plain TS.
 */
export const store = $state({
	clients: [] as Client[],
	orders: [] as Order[],
	loading: true,
	loadError: null as string | null
});

/**
 * Muat ulang semua data. Menggunakan allSettled agar kegagalan satu resource
 * tidak membuang data resource lain (lihat PRD NFR-1 / bugfix #8).
 */
export async function refreshData(): Promise<void> {
	store.loading = true;
	const [clientsResult, ordersResult] = await Promise.allSettled([
		api.clients.list(),
		api.orders.list()
	]);

	if (clientsResult.status === 'fulfilled') {
		store.clients = clientsResult.value;
	}
	if (ordersResult.status === 'fulfilled') {
		store.orders = ordersResult.value;
	}

	const failed = [clientsResult, ordersResult].filter((r) => r.status === 'rejected').length;
	store.loadError =
		failed > 0 ? `Failed to load ${failed} of 2 data sources. Check the server and retry.` : null;
	store.loading = false;
}
