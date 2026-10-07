<script lang="ts">
	import './styles.css';

	let { data, children } = $props();
</script>

<header class="site-header">
	<a class="brand" href="/">Garage</a>
	<nav class="site-nav">
		{#if data.user}
			<span class="who muted">{data.user.email}</span>
			<form method="post" action="/signout" class="inline-form">
				<button class="btn-ghost" type="submit">Sign out</button>
			</form>
		{:else}
			<a class="btn-ghost" href="/login">Sign in</a>
		{/if}
	</nav>
</header>

<main class="shell">
	{@render children()}
</main>
