<script lang="ts">
	import { goto } from '$app/navigation';
	import InlineText from '$lib/components/InlineText.svelte';
	import AutosaveTextarea from '$lib/components/AutosaveTextarea.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import CropControl from '$lib/components/CropControl.svelte';

	let { data } = $props();

	type Bike = typeof data.bike;
	type Todo = (typeof data.todos)[number];

	// `bike` is the server row merged with any local edits made on this page. Keeping edits in a
	// separate `overrides` object (rather than copying the row) keeps it reactive to `data`.
	let overrides = $state<Partial<Bike>>({});
	let busy = $state(false);
	let errorText = $state<string | null>(null);

	// Owner-only notes (bike_notes) and todos, kept as local state since only the owner
	// ever sees or mutates them.
	let notesOverride = $state<string | null | undefined>(undefined);
	let todos = $state<Todo[]>([...data.todos]);
	let newTodoBody = $state('');
	let newTodoDue = $state('');
	let addingTodo = $state(false);

	const bike = $derived({ ...data.bike, ...overrides });
	const editable = $derived(data.isOwner);
	const notes = $derived(notesOverride !== undefined ? notesOverride : data.notes);

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

	// Notes live in bike_notes (owner-only), so they save through their own endpoint.
	async function commitNotes(raw: string): Promise<boolean> {
		errorText = null;
		try {
			const res = await fetch(`/api/bikes/${bike.id}/notes`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ notes: raw === '' ? null : raw })
			});
			if (!res.ok) {
				errorText = 'Couldn’t save';
				return false;
			}
			const { notes: saved } = (await res.json()) as { notes: string | null };
			notesOverride = saved;
			return true;
		} catch {
			errorText = 'Couldn’t save';
			return false;
		}
	}

	// Checking a todo off deletes its row.
	async function checkOff(todo: Todo) {
		errorText = null;
		try {
			const res = await fetch(`/api/todos/${todo.id}`, { method: 'DELETE' });
			if (!res.ok) {
				errorText = 'Couldn’t complete todo';
				return;
			}
			todos = todos.filter((t) => t.id !== todo.id);
		} catch {
			errorText = 'Couldn’t complete todo';
		}
	}

	async function editTodo(todo: Todo, patch: { body?: string; due_date?: string | null }) {
		errorText = null;
		try {
			const res = await fetch(`/api/todos/${todo.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(patch)
			});
			if (!res.ok) {
				errorText = 'Couldn’t save';
				return false;
			}
			const updated = (await res.json()) as Todo;
			todos = todos.map((t) => (t.id === todo.id ? updated : t));
			return true;
		} catch {
			errorText = 'Couldn’t save';
			return false;
		}
	}

	async function addTodo(event: Event) {
		event.preventDefault();
		const body = newTodoBody.trim();
		if (!body || addingTodo) return;
		addingTodo = true;
		errorText = null;
		try {
			const res = await fetch(`/api/bikes/${bike.id}/todos`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ body, due_date: newTodoDue || null })
			});
			if (!res.ok) {
				errorText = 'Couldn’t add todo';
				return;
			}
			const created = (await res.json()) as Todo;
			todos = [created, ...todos];
			newTodoBody = '';
			newTodoDue = '';
		} catch {
			errorText = 'Couldn’t add todo';
		} finally {
			addingTodo = false;
		}
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

	{#if editable}
		<section class="notes-section">
			<h2>Notes</h2>
			<AutosaveTextarea value={notes} {editable} placeholder="Add notes…" commit={commitNotes} />
		</section>

		<section class="todos-section">
			<h2>Todos</h2>
			{#if todos.length > 0}
				<ul class="todo-list">
					{#each todos as todo (todo.id)}
						<li class="todo-item">
							<input
								type="checkbox"
								class="todo-check"
								title="Complete (removes the todo)"
								aria-label="Complete todo"
								onchange={() => checkOff(todo)}
							/>
							<span class="todo-body">
								<InlineText
									value={todo.body}
									{editable}
									placeholder="Todo"
									commit={(v) => editTodo(todo, { body: v })}
								/>
							</span>
							<input
								type="date"
								class="todo-due"
								value={todo.due_date ?? ''}
								title="Due date (optional)"
								aria-label="Due date"
								onchange={(e) => editTodo(todo, { due_date: e.currentTarget.value || null })}
							/>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted todo-empty">No todos yet.</p>
			{/if}
			<form class="todo-add" onsubmit={addTodo}>
				<input
					class="todo-add-body"
					bind:value={newTodoBody}
					placeholder="Add a todo…"
					maxlength="500"
				/>
				<input
					type="date"
					class="todo-add-due"
					bind:value={newTodoDue}
					title="Due date (optional)"
					aria-label="Due date (optional)"
				/>
				<button type="submit" disabled={addingTodo || newTodoBody.trim() === ''}>
					{addingTodo ? 'Adding…' : 'Add'}
				</button>
			</form>
		</section>

		<div class="danger-zone">
			<button type="button" class="btn-danger" onclick={remove} disabled={busy}>
				{busy ? 'Deleting…' : 'Delete bike'}
			</button>
		</div>
	{/if}
</article>
