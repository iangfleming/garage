import { error, json } from '@sveltejs/kit';
import { assertOwner } from '$lib/gate';
import type { RequestHandler } from './$types';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

// Upload a bike image: store the object in the `bike-images` bucket (owner-only via Storage RLS),
// point bikes.image_path at it, and clean up any previous object.
export const POST: RequestHandler = async ({ locals, params, request }) => {
	await assertOwner(locals);
	const id = params.id;

	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) throw error(400, 'No file provided');
	if (!ALLOWED.has(file.type)) throw error(400, 'Unsupported image type');
	if (file.size > MAX_BYTES) throw error(400, 'Image too large (max 8 MB)');

	const { data: existing } = await locals.supabase
		.from('bikes')
		.select('image_path')
		.eq('id', id)
		.maybeSingle();
	if (!existing) throw error(404, 'Bike not found');

	const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
	const path = `${id}/${Date.now()}.${ext || 'jpg'}`;
	const bytes = new Uint8Array(await file.arrayBuffer());

	const { error: uploadError } = await locals.supabase.storage
		.from('bike-images')
		.upload(path, bytes, { contentType: file.type, upsert: true });
	if (uploadError) throw error(400, uploadError.message);

	const { error: updateError } = await locals.supabase
		.from('bikes')
		.update({ image_path: path })
		.eq('id', id)
		.select('id')
		.maybeSingle();
	if (updateError) throw error(400, updateError.message);

	if (existing.image_path && existing.image_path !== path) {
		await locals.supabase.storage.from('bike-images').remove([existing.image_path]);
	}

	const url = locals.supabase.storage.from('bike-images').getPublicUrl(path).data.publicUrl;
	return json({ image_path: path, url });
};
