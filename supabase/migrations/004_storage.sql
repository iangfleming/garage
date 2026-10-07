-- Garage: image storage bucket + policies
-- Public-read bucket; only the owner can write objects.

insert into storage.buckets (id, name, public)
values ('bike-images', 'bike-images', true)
on conflict (id) do update set public = excluded.public;

-- Public read of bike images.
drop policy if exists "bike-images public read" on storage.objects;
create policy "bike-images public read"
  on storage.objects for select
  using (bucket_id = 'bike-images');

-- Owner-only writes.
drop policy if exists "bike-images owner insert" on storage.objects;
create policy "bike-images owner insert"
  on storage.objects for insert
  with check (bucket_id = 'bike-images' and public.is_owner());

drop policy if exists "bike-images owner update" on storage.objects;
create policy "bike-images owner update"
  on storage.objects for update
  using (bucket_id = 'bike-images' and public.is_owner());

drop policy if exists "bike-images owner delete" on storage.objects;
create policy "bike-images owner delete"
  on storage.objects for delete
  using (bucket_id = 'bike-images' and public.is_owner());
