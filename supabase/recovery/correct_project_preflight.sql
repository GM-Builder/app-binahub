-- CORRECT PROJECT: run before 0012 to prove this is the database used by the
-- production T-BOS API. This query is read-only.

select jsonb_build_object(
  'database_name', current_database(),
  'known_production_team_id', 'df9f0d76-9be4-4c87-a447-62d05de5965b',
  'known_production_team_exists', exists (
    select 1
    from public.tbos_teams
    where id = 'df9f0d76-9be4-4c87-a447-62d05de5965b'::uuid
  ),
  'team_count', (select count(*) from public.tbos_teams),
  'assignment_count', case
    when to_regclass('public.tbos_facilitator_teams') is null then null
    else (xpath(
      '//row/count/text()',
      query_to_xml(
        'select count(*) as count from public.tbos_facilitator_teams',
        false,
        true,
        ''
      )
    ))[1]::text::bigint
  end,
  'member_id_exists', exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbos_team_members'
      and column_name = 'id'
  ),
  'member_captain_exists', exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbos_team_members'
      and column_name = 'is_captain'
  ),
  'observation_members_exists',
    to_regclass('public.tbos_observation_members') is not null,
  'client_submission_id_exists', exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tbos_observations'
      and column_name = 'client_submission_id'
  )
) as correct_project_preflight;
