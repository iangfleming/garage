import { error } from '@sveltejs/kit';

// Server-only gate for mutating endpoints. RLS is the real enforcement layer, but checking here
// gives callers a clean 401/403 instead of a silent no-op when a non-owner attempts a write.
export async function assertOwner(locals: App.Locals): Promise<void> {
	if (!locals.user) throw error(401, 'Not signed in');
	const { data } = await locals.supabase.rpc('is_owner');
	if (data !== true) throw error(403, 'Not allowed');
}
