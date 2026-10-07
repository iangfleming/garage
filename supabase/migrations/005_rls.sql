-- Garage: row-level security for bikes
--
-- Public data model: the gallery is readable by anyone (no login required). Writes are
-- exclusive to the owner via is_owner() — enforced here at the DB layer, so even if someone
-- else obtains a magic link they cannot modify data. owner_emails has RLS enabled with no
-- policies: only the service role (RLS bypass) and the SECURITY DEFINER is_owner() read it.

alter table public.bikes enable row level security;

-- Public read: anyone can view the gallery.
drop policy if exists "bikes public read" on public.bikes;
create policy "bikes public read"
  on public.bikes for select
  using (true);

-- Owner-only writes.
drop policy if exists "bikes owner insert" on public.bikes;
create policy "bikes owner insert"
  on public.bikes for insert
  with check (public.is_owner());

drop policy if exists "bikes owner update" on public.bikes;
create policy "bikes owner update"
  on public.bikes for update
  using (public.is_owner())
  with check (public.is_owner());

drop policy if exists "bikes owner delete" on public.bikes;
create policy "bikes owner delete"
  on public.bikes for delete
  using (public.is_owner());
