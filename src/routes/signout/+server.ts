import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Sign out. Exposed as an endpoint (not a layout action, which SvelteKit doesn't allow) so the
// header form can POST to it from any page. The SSR client clears the auth cookies on the response.
export const POST: RequestHandler = async ({ locals }) => {
	await locals.supabase.auth.signOut();
	throw redirect(303, '/');
};
