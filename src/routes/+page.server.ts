import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase
		.from('bikes')
		.select('id, maker, model, year, image_path, focus_x, focus_y, created_at')
		.order('created_at', { ascending: false });

	const bikes = (data ?? []).map((bike) => ({
		id: bike.id,
		maker: bike.maker,
		model: bike.model,
		year: bike.year,
		focus_x: bike.focus_x,
		focus_y: bike.focus_y,
		image_url: bike.image_path
			? locals.supabase.storage.from('bike-images').getPublicUrl(bike.image_path).data.publicUrl
			: null
	}));

	return { bikes };
};
