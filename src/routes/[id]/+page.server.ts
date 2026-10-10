import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Tables } from '$lib/database.types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals, params, parent }) => {
	const id = params.id;
	if (!UUID.test(id)) throw error(404, 'Bike not found');

	const { data, error: dbError } = await locals.supabase
		.from('bikes')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (dbError || !data) throw error(404, 'Bike not found');

	const image_url = data.image_path
		? locals.supabase.storage.from('bike-images').getPublicUrl(data.image_path).data.publicUrl
		: null;

	// Owner-only extras: notes live in bike_notes and todos in todos; RLS hides both from
	// everyone else, so they are only fetched (and returned) for the owner.
	const { isOwner } = await parent();
	let notes: string | null = null;
	let todos: Tables<'todos'>[] = [];
	if (isOwner) {
		const [notesRes, todosRes] = await Promise.all([
			locals.supabase.from('bike_notes').select('notes').eq('bike_id', id).maybeSingle(),
			locals.supabase
				.from('todos')
				.select('*')
				.eq('bike_id', id)
				.order('created_at', { ascending: false })
		]);
		notes = notesRes.data?.notes ?? null;
		todos = todosRes.data ?? [];
	}

	return { bike: { ...data, image_url }, notes, todos };
};
