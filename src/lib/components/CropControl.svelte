<script lang="ts">
	let {
		bikeId,
		imageUrl,
		focusX = 50,
		focusY = 50,
		onSaved
	}: {
		bikeId: string;
		imageUrl: string;
		focusX?: number;
		focusY?: number;
		onSaved: (result: { focus_x: number; focus_y: number }) => void;
	} = $props();

	let open = $state(false);
	let fx = $state(focusX);
	let fy = $state(focusY);
	let dragging = $state(false);
	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let frameEl: HTMLDivElement | undefined = $state();
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	let keyTimer: ReturnType<typeof setTimeout> | undefined;

	const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

	function posFromEvent(event: PointerEvent) {
		if (!frameEl) return;
		const rect = frameEl.getBoundingClientRect();
		fx = clamp(Math.round(((event.clientX - rect.left) / rect.width) * 100), 0, 100);
		fy = clamp(Math.round(((event.clientY - rect.top) / rect.height) * 100), 0, 100);
	}

	function down(event: PointerEvent) {
		dragging = true;
		frameEl?.setPointerCapture(event.pointerId);
		posFromEvent(event);
	}

	function move(event: PointerEvent) {
		if (!dragging) return;
		posFromEvent(event);
	}

	function up(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			frameEl?.releasePointerCapture(event.pointerId);
		} catch {
			// pointer capture already released
		}
		commit();
	}

	async function commit() {
		if (fx === focusX && fy === focusY) {
			status = 'idle';
			return;
		}
		status = 'saving';
		try {
			const res = await fetch(`/api/bikes/${bikeId}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ focus_x: fx, focus_y: fy })
			});
			if (!res.ok) {
				status = 'error';
				return;
			}
			const updated = (await res.json()) as { focus_x: number; focus_y: number };
			onSaved({ focus_x: updated.focus_x, focus_y: updated.focus_y });
			status = 'saved';
			if (flashTimer) clearTimeout(flashTimer);
			flashTimer = setTimeout(() => {
				if (status === 'saved') status = 'idle';
			}, 1200);
		} catch {
			status = 'error';
		}
	}

	function reset() {
		fx = 50;
		fy = 50;
		commit();
	}

	function keydown(event: KeyboardEvent) {
		const step = event.shiftKey ? 10 : 2;
		let handled = true;
		if (event.key === 'ArrowLeft') fx = clamp(fx - step, 0, 100);
		else if (event.key === 'ArrowRight') fx = clamp(fx + step, 0, 100);
		else if (event.key === 'ArrowUp') fy = clamp(fy - step, 0, 100);
		else if (event.key === 'ArrowDown') fy = clamp(fy + step, 0, 100);
		else handled = false;
		if (!handled) return;
		event.preventDefault();
		status = 'saving';
		if (keyTimer) clearTimeout(keyTimer);
		keyTimer = setTimeout(commit, 400);
	}
</script>

<div class="crop-control">
	<button type="button" class="btn-ghost" onclick={() => (open = !open)} aria-expanded={open}>
		{open ? 'Close crop editor' : 'Adjust crop'}
	</button>

	{#if open}
		<div class="crop-editor">
			<div
				class="crop-frame"
				bind:this={frameEl}
				role="slider"
				tabindex="0"
				aria-label="Crop focal point"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={fx}
				aria-valuetext="Focus {fx}% across, {fy}% down"
				onpointerdown={down}
				onpointermove={move}
				onpointerup={up}
				onpointercancel={up}
				onkeydown={keydown}
			>
				<img src={imageUrl} alt="" draggable="false" style="object-position: {fx}% {fy}%" />
				<span class="crop-marker" style="left: {fx}%; top: {fy}%"></span>
			</div>
			<div class="crop-actions">
				<button type="button" class="btn-ghost" onclick={reset} disabled={status === 'saving'}>
					Reset to center
				</button>
				<span
					class="save-status"
					class:saved={status === 'saved'}
					class:error={status === 'error'}
				>
					{#if status === 'saving'}Saving…{:else if status === 'saved'}Saved{:else if status === 'error'}Couldn’t
						save{:else}Drag or click to reposition{/if}
				</span>
				<button type="button" class="btn-ghost" onclick={() => (open = false)}>Done</button>
			</div>
		</div>
	{/if}
</div>
