-- Garage: core schema
-- A single `bikes` table backs the whole gallery. All fields except id/timestamps are
-- optional so an "Add bike" can create a blank draft that is filled in inline.

create table if not exists public.bikes (
  id uuid primary key default gen_random_uuid(),
  maker text,
  model text,
  year smallint,
  image_path text,            -- object path within the `bike-images` storage bucket
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bikes_created_at on public.bikes (created_at desc);

-- updated_at maintenance (search_path pinned).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bikes_set_updated_at
  before update on public.bikes
  for each row execute function public.set_updated_at();
