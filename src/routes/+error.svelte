<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} — Garage</title>
</svelte:head>

<div class="login-page">
	<div class="card login-card stack" style="text-align:center">
		<h1>{page.status}</h1>
		<p class="muted">{page.error?.message ?? 'Something went wrong.'}</p>
		<a class="btn-ghost" href="/">Back to gallery</a>
	</div>
</div>
