import { idSchema, statusTransitionSchema } from '$lib/domain/schemas';
import { setOrderStatus } from '$lib/server/repos/orders';
import { fail, ok, readJson, validate } from '$lib/server/http';

export async function POST({ params, request }) {
	try {
		const id = validate(idSchema, params.id);
		const body = await readJson(request);
		const { status } = validate(statusTransitionSchema, body);
		return ok(setOrderStatus(id, status));
	} catch (err) {
		return fail(err);
	}
}
