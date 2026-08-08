-- WRONG PROJECT: guarded rollback for accidentally applied migrations
-- 0012, 0013, 0014, 0015, and 0016.
--
-- This script intentionally refuses to continue if operational rows or an
-- external foreign key are present. It does not use CASCADE.

begin;

do $$
declare
  unsafe_rows text;
  external_dependencies text;
  external_trigger_dependencies text;
begin
  select string_agg(format('%I=%s', table_name, row_count), ', ' order by table_name)
  into unsafe_rows
  from (
    select 'organizations' as table_name, count(*) as row_count from public.organizations
    union all select 'profiles', count(*) from public.profiles
    union all select 'tbos_teams', count(*) from public.tbos_teams
    union all select 'tbos_team_members', count(*) from public.tbos_team_members
    union all select 'tbos_facilitator_teams', count(*) from public.tbos_facilitator_teams
    union all select 'tbos_observations', count(*) from public.tbos_observations
    union all select 'tbos_observation_scores', count(*) from public.tbos_observation_scores
    union all select 'tbos_observation_audit_log', count(*) from public.tbos_observation_audit_log
    union all select 'tbos_observation_members', count(*) from public.tbos_observation_members
  ) row_counts
  where row_count <> 0;

  if unsafe_rows is not null then
    raise exception 'Rollback stopped: operational rows exist: %', unsafe_rows;
  end if;

  with rollback_tables(table_name) as (
    values
      ('organizations'), ('profiles'), ('tbos_missions'),
      ('tbos_behavioral_dimensions'), ('tbos_teams'),
      ('tbos_mission_dimensions'), ('tbos_dimension_levels'),
      ('tbos_team_members'), ('tbos_facilitator_teams'),
      ('tbos_observations'), ('tbos_observation_scores'),
      ('tbos_observation_audit_log'), ('tbos_observation_members')
  )
  select string_agg(
    format('%I.%I -> %I.%I', child_ns.nspname, child.relname, parent_ns.nspname, parent.relname),
    ', '
  )
  into external_dependencies
  from pg_constraint constraint_row
  join pg_class child on child.oid = constraint_row.conrelid
  join pg_namespace child_ns on child_ns.oid = child.relnamespace
  join pg_class parent on parent.oid = constraint_row.confrelid
  join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
  where constraint_row.contype = 'f'
    and parent_ns.nspname = 'public'
    and parent.relname in (select table_name from rollback_tables)
    and not (
      child_ns.nspname = 'public'
      and child.relname in (select table_name from rollback_tables)
    );

  if external_dependencies is not null then
    raise exception 'Rollback stopped: external dependencies exist: %', external_dependencies;
  end if;

  select string_agg(
    format('%I.%I (%I)', event_object_schema, event_object_table, trigger_name),
    ', '
  )
  into external_trigger_dependencies
  from information_schema.triggers
  where action_statement ilike '%set_transformation_updated_at%'
    and event_object_table not like 'tbos_%';

  if external_trigger_dependencies is not null then
    raise exception 'Rollback stopped: shared trigger function has non-T-BOS users: %', external_trigger_dependencies;
  end if;

  if to_regclass('public.associates') is null
    or to_regclass('public.associate_profiles') is null
  then
    raise exception 'Rollback stopped: canonical binahub-platform identity tables were not found.';
  end if;
end;
$$;

-- Remove trigger dependencies explicitly. Do not use CASCADE: any dependency
-- outside this known list must still abort the transaction.
drop trigger if exists tbos_observation_members_set_updated_at
  on public.tbos_observation_members;
drop trigger if exists tbos_observations_revision_trigger
  on public.tbos_observations;
drop trigger if exists tbos_observations_set_updated_at
  on public.tbos_observations;

-- Remove RPCs and trigger functions so no API call can mutate tables during
-- cleanup and no function retains a dependency on a T-BOS table row type.
drop function if exists public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, jsonb, boolean);
drop function if exists public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, boolean);
drop function if exists public.tbos_set_team_captain(uuid, uuid, boolean);
drop function if exists public.tbos_mutate_observation(uuid, uuid, text, text, text, jsonb);
drop function if exists public.tbos_set_revision_deadline();

-- Drop in foreign-key order. No CASCADE: an unexpected dependency aborts and
-- rolls back the complete transaction.
drop table public.tbos_observation_members;
drop table public.tbos_observation_audit_log;
drop table public.tbos_observation_scores;
drop table public.tbos_observations;
drop table public.tbos_facilitator_teams;
drop table public.tbos_team_members;
drop table public.tbos_mission_dimensions;
drop table public.tbos_dimension_levels;
drop table public.tbos_teams;
drop table public.tbos_behavioral_dimensions;
drop table public.tbos_missions;

-- Logs show organizations and profiles were created by 0012. The guards above
-- require both to remain empty and free of external references.
drop table public.profiles;
drop table public.organizations;

-- Repository and Git-history audit confirm this function is not canonical to
-- binahub-platform. The dependency guard above prevents an unsafe removal.
drop function public.set_transformation_updated_at();

notify pgrst, 'reload schema';

commit;
