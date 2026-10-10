import { error, json } from '@sveltejs/kit';
import { assertOwner } from '$lib/gate';
import { todoBody, dueDate } from '$lib/todos';
import type { RequestHandler } from './$types';

// Create a todo for this bike (owner-only). due_date is optional.
export const POST: RequestHandler = async ({ locals, params, request }) => {
	await assertOwner(locals);

	const body = (await request.json()) as Record<string, unknown>;

	const { data: bike } = await locals.supabase
		.from('bikes')
		.select('id')
		.eq('id', params.id)
		.maybeSingle();
	if (!bike) throw error(404, 'Bike not found');

	const { data, error: dbError } = await locals.supabase
		.from('todos')
		.insert({ bike_id: params.id, body: todoBody(body.body), due_date: dueDate(body.due_date) })
		.select()
		.maybeSingle();

	if (dbError) throw error(400, dbError.message);
	if (!data) throw error(403, 'Not allowed');

	return json(data);
};
