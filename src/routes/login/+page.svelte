<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Sign in — Garage</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="login-page">
	<div class="card stack login-card">
		<h1>Sign in</h1>

		{#if page.data.notAuthorized}
			<p class="muted">
				You’re signed in, but this email isn’t on the owner list, so editing is disabled.
			</p>
			<a class="btn-ghost" href="/">Back to gallery</a>
		{:else if page.form?.sent}
			<p class="muted">
				Check <strong>{page.form.email}</strong> for a sign-in link. You can close this tab.
			</p>
			<a class="btn-ghost" href="/">Back to gallery</a>
		{:else}
			<p class="muted">Get a magic link by email. Only the owner’s email can edit.</p>
			{#if page.form?.message}
				<div class="error-box">{page.form.message}</div>
			{/if}
			<form method="post" class="stack">
				<div>
					<label for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="you@example.com"
						value={page.form?.email ?? ''}
						autocomplete="email"
					/>
				</div>
				<button class="btn-primary" type="submit">Send sign-in link</button>
			</form>
		{/if}
	</div>
</div>
