<script lang="ts">
	import { goto } from '$app/navigation';
	import InlineText from '$lib/components/InlineText.svelte';
	import AutosaveTextarea from '$lib/components/AutosaveTextarea.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import CropControl from '$lib/components/CropControl.svelte';

	let { data } = $props();

	type Bike = typeof data.bike;

	// `bike` is the server row merged with any local edits made on this page. Keeping edits in a
	// separate `overrides` object (rather than copying the row) keeps it reactive to `data`.
	let overrides = $state<Partial<Bike>>({});
	let busy = $state(false);
	let errorText = $state<string | null>(null);

	const bike = $derived({ ...data.bike, ...overrides });
	const editable = $derived(data.isOwner);

	// Persist a single field server-side (RLS enforces owner-only). Returns true on success so the
	// inline controls can exit edit mode; the returned row keeps local state in sync.
	async function commit(field: string, raw: string): Promise<boolean> {
		let value: string | number | null = raw;

		if (field === 'year') {
			const text = raw.trim();
			if (text === '') {
				value = null;
			} else {
				const n = Number(text);
				if (!Number.isInteger(n) || n < 1800 || n > 2100) {
					errorText = 'Enter a valid year';
					return false;
				}
				value = n;
			}
		} else {
			value = raw === '' ? null : raw;
		}

		errorText = null;
		try {
			const res = await fetch(`/api/bikes/${bike.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ [field]: value })
			});
			if (!res.ok) {
				errorText = 'Couldn’t save';
				return false;
			}
			const updated = (await res.json()) as Partial<Bike>;
			overrides = { ...overrides, ...updated };
			return true;
		} catch {
			errorText = 'Couldn’t save';
			return false;
		}
	}

	function onImageUploaded(result: { image_path: string; url: string }) {
		overrides = { ...overrides, image_path: result.image_path, image_url: result.url };
	}

	function onCropSaved(result: { focus_x: number; focus_y: number }) {
		overrides = { ...overrides, focus_x: result.focus_x, focus_y: result.focus_y };
	}

	async function remove() {
		if (!confirm('Delete this bike? This can’t be undone.')) return;
		busy = true;
		errorText = null;
		try {
			const res = await fetch(`/api/bikes/${bike.id}`, { method: 'DELETE' });
			if (res.ok) {
				await goto('/');
				return;
			}
			errorText = 'Couldn’t delete';
		} catch {
			errorText = 'Couldn’t delete';
		} finally {
			busy = false;
		}
	}

	const title = $derived([bike.maker, bike.model].filter(Boolean).join(' ') || 'Bike');
</script>

<svelte:head>
	<title>{title} — Garage</title>
</svelte:head>

<article class="detail">
	<a class="back" href="/">← Back to gallery</a>

	<div class="hero">
		{#if bike.image_url}
			<img
				class="hero-img"
				src={bike.image_url}
				alt={title}
				style="object-position: {bike.focus_x ?? 50}% {bike.focus_y ?? 50}%"
			/>
		{:else}
			<div class="hero-placeholder" aria-hidden="true"></div>
		{/if}
		{#if editable}
			<ImageUpload bikeId={bike.id} onUploaded={onImageUploaded} />
			{#if bike.image_url}
				<CropControl
					bikeId={bike.id}
					imageUrl={bike.image_url}
					focusX={bike.focus_x ?? 50}
					focusY={bike.focus_y ?? 50}
					onSaved={onCropSaved}
				/>
			{/if}
		{/if}
	</div>

	{#if errorText}<div class="error-box">{errorText}</div>{/if}

	<div class="fields">
		<div class="field">
			<span class="label">Maker</span>
			<InlineText
				value={bike.maker}
				{editable}
				placeholder="Add maker"
				commit={(v) => commit('maker', v)}
			/>
		</div>
		<div class="field">
			<span class="label">Model</span>
			<InlineText
				value={bike.model}
				{editable}
				placeholder="Add model"
				commit={(v) => commit('model', v)}
			/>
		</div>
		<div class="field">
			<span class="label">Year</span>
			<InlineText
				value={bike.year != null ? String(bike.year) : ''}
				{editable}
				placeholder="Add year"
				inputmode="numeric"
				commit={(v) => commit('year', v)}
			/>
		</div>
		<div class="field">
			<span class="label">Description</span>
			<InlineText
				value={bike.description}
				{editable}
				placeholder="Add a short description"
				multiline
				commit={(v) => commit('description', v)}
			/>
		</div>
	</div>

	<section class="notes-section">
		<h2>Notes</h2>
		<AutosaveTextarea
			value={bike.notes}
			{editable}
			placeholder="Add notes…"
			commit={(v) => commit('notes', v)}
		/>
	</section>

	{#if editable}
		<div class="danger-zone">
			<button type="button" class="btn-danger" onclick={remove} disabled={busy}>
				{busy ? 'Deleting…' : 'Delete bike'}
			</button>
		</div>
	{/if}
</article>
