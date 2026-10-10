import { error } from '@sveltejs/kit';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY = 500;

// Todo text: non-empty (after trim), capped. Stored trimmed.
export function todoBody(value: unknown): string {
	if (typeof value !== 'string' || value.trim() === '') throw error(400, 'Invalid todo text');
	const body = value.trim();
	if (body.length > MAX_BODY) throw error(400, 'Todo text too long');
	return body;
}

// Optional due date: null/'' clears it; otherwise a real calendar date as 'YYYY-MM-DD'.
export function dueDate(value: unknown): string | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value !== 'string' || !DATE.test(value)) throw error(400, 'Invalid due date');
	const [y, m, d] = value.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
		throw error(400, 'Invalid due date');
	}
	return value;
}
