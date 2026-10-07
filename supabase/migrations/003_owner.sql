-- Garage: owner allowlist + is_owner() helper
-- Only the owner (a single allowed email) can write; reads stay public via RLS.

create table if not exists public.owner_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.owner_emails enable row level security;

-- is_owner(): true when the current JWT-authenticated user's email is on the allowlist.
-- SECURITY DEFINER so it can read owner_emails even though RLS hides that table from
-- anon/authenticated. It is invoked directly inside RLS policies (as the invoking role),
-- so 006_grants gives anon+authenticated EXECUTE on it.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.owner_emails o
    where lower(o.email) = lower(coalesce(auth.email(), ''))
  );
$$;
