-- Repair required roster columns and force PostgREST to reload schema metadata.
-- Safe to run after 0012-0015 on both complete and partially provisioned databases.

begin;

alter table if exists public.tbos_team_members
  add column if not exists id uuid default gen_random_uuid();
alter table if exists public.tbos_team_members
  add column if not exists is_captain boolean not null default false;

update public.tbos_team_members
set id = gen_random_uuid()
where id is null;

alter table if exists public.tbos_team_members
  alter column id set not null;

grant all on table public.tbos_team_members to service_role;
grant all on table public.tbos_observation_members to service_role;

-- Supabase PostgREST otherwise may continue serving metadata from before the
-- roster and observation-member migrations were applied.
notify pgrst, 'reload schema';

commit;
