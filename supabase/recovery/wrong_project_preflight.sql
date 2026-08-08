-- WRONG PROJECT: read-only preflight before removing the accidentally applied
-- T-BOS migrations. Run this first and retain the result for review.

with tracked_tables(table_name) as (
  values
    ('organizations'),
    ('profiles'),
    ('tbos_missions'),
    ('tbos_behavioral_dimensions'),
    ('tbos_teams'),
    ('tbos_mission_dimensions'),
    ('tbos_dimension_levels'),
    ('tbos_team_members'),
    ('tbos_facilitator_teams'),
    ('tbos_observations'),
    ('tbos_observation_scores'),
    ('tbos_observation_audit_log'),
    ('tbos_observation_members')
)
select
  tracked_tables.table_name,
  to_regclass(format('public.%I', tracked_tables.table_name)) is not null as exists,
  case
    when to_regclass(format('public.%I', tracked_tables.table_name)) is null then null
    else (xpath(
      '//row/count/text()',
      query_to_xml(
        format('select count(*) as count from public.%I', tracked_tables.table_name),
        false,
        true,
        ''
      )
    ))[1]::text::bigint
  end as row_count
from tracked_tables
order by tracked_tables.table_name;

-- Any row here blocks the guarded rollback. It means a table outside the
-- accidental migration depends on an object we intend to remove.
with rollback_tables(table_name) as (
  values
    ('organizations'), ('profiles'), ('tbos_missions'),
    ('tbos_behavioral_dimensions'), ('tbos_teams'),
    ('tbos_mission_dimensions'), ('tbos_dimension_levels'),
    ('tbos_team_members'), ('tbos_facilitator_teams'),
    ('tbos_observations'), ('tbos_observation_scores'),
    ('tbos_observation_audit_log'), ('tbos_observation_members')
)
select
  child_ns.nspname || '.' || child.relname as external_table,
  constraint_row.conname as foreign_key,
  parent_ns.nspname || '.' || parent.relname as referenced_table
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
  )
order by external_table, foreign_key;

-- If a trigger outside T-BOS appears here, stop. The guarded rollback refuses
-- to remove a shared function that is used outside the accidental tables.
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_statement
from information_schema.triggers
where action_statement ilike '%set_transformation_updated_at%'
  and event_object_table not like 'tbos_%'
order by event_object_schema, event_object_table, trigger_name;

-- Canonical binahub-platform identity tables must remain present and are never
-- touched by the rollback.
select
  to_regclass('public.associates') is not null as associates_exists,
  to_regclass('public.associate_profiles') is not null as associate_profiles_exists;

-- Inventory the RPC overloads installed by 0013-0015.
select
  namespace.nspname as function_schema,
  procedure.proname as function_name,
  pg_get_function_identity_arguments(procedure.oid) as identity_arguments
from pg_proc procedure
join pg_namespace namespace on namespace.oid = procedure.pronamespace
where namespace.nspname = 'public'
  and procedure.proname in (
    'tbos_submit_observation',
    'tbos_set_team_captain',
    'tbos_mutate_observation',
    'tbos_set_revision_deadline',
    'set_transformation_updated_at'
  )
order by function_name, identity_arguments;

-- The failed 0011 permission script should have rolled back as one request.
-- This inventory lets us detect unexpected broad grants without changing them.
select
  table_name,
  grantee,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name not like 'tbos_%'
group by table_name, grantee
order by table_name, grantee;

-- A failed 0011 attempted a broad sequence grant before referencing missing
-- T-BOS tables. Inventory sequence privileges as an additional precaution.
select
  object_name as sequence_name,
  grantee,
  privilege_type
from information_schema.usage_privileges
where object_schema = 'public'
  and object_type = 'SEQUENCE'
  and grantee in ('anon', 'authenticated')
order by object_name, grantee, privilege_type;
