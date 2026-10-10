-- Garage: admin-only notes + todos
--
-- Notes move out of the public `bikes` table into `bike_notes` so RLS can hide them:
-- bike rows are publicly readable, and RLS is row-level, so a column on `bikes` can
-- never be owner-only. Existing notes data is migrated, then bikes.notes is dropped.
--
-- `todos` is a per-bike task list (owner-only). Checking an item off deletes its row;
-- due_date is optional. Both tables use is_owner() policies — no public read.

create table if not exists public.bike_notes (
  bike_id uuid primary key references public.bikes(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bike_notes_set_updated_at
  before update on public.bike_notes
  for each row execute function public.set_updated_at();

insert into public.bike_notes (bike_id, notes)
select id, notes from public.bikes
where notes is not null
on conflict (bike_id) do update set notes = excluded.notes;

alter table public.bikes drop column if exists notes;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes(id) on delete cascade,
  body text not null check (btrim(body) <> ''),
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_todos_bike_id on public.todos (bike_id);
create index if not exists idx_todos_created_at on public.todos (created_at desc);
create index if not exists idx_todos_due_date on public.todos (due_date);

-- Owner-only RLS: enabled with is_owner() policies for every command, so anon and
-- non-owner authenticated users cannot read or write either table.
alter table public.bike_notes enable row level security;
alter table public.todos enable row level security;

drop policy if exists "bike_notes owner select" on public.bike_notes;
create policy "bike_notes owner select"
  on public.bike_notes for select
  using (public.is_owner());

drop policy if exists "bike_notes owner insert" on public.bike_notes;
create policy "bike_notes owner insert"
  on public.bike_notes for insert
  with check (public.is_owner());

drop policy if exists "bike_notes owner update" on public.bike_notes;
create policy "bike_notes owner update"
  on public.bike_notes for update
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "bike_notes owner delete" on public.bike_notes;
create policy "bike_notes owner delete"
  on public.bike_notes for delete
  using (public.is_owner());

drop policy if exists "todos owner select" on public.todos;
create policy "todos owner select"
  on public.todos for select
  using (public.is_owner());

drop policy if exists "todos owner insert" on public.todos;
create policy "todos owner insert"
  on public.todos for insert
  with check (public.is_owner());

drop policy if exists "todos owner update" on public.todos;
create policy "todos owner update"
  on public.todos for update
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "todos owner delete" on public.todos;
create policy "todos owner delete"
  on public.todos for delete
  using (public.is_owner());
