import { clientCreateSchema } from '$lib/domain/schemas';
import { createClient, listClients } from '$lib/server/repos/clients';
import { fail, ok, readJson, validate } from '$lib/server/http';

export function GET() {
	return ok(listClients());
}

export async function POST({ request }) {
	try {
		const body = await readJson(request);
		const input = validate(clientCreateSchema, body);
		return ok(createClient(input), 201);
	} catch (err) {
		return fail(err);
	}
}
