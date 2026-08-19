export type ClientStatus = 'active' | 'inactive' | 'vip';

export type OrderStatus =
	'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Client {
	id: string;
	name: string;
	email: string;
	phone: string;
	company: string;
	status: ClientStatus;
	createdAt: string;
	updatedAt: string;
}

export interface ClientInput {
	name: string;
	email: string;
	/** Opsional — repo default '' (sama seperti schema API). */
	phone?: string;
	/** Opsional — repo default '' (sama seperti schema API). */
	company?: string;
	/** Opsional — repo default 'active' (sama seperti schema API). */
	status?: ClientStatus;
}

export interface Order {
	id: string;
	orderId: string;
	title: string;
	clientId: string;
	/** Denormalisasi untuk tampilan (LEFT JOIN). Null bila klien tidak ditemukan. */
	clientName: string | null;
	/** Nilai canonical dalam integer cents — tidak pernah float. */
	amountCents: number;
	status: OrderStatus;
	/** ISO date 'YYYY-MM-DD'. */
	orderDate: string;
	createdAt: string;
	updatedAt: string;
}

export interface OrderInput {
	/** Opsional — server generate bila kosong. */
	orderId?: string;
	title: string;
	clientId: string;
	/** Dollars (number, maks 2 desimal) — dikonversi ke cents di domain. */
	amount: number;
	status?: OrderStatus;
	orderDate?: string;
}

export interface OrderStatusHistoryEntry {
	id: string;
	orderId: string;
	status: OrderStatus;
	changedAt: string;
}
