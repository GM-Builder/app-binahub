-- Run after all T-BOS migrations. This returns one complete result set.
select
  to_regclass('public.tbos_missions') is not null as missions_table,
  to_regclass('public.tbos_behavioral_dimensions') is not null as dimensions_table,
  to_regclass('public.tbos_dimension_levels') is not null as levels_table,
  to_regclass('public.tbos_teams') is not null as teams_table,
  to_regclass('public.tbos_team_members') is not null as team_members_table,
  to_regclass('public.tbos_facilitator_teams') is not null as facilitator_teams_table,
  to_regclass('public.tbos_observations') is not null as observations_table,
  to_regclass('public.tbos_observation_scores') is not null as scores_table,
  to_regclass('public.tbos_observation_audit_log') is not null as audit_table,
  to_regclass('public.tbos_observation_members') is not null as observation_members_table,
  (select count(*) from public.tbos_missions) as missions,
  (select count(*) from public.tbos_behavioral_dimensions) as dimensions,
  (select count(*) from public.tbos_dimension_levels) as levels,
  (select count(*) from public.tbos_mission_dimensions) as mission_dimension_mappings,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tbos_team_members' and column_name = 'id'
  ) as member_id_ready,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tbos_team_members' and column_name = 'is_captain'
  ) as captain_column_ready,
  (select count(*) from public.tbos_facilitator_teams) as facilitator_team_assignments,
  (select count(*) from public.tbos_observation_members) as observation_member_snapshots,
  (select relrowsecurity from pg_class where oid = 'public.tbos_observation_members'::regclass) as observation_members_rls_enabled,
  has_table_privilege('service_role', 'public.tbos_observation_members', 'SELECT,INSERT,UPDATE,DELETE') as observation_members_service_role_ready,
  not has_table_privilege('authenticated', 'public.tbos_observation_members', 'SELECT') as observation_members_authenticated_blocked,
  has_function_privilege('service_role', 'public.tbos_submit_observation(uuid,uuid,uuid,text,text,jsonb,jsonb,boolean)', 'EXECUTE') as submit_rpc_ready,
  has_function_privilege('service_role', 'public.tbos_set_team_captain(uuid,uuid,boolean)', 'EXECUTE') as captain_rpc_ready,
  has_function_privilege('service_role', 'public.tbos_mutate_observation(uuid,uuid,text,text,text,jsonb)', 'EXECUTE') as mutation_rpc_ready;
