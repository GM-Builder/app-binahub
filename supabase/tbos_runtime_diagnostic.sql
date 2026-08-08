-- Run in the same Supabase project used by api.binahub.id.
-- Replace the UUIDs when checking a different team or facilitator.
select
  current_database() as database_name,
  current_user as database_user,
  'df9f0d76-9be4-4c87-a447-62d05de5965b'::uuid as checked_team_id,
  exists (
    select 1 from public.tbos_teams
    where id = 'df9f0d76-9be4-4c87-a447-62d05de5965b'::uuid
  ) as checked_team_exists,
  (select count(*) from public.tbos_teams) as team_count,
  (select count(*) from public.tbos_team_members) as team_member_count,
  (select count(*) from public.tbos_facilitator_teams) as assignment_count,
  (select count(*) from public.tbos_observations) as observation_count,
  (select count(*) from public.tbos_observation_members) as observation_member_count,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbos_team_members'
      and column_name = 'id'
  ) as member_id_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbos_team_members'
      and column_name = 'is_captain'
  ) as member_captain_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbos_observations'
      and column_name = 'client_submission_id'
  ) as submission_id_exists;

-- Force an immediate schema-cache refresh after inspection as well.
notify pgrst, 'reload schema';
