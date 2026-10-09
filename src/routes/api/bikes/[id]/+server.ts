import { error, json } from '@sveltejs/kit';
import { assertOwner } from '$lib/gate';
import type { Database } from '$lib/database.types';
import type { RequestHandler } from './$types';

type BikeUpdate = Database['public']['Tables']['bikes']['Update'];

// Coerce an incoming text field to string | null ('' becomes null). Rejects non-strings.
function text(value: unknown): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string') throw error(400, 'Invalid value');
	return value === '' ? null : value;
}

function focus(value: unknown): number {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) {
		throw error(400, 'Invalid focus value');
	}
	return value;
}

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	await assertOwner(locals);

	const body = (await request.json()) as Record<string, unknown>;
	const patch: BikeUpdate = {};

	if ('maker' in body) patch.maker = text(body.maker);
	if ('model' in body) patch.model = text(body.model);
	if ('description' in body) patch.description = text(body.description);
	if ('notes' in body) patch.notes = text(body.notes);
	if ('year' in body) {
		const raw = body.year;
		if (raw === null || raw === undefined || raw === '') {
			patch.year = null;
		} else {
			const n = Number(raw);
			if (!Number.isInteger(n) || n < 1800 || n > 2100) throw error(400, 'Invalid year');
			patch.year = n;
		}
	}

	if ('focus_x' in body) patch.focus_x = focus(body.focus_x);
	if ('focus_y' in body) patch.focus_y = focus(body.focus_y);

	if (Object.keys(patch).length === 0) throw error(400, 'No editable fields provided');

	const { data, error: dbError } = await locals.supabase
		.from('bikes')
		.update(patch)
		.eq('id', params.id)
		.select()
		.maybeSingle();

	if (dbError) throw error(400, dbError.message);
	if (!data) throw error(404, 'Bike not found');

	return json(data);
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	await assertOwner(locals);

	const { data: existing } = await locals.supabase
		.from('bikes')
		.select('image_path')
		.eq('id', params.id)
		.maybeSingle();
	if (!existing) throw error(404, 'Bike not found');

	const { error: dbError } = await locals.supabase.from('bikes').delete().eq('id', params.id);
	if (dbError) throw error(400, dbError.message);

	// Best-effort cleanup of the stored image object.
	if (existing.image_path) {
		await locals.supabase.storage.from('bike-images').remove([existing.image_path]);
	}

	return json({ ok: true });
};
