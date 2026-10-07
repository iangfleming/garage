-- Garage: grant table/function privileges to the Supabase roles.
--
-- RLS policies control *which rows* a role can touch; without these GRANTs the roles cannot
-- access the tables at all ("permission denied for table ..."). Reads work for the public
-- (gallery); writes to bikes/storage remain gated by RLS to is_owner(). owner_emails stays
-- unreadable by anon/authenticated because it has RLS enabled with no policies.

grant usage on schema public to anon, authenticated, service_role;

-- Public, read-only access.
grant select on all tables in schema public to anon;

-- Read + write for authenticated (RLS still restricts writes to the owner) and the service role.
grant all on all tables in schema public to authenticated, service_role;

-- Functions used via RPC from the browser and inside RLS policies (is_owner).
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Sequences (used if any table ever switches to bigserial ids).
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Apply the same grants to objects created after this migration runs.
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
