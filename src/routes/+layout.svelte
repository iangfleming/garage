<script lang="ts">
	import './styles.css';

	let { data, children } = $props();
</script>

<div class="primary-grid">
	<header class="site-header">
		<a class="brand" href="/">Garage</a>
	</header>

	<main class="shell">
		{@render children()}
	</main>

	<footer>
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
	</footer>
</div>