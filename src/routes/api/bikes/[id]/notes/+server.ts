import { error, json } from '@sveltejs/kit';
import { assertOwner } from '$lib/gate';
import type { RequestHandler } from './$types';

// Owner-only notes. Lives in bike_notes (not bikes) so RLS can hide it from the public.
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	await assertOwner(locals);

	const body = (await request.json()) as Record<string, unknown>;
	if (!('notes' in body)) throw error(400, 'No notes provided');
	if (body.notes !== null && typeof body.notes !== 'string') throw error(400, 'Invalid value');

	const notes = body.notes === null || body.notes === '' ? null : (body.notes as string);

	const { data: bike } = await locals.supabase
		.from('bikes')
		.select('id')
		.eq('id', params.id)
		.maybeSingle();
	if (!bike) throw error(404, 'Bike not found');

	const { data, error: dbError } = await locals.supabase
		.from('bike_notes')
		.upsert({ bike_id: params.id, notes })
		.select()
		.maybeSingle();

	if (dbError) throw error(400, dbError.message);
	if (!data) throw error(403, 'Not allowed');

	return json({ notes: data.notes });
};
