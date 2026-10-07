import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/supabaseAuth';
import type { RequestHandler } from './$types';

// Magic-link / PKCE callback. `emailRedirectTo` points here, so the email link lands on this
// route with a `code` param. We exchange it server-side (writing auth cookies via the SSR
// client) so the flow is deterministic and immune to client-side redirect races.
export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (code) {
		const supabase = createSupabaseServerClient(cookies);
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) throw redirect(303, '/');
	}
	throw redirect(303, '/login');
};
