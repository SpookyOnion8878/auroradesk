import { orderCreateSchema } from '$lib/domain/schemas';
import { createOrder, listOrders } from '$lib/server/repos/orders';
import { fail, ok, readJson, validate } from '$lib/server/http';

export function GET() {
	return ok(listOrders());
}

export async function POST({ request }) {
	try {
		const body = await readJson(request);
		const input = validate(orderCreateSchema, body);
		return ok(createOrder(input), 201);
	} catch (err) {
		return fail(err);
	}
}
