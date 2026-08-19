import { idSchema, orderUpdateSchema } from '$lib/domain/schemas';
import { deleteOrder, updateOrder } from '$lib/server/repos/orders';
import { fail, noContent, ok, readJson, validate } from '$lib/server/http';

export async function PATCH({ params, request }) {
	try {
		const id = validate(idSchema, params.id);
		const body = await readJson(request);
		const patch = validate(orderUpdateSchema, body);
		return ok(updateOrder(id, patch));
	} catch (err) {
		return fail(err);
	}
}

export async function DELETE({ params }) {
	try {
		const id = validate(idSchema, params.id);
		deleteOrder(id);
		return noContent();
	} catch (err) {
		return fail(err);
	}
}
