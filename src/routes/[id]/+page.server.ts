import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals, params }) => {
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

	return { bike: { ...data, image_url } };
};
