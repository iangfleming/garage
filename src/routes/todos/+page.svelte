<script lang="ts">
	let { data } = $props();

	type Todo = (typeof data.todos)[number];
	type SortKey = 'bike' | 'created_at' | 'due_date';

	let todos = $state<Todo[]>([...data.todos]);
	let sortKey = $state<SortKey>('created_at');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let errorText = $state<string | null>(null);

	function bikeLabel(todo: Todo): string {
		return [todo.bike?.maker, todo.bike?.model].filter(Boolean).join(' ') || 'Untitled';
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'created_at' ? 'desc' : 'asc';
		}
	}

	const sorted = $derived.by(() => {
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...todos].sort((a, b) => {
			if (sortKey === 'due_date') {
				// Missing due dates always sit at the bottom, regardless of direction.
				if (a.due_date === null && b.due_date === null) return 0;
				if (a.due_date === null) return 1;
				if (b.due_date === null) return -1;
				return a.due_date < b.due_date ? -dir : a.due_date > b.due_date ? dir : 0;
			}
			if (sortKey === 'bike') return bikeLabel(a).localeCompare(bikeLabel(b)) * dir;
			return a.created_at < b.created_at ? -dir : a.created_at > b.created_at ? dir : 0;
		});
	});

	function sortIndicator(key: SortKey): string {
		if (sortKey !== key) return '';
		return sortDir === 'asc' ? ' ↑' : ' ↓';
	}

	const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});

	// due_date is a plain 'YYYY-MM-DD'; parse it as a local date so it never shifts a day.
	function fmtDue(iso: string): string {
		const [y, m, d] = iso.split('-').map(Number);
		return dateTimeFmt.format(new Date(y, m - 1, d));
	}

	function fmtCreated(iso: string): string {
		return dateTimeFmt.format(new Date(iso));
	}

	function isOverdue(todo: Todo): boolean {
		if (!todo.due_date) return false;
		const [y, m, d] = todo.due_date.split('-').map(Number);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return new Date(y, m - 1, d) < today;
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
</script>

<svelte:head>
	<title>Todos — Garage</title>
</svelte:head>

<h1>Todos</h1>

{#if errorText}<div class="error-box">{errorText}</div>{/if}

{#if todos.length === 0}
	<p class="muted empty">No todos.</p>
{:else}
	<div class="todo-table-wrap">
		<table class="todo-table">
			<thead>
				<tr>
					<th class="col-check" aria-label="Complete"></th>
					<th>
						<button type="button" class="sort-btn" onclick={() => toggleSort('bike')}>
							Bike{sortIndicator('bike')}
						</button>
					</th>
					<th>Todo</th>
					<th>
						<button type="button" class="sort-btn" onclick={() => toggleSort('created_at')}>
							Created{sortIndicator('created_at')}
						</button>
					</th>
					<th>
						<button type="button" class="sort-btn" onclick={() => toggleSort('due_date')}>
							Due{sortIndicator('due_date')}
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each sorted as todo (todo.id)}
					<tr>
						<td class="col-check">
							<input
								type="checkbox"
								title="Complete (removes the todo)"
								aria-label="Complete todo"
								onchange={() => checkOff(todo)}
							/>
						</td>
						<td><a href="/{todo.bike_id}">{bikeLabel(todo)}</a></td>
						<td class="col-body">{todo.body}</td>
						<td class="muted col-date">{fmtCreated(todo.created_at)}</td>
						<td class="muted col-date">
							{#if todo.due_date}
								<span class:overdue={isOverdue(todo)}>{fmtDue(todo.due_date)}</span>
							{:else}
								—
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
