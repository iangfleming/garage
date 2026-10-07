import { error, json } from '@sveltejs/kit';
import { assertOwner } from '$lib/gate';
import type { RequestHandler } from './$types';

// Create a blank draft bike. The owner is then taken to /[id] to fill it in inline.
export const POST: RequestHandler = async ({ locals }) => {
	await assertOwner(locals);

	const { data, error: dbError } = await locals.supabase
		.from('bikes')
		.insert({})
		.select('id')
		.maybeSingle();

	if (dbError) throw error(400, dbError.message);
	if (!data) throw error(403, 'Not allowed');

	return json({ id: data.id });
};
