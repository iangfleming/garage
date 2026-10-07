<script lang="ts">
	// Image upload. Posts the file to the bike's image endpoint (server uploads to Supabase
	// Storage as the owner, then updates bikes.image_path). Reports the new path + public URL up.
	let {
		bikeId,
		onUploaded
	}: {
		bikeId: string;
		onUploaded: (result: { image_path: string; url: string }) => void;
	} = $props();

	let inputEl: HTMLInputElement | undefined = $state();
	let uploading = $state(false);
	let errorText = $state<string | null>(null);

	async function onChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		uploading = true;
		errorText = null;
		try {
			const form = new FormData();
			form.append('file', file);
			const res = await fetch(`/api/bikes/${bikeId}/image`, { method: 'POST', body: form });
			if (!res.ok) {
				errorText = 'Upload failed';
				return;
			}
			const result = (await res.json()) as { image_path: string; url: string };
			onUploaded(result);
		} catch {
			errorText = 'Upload failed';
		} finally {
			uploading = false;
			if (inputEl) inputEl.value = '';
		}
	}
</script>

<div class="image-upload">
	<label class="btn-ghost">
		{uploading ? 'Uploading…' : 'Upload image'}
		<input
			bind:this={inputEl}
			type="file"
			accept="image/*"
			hidden
			disabled={uploading}
			onchange={onChange}
		/>
	</label>
	{#if errorText}<span class="save-error">{errorText}</span>{/if}
</div>
