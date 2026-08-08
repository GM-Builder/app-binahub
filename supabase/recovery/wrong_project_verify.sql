-- WRONG PROJECT: accidental objects should be false/zero; canonical identity
-- tables should remain true after guarded rollback.
select
  to_regclass('public.organizations') is not null as organizations_exists,
  to_regclass('public.profiles') is not null as profiles_exists,
  to_regclass('public.tbos_missions') is not null as missions_exists,
  to_regclass('public.tbos_behavioral_dimensions') is not null as dimensions_exists,
  to_regclass('public.tbos_teams') is not null as teams_exists,
  to_regclass('public.tbos_mission_dimensions') is not null as mappings_exists,
  to_regclass('public.tbos_dimension_levels') is not null as levels_exists,
  to_regclass('public.tbos_team_members') is not null as team_members_exists,
  to_regclass('public.tbos_facilitator_teams') is not null as assignments_exists,
  to_regclass('public.tbos_observations') is not null as observations_exists,
  to_regclass('public.tbos_observation_scores') is not null as scores_exists,
  to_regclass('public.tbos_observation_audit_log') is not null as audit_exists,
  to_regclass('public.tbos_observation_members') is not null as observation_members_exists,
  to_regclass('public.associates') is not null as associates_preserved,
  to_regclass('public.associate_profiles') is not null as associate_profiles_preserved,
  (
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
  ) as tbos_rpc_count,
  to_regprocedure('public.set_transformation_updated_at()') is not null as accidental_trigger_function_exists;

notify pgrst, 'reload schema';
