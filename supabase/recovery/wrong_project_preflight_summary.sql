-- WRONG PROJECT: single-result summary for the Supabase SQL editor.
-- Read-only. Return this one JSON object before running the rollback.

select jsonb_build_object(
  'core', jsonb_build_object(
    'associates_exists', to_regclass('public.associates') is not null,
    'associate_profiles_exists', to_regclass('public.associate_profiles') is not null
  ),
  'row_counts', jsonb_build_object(
    'organizations', (select count(*) from public.organizations),
    'profiles', (select count(*) from public.profiles),
    'tbos_missions', (select count(*) from public.tbos_missions),
    'tbos_behavioral_dimensions', (select count(*) from public.tbos_behavioral_dimensions),
    'tbos_teams', (select count(*) from public.tbos_teams),
    'tbos_mission_dimensions', (select count(*) from public.tbos_mission_dimensions),
    'tbos_dimension_levels', (select count(*) from public.tbos_dimension_levels),
    'tbos_team_members', (select count(*) from public.tbos_team_members),
    'tbos_facilitator_teams', (select count(*) from public.tbos_facilitator_teams),
    'tbos_observations', (select count(*) from public.tbos_observations),
    'tbos_observation_scores', (select count(*) from public.tbos_observation_scores),
    'tbos_observation_audit_log', (select count(*) from public.tbos_observation_audit_log),
    'tbos_observation_members', (select count(*) from public.tbos_observation_members)
  ),
  'external_foreign_keys', coalesce((
    with rollback_tables(table_name) as (
      values
        ('organizations'), ('profiles'), ('tbos_missions'),
        ('tbos_behavioral_dimensions'), ('tbos_teams'),
        ('tbos_mission_dimensions'), ('tbos_dimension_levels'),
        ('tbos_team_members'), ('tbos_facilitator_teams'),
        ('tbos_observations'), ('tbos_observation_scores'),
        ('tbos_observation_audit_log'), ('tbos_observation_members')
    )
    select jsonb_agg(jsonb_build_object(
      'external_table', child_ns.nspname || '.' || child.relname,
      'foreign_key', constraint_row.conname,
      'referenced_table', parent_ns.nspname || '.' || parent.relname
    ))
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
  ), '[]'::jsonb),
  'external_updated_at_triggers', coalesce((
    select jsonb_agg(jsonb_build_object(
      'table', event_object_schema || '.' || event_object_table,
      'trigger', trigger_name
    ))
    from information_schema.triggers
    where action_statement ilike '%set_transformation_updated_at%'
      and event_object_table not like 'tbos_%'
  ), '[]'::jsonb),
  'tbos_rpc_count', (
    select count(*)
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname in (
        'tbos_submit_observation',
        'tbos_set_team_captain',
        'tbos_mutate_observation',
        'tbos_set_revision_deadline'
      )
  ),
  'accidental_trigger_function_exists',
    to_regprocedure('public.set_transformation_updated_at()') is not null
) as preflight;
