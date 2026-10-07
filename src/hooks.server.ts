import { createSupabaseServerClient } from '$lib/supabaseAuth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	const {
		data: { user }
	} = await event.locals.supabase.auth.getUser();
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Required so Supabase data loaded in `load` functions is serialized to the browser.
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
