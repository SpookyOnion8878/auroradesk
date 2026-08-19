import type {
	Client,
	ClientInput,
	Order,
	OrderInput,
	OrderStatus,
	OrderStatusHistoryEntry
} from './domain/types';

export class ApiError extends Error {
	constructor(
		public code: string,
		message: string,
		public status: number,
		public details?: unknown
	) {
		super(message);
		this.name = 'ApiError';
	}
}

interface ApiErrorBody {
	error?: { code?: string; message?: string; details?: unknown };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	let res: Response;
	try {
		res = await fetch(`/api${path}`, {
			method,
			headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body)
		});
	} catch {
		throw new ApiError('NETWORK', 'Network error — please retry', 0);
	}

	if (res.status === 204) return undefined as T;

	const json = (await res.json().catch(() => null)) as (T & ApiErrorBody) | null;
	if (!res.ok) {
		const err = json as ApiErrorBody | null;
		throw new ApiError(
			err?.error?.code ?? 'INTERNAL',
			err?.error?.message ?? `Request failed (${res.status})`,
			res.status,
			err?.error?.details
		);
	}
	if (json === null || typeof json !== 'object' || !('data' in json)) {
		throw new ApiError('INTERNAL', 'Malformed response from server', res.status);
	}
	return (json as { data: T }).data;
}

export const api = {
	clients: {
		list: () => request<Client[]>('GET', '/clients'),
		create: (input: ClientInput) => request<Client>('POST', '/clients', input),
		update: (id: string, patch: Partial<ClientInput>) =>
			request<Client>('PATCH', `/clients/${id}`, patch),
		remove: (id: string) => request<void>('DELETE', `/clients/${id}`)
	},
	orders: {
		list: () => request<Order[]>('GET', '/orders'),
		create: (input: OrderInput) => request<Order>('POST', '/orders', input),
		update: (id: string, patch: Partial<OrderInput>) =>
			request<Order>('PATCH', `/orders/${id}`, patch),
		remove: (id: string) => request<void>('DELETE', `/orders/${id}`),
		setStatus: (id: string, status: OrderStatus) =>
			request<{ order: Order; history: OrderStatusHistoryEntry[] }>(
				'POST',
				`/orders/${id}/status`,
				{ status }
			),
		history: (id: string) => request<OrderStatusHistoryEntry[]>('GET', `/orders/${id}/history`)
	},
	dev: {
		seed: () => request<{ clients: number; orders: number }>('GET', '/dev/seed')
	}
};
