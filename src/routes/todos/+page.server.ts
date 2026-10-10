import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Owner-only view of every todo across all bikes. RLS hides the rows from everyone else;
// the redirect just keeps non-owners away from the page itself.
export const load: PageServerLoad = async ({ locals, parent }) => {
	const { isOwner } = await parent();
	if (!isOwner) throw redirect(303, '/');

	const { data } = await locals.supabase
		.from('todos')
		.select('id, body, due_date, created_at, bike_id, bikes(id, maker, model)')
		.order('created_at', { ascending: false });

	const todos = (data ?? []).map((todo) => ({
		id: todo.id,
		body: todo.body,
		due_date: todo.due_date,
		created_at: todo.created_at,
		bike_id: todo.bike_id,
		bike: Array.isArray(todo.bikes) ? (todo.bikes[0] ?? null) : (todo.bikes ?? null)
	}));

	return { todos };
};
