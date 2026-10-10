import { error, json } from '@sveltejs/kit';
import { assertOwner } from '$lib/gate';
import { todoBody, dueDate } from '$lib/todos';
import type { Database } from '$lib/database.types';
import type { RequestHandler } from './$types';

type TodoUpdate = Database['public']['Tables']['todos']['Update'];

// Edit a todo's text and/or due date (owner-only).
export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	await assertOwner(locals);

	const body = (await request.json()) as Record<string, unknown>;
	const patch: TodoUpdate = {};

	if ('body' in body) patch.body = todoBody(body.body);
	if ('due_date' in body) patch.due_date = dueDate(body.due_date);

	if (Object.keys(patch).length === 0) throw error(400, 'No editable fields provided');

	const { data, error: dbError } = await locals.supabase
		.from('todos')
		.update(patch)
		.eq('id', params.id)
		.select()
		.maybeSingle();

	if (dbError) throw error(400, dbError.message);
	if (!data) throw error(404, 'Todo not found');

	return json(data);
};

// Check-off: completing a todo deletes its row.
export const DELETE: RequestHandler = async ({ locals, params }) => {
	await assertOwner(locals);

	const { data: existing } = await locals.supabase
		.from('todos')
		.select('id')
		.eq('id', params.id)
		.maybeSingle();
	if (!existing) throw error(404, 'Todo not found');

	const { error: dbError } = await locals.supabase.from('todos').delete().eq('id', params.id);
	if (dbError) throw error(400, dbError.message);

	return json({ ok: true });
};
