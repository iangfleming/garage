import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Cookies } from '@sveltejs/kit';
import type { Database } from './database.types';

// Server-side, cookie-based Supabase client. Token refreshes are written back to the browser
// through the SvelteKit cookie store. Uses the publishable/anon key: this client acts as the
// logged-in user (the owner), and Postgres RLS enforces what that user is allowed to do.
export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (toSet) => {
				for (const { name, value, options } of toSet) {
					cookies.set(name, value, options);
				}
			}
		}
	});
}
