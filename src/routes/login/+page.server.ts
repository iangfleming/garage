import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		const { data } = await locals.supabase.rpc('is_owner');
		if (data === true) throw redirect(303, '/');
		// Signed in but not the owner: don't bounce (that would loop) — explain instead.
		return { notAuthorized: true };
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const fd = await request.formData();
		const email = String(fd.get('email') ?? '').trim().toLowerCase();
		if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			return fail(400, { email, message: 'Enter a valid email address.' });
		}

		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${url.origin}/auth/callback` }
		});
		if (error) return fail(400, { email, message: error.message });

		return { sent: true, email };
	}
};
