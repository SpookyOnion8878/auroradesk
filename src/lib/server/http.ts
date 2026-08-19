import type { z } from 'zod';
import { AppError } from '$lib/domain/errors';
import type { ErrorCode } from '$lib/domain/errors';

export function ok(data: unknown, status = 200): Response {
	return new Response(JSON.stringify({ data }), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

export function noContent(): Response {
	return new Response(null, { status: 204 });
}

export function fail(err: unknown): Response {
	if (err instanceof AppError) {
		return new Response(
			JSON.stringify({
				error: { code: err.code, message: err.message, details: err.details }
			}),
			{ status: err.status, headers: { 'content-type': 'application/json' } }
		);
	}
	if (err instanceof Error && 'status' in err && typeof err.status === 'number') {
		const status = err.status;
		const code = (err as Error & { code?: string }).code ?? 'INTERNAL';
		return new Response(JSON.stringify({ error: { code, message: err.message } }), {
			status,
			headers: { 'content-type': 'application/json' }
		});
	}
	return new Response(JSON.stringify({ error: { code: 'INTERNAL', message: 'Internal error' } }), {
		status: 500,
		headers: { 'content-type': 'application/json' }
	});
}

/**
 * Validasi input dengan schema zod; melempar AppError VALIDATION_ERROR bila gagal.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new AppError(
			'VALIDATION_ERROR' as ErrorCode,
			'Invalid input',
			400,
			result.error.issues.map((i) => ({
				path: i.path.join('.'),
				message: i.message
			}))
		);
	}
	return result.data;
}

export async function readJson(request: Request): Promise<unknown> {
	const text = await request.text();
	if (!text) {
		throw new AppError('VALIDATION_ERROR' as ErrorCode, 'Request body is required', 400);
	}
	try {
		return JSON.parse(text);
	} catch {
		throw new AppError('VALIDATION_ERROR' as ErrorCode, 'Request body must be valid JSON', 400);
	}
}
