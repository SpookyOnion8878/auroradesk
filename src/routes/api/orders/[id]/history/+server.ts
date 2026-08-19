import { idSchema } from '$lib/domain/schemas';
import { listOrderHistory } from '$lib/server/repos/orders';
import { fail, ok, validate } from '$lib/server/http';

export function GET({ params }) {
	try {
		const id = validate(idSchema, params.id);
		return ok(listOrderHistory(id));
	} catch (err) {
		return fail(err);
	}
}
