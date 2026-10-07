<script lang="ts">
	// Click-to-edit field. Non-editable visitors see plain text; the owner clicks to edit and
	// the change is committed (persisted server-side) on blur or Enter. Escape cancels.
	let {
		value = '',
		editable = false,
		placeholder = 'Add…',
		multiline = false,
		type = 'text',
		inputmode = undefined,
		commit
	}: {
		value: string | null;
		editable?: boolean;
		placeholder?: string;
		multiline?: boolean;
		type?: string;
		inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'url' | 'search' | 'none';
		commit: (value: string) => Promise<boolean>;
	} = $props();

	let editing = $state(false);
	let draft = $state('');
	let saving = $state(false);
	let failed = $state(false);
	let inputEl: HTMLInputElement | HTMLTextAreaElement | undefined = $state();

	$effect(() => {
		if (editing) inputEl?.focus();
	});

	function start() {
		if (!editable) return;
		draft = value ?? '';
		failed = false;
		editing = true;
	}

	async function save() {
		if (!editing || saving) return;
		if (draft === (value ?? '')) {
			editing = false;
			return;
		}
		saving = true;
		const ok = await commit(draft);
		saving = false;
		if (ok) editing = false;
		else failed = true;
	}

	function cancel() {
		editing = false;
		draft = value ?? '';
		failed = false;
	}

	function keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			cancel();
			return;
		}
		const enterSaves = multiline ? event.metaKey || event.ctrlKey : true;
		if (event.key === 'Enter' && enterSaves) {
			event.preventDefault();
			save();
		}
	}
</script>

{#if editable && editing}
	<div class="inline-edit-wrap">
		{#if multiline}
			<textarea
				class="inline-input"
				bind:this={inputEl}
				bind:value={draft}
				onblur={save}
				onkeydown={keydown}
				rows="3"
			></textarea>
		{:else}
			<input
				class="inline-input"
				{type}
				inputmode={inputmode}
				bind:this={inputEl}
				bind:value={draft}
				onblur={save}
				onkeydown={keydown}
			/>
		{/if}
		{#if failed}<span class="save-error">Couldn’t save</span>{/if}
	</div>
{:else if editable}
	<button type="button" class="inline-display editable" onclick={start} title="Click to edit">
		{#if value}<span>{value}</span>{:else}<span class="placeholder">{placeholder}</span>{/if}
	</button>
{:else}
	<div class="inline-display">
		{#if value}<span>{value}</span>{:else}<span class="placeholder">—</span>{/if}
	</div>
{/if}
