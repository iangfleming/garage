import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// isOwner drives every edit affordance in the UI. RLS remains the real enforcement layer;
	// this only decides what to show. is_owner() reads the owner allowlist for the current user.
	let isOwner = false;
	if (locals.user) {
		const { data } = await locals.supabase.rpc('is_owner');
		isOwner = data === true;
	}

	return {
		user: locals.user ? { email: locals.user.email ?? '' } : null,
		isOwner
	};
};
