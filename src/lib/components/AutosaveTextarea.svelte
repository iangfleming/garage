<script lang="ts">
	// Notes editor. For the owner it is always open and autosaves (debounced) as they type;
	// visitors see the notes as plain text. Cmd/Ctrl+Enter forces an immediate save.
	let {
		value = '',
		editable = false,
		placeholder = 'Add…',
		commit
	}: {
		value: string | null;
		editable?: boolean;
		placeholder?: string;
		commit: (value: string) => Promise<boolean>;
	} = $props();

	let draft = $state(value ?? '');
	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	function schedule() {
		if (!editable) return;
		status = 'saving';
		if (timer) clearTimeout(timer);
		timer = setTimeout(flush, 700);
	}

	async function flush() {
		if (timer) {
			clearTimeout(timer);
			timer = undefined;
		}
		if (draft === (value ?? '')) {
			status = 'idle';
			return;
		}
		status = 'saving';
		const ok = await commit(draft);
		status = ok ? 'saved' : 'error';
		if (ok) {
			if (flashTimer) clearTimeout(flashTimer);
			flashTimer = setTimeout(() => {
				if (status === 'saved') status = 'idle';
			}, 1200);
		}
	}

	function keydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
			event.preventDefault();
			flush();
		}
	}
</script>

{#if editable}
	<div class="notes-editor">
		<textarea
			class="notes-input"
			bind:value={draft}
			oninput={schedule}
			onblur={flush}
			onkeydown={keydown}
			rows="6"
			{placeholder}
		></textarea>
		<span
			class="save-status"
			class:saved={status === 'saved'}
			class:error={status === 'error'}
		>
			{#if status === 'saving'}Saving…{:else if status === 'saved'}Saved{:else if status === 'error'}Couldn’t save{:else}&nbsp;{/if}
		</span>
	</div>
{:else}
	<p class="notes-display">{value ?? ''}</p>
{/if}
