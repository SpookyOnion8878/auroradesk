import { clientUpdateSchema, idSchema } from '$lib/domain/schemas';
import { deleteClient, updateClient } from '$lib/server/repos/clients';
import { fail, noContent, ok, readJson, validate } from '$lib/server/http';

export async function PATCH({ params, request }) {
	try {
		const id = validate(idSchema, params.id);
		const body = await readJson(request);
		const patch = validate(clientUpdateSchema, body);
		return ok(updateClient(id, patch));
	} catch (err) {
		return fail(err);
	}
}

export async function DELETE({ params }) {
	try {
		const id = validate(idSchema, params.id);
		deleteClient(id);
		return noContent();
	} catch (err) {
		return fail(err);
	}
}
