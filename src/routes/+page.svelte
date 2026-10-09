<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let adding = $state(false);
	let addError = $state<string | null>(null);

	async function addBike() {
		adding = true;
		addError = null;
		try {
			const res = await fetch('/api/bikes', { method: 'POST' });
			if (!res.ok) {
				addError = 'Couldn’t add a bike. Are you signed in as the owner?';
				return;
			}
			const { id } = (await res.json()) as { id: string };
			await goto(`/${id}`);
		} catch {
			addError = 'Couldn’t add a bike.';
		} finally {
			adding = false;
		}
	}
</script>

{#if addError}<div class="error-box">{addError}</div>{/if}

<div class="grid">
	{#if data.isOwner}
		<button type="button" class="tile add-tile" onclick={addBike} disabled={adding}>
			<div class="thumb">
				<span class="plus">+</span>
				<span>{adding ? 'Adding…' : 'Add bike'}</span>
			</div>
		</button>
	{/if}

	{#each data.bikes as bike (bike.id)}
		<a class="tile" href="/{bike.id}">
			<div class="thumb">
				{#if bike.image_url}
					<img
						src={bike.image_url}
						alt={[bike.maker, bike.model].filter(Boolean).join(' ') || 'Bike'}
						loading="lazy"
						style="object-position: {bike.focus_x ?? 50}% {bike.focus_y ?? 50}%"
					/>
				{:else}
					<div class="placeholder" aria-hidden="true"></div>
				{/if}
			</div>
			<div class="tile-meta">
				<span class="tile-title">
					{[bike.maker, bike.model].filter(Boolean).join(' ') || 'Untitled'}
				</span>
				{#if bike.year}<span class="muted">{bike.year}</span>{/if}
			</div>
		</a>
	{/each}
</div>

{#if data.bikes.length === 0 && !data.isOwner}
	<p class="muted empty">No bikes yet.</p>
{/if}
