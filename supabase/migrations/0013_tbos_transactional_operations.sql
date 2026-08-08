-- Make T-BOS observation submission idempotent and multi-table operations atomic.

begin;

alter table if exists public.tbos_observations
  add column if not exists client_submission_id text;

alter table if exists public.tbos_observations
  drop constraint if exists tbos_observations_client_submission_id_check;
alter table if exists public.tbos_observations
  add constraint tbos_observations_client_submission_id_check check (
    client_submission_id is null
    or (btrim(client_submission_id) <> '' and char_length(client_submission_id) <= 128)
  );

do $$
begin
  if to_regclass('public.tbos_observations') is not null
    and exists (
      select 1 from pg_attribute
      where attrelid = 'public.tbos_observations'::regclass
        and attname = 'profile_id'
        and not attisdropped
    )
    and exists (
      select 1 from pg_attribute
      where attrelid = 'public.tbos_observations'::regclass
        and attname = 'client_submission_id'
        and not attisdropped
    )
  then
    create unique index if not exists tbos_observations_facilitator_submission_unique
      on public.tbos_observations (profile_id, client_submission_id)
      where client_submission_id is not null;
  end if;
end;
$$;

create or replace function public.tbos_submit_observation(
  p_facilitator_id uuid,
  p_team_id uuid,
  p_mission_id uuid,
  p_client_submission_id text,
  p_notes text,
  p_scores jsonb,
  p_is_admin boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_observation_id uuid;
  v_team_batch text;
  v_expected_count integer;
  v_score_count integer;
  v_distinct_count integer;
begin
  if p_facilitator_id is null then
    raise exception using errcode = '22023', message = 'Facilitator is required.';
  end if;

  if p_client_submission_id is null
    or btrim(p_client_submission_id) = ''
    or char_length(p_client_submission_id) > 128
  then
    raise exception using errcode = '22023', message = 'Invalid client submission ID.';
  end if;

  if p_notes is not null and char_length(p_notes) > 50 then
    raise exception using errcode = '22023', message = 'Notes must not exceed 50 characters.';
  end if;

  if jsonb_typeof(p_scores) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Scores must be an array.';
  end if;

  select batch into v_team_batch
  from public.tbos_teams
  where id = p_team_id;

  if not found then
    raise exception using errcode = '23503', message = 'Team not found.';
  end if;

  if not coalesce(p_is_admin, false) and not exists (
    select 1
    from public.tbos_facilitator_teams
    where profile_id = p_facilitator_id and team_id = p_team_id
  ) then
    raise exception using errcode = '42501', message = 'Facilitator is not assigned to this team.';
  end if;

  if not exists (select 1 from public.profiles where id = p_facilitator_id) then
    raise exception using errcode = '23503', message = 'Facilitator profile not found.';
  end if;

  select count(*) into v_expected_count
  from public.tbos_mission_dimensions
  where mission_id = p_mission_id;

  if v_expected_count = 0 then
    raise exception using errcode = '22023', message = 'Mission has no configured dimensions.';
  end if;

  begin
    select count(*), count(distinct (score->>'dimensionId')::uuid)
      into v_score_count, v_distinct_count
    from jsonb_array_elements(p_scores) score
    where jsonb_typeof(score) = 'object'
      and jsonb_typeof(score->'dimensionId') = 'string'
      and jsonb_typeof(score->'levelValue') = 'number'
      and (score->>'levelValue')::numeric = trunc((score->>'levelValue')::numeric)
      and (score->>'levelValue')::integer between 1 and 5;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception using errcode = '22023', message = 'Invalid score value.';
  end;

  if v_score_count <> jsonb_array_length(p_scores)
    or v_score_count <> v_expected_count
    or v_distinct_count <> v_score_count
  then
    raise exception using errcode = '22023', message = 'Scores must contain each mission dimension exactly once.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_scores) score
    left join public.tbos_mission_dimensions md
      on md.mission_id = p_mission_id
      and md.dimension_id = (score->>'dimensionId')::uuid
    left join public.tbos_dimension_levels dl
      on dl.dimension_id = (score->>'dimensionId')::uuid
      and dl.level_value = (score->>'levelValue')::integer
    where md.dimension_id is null or dl.id is null
  ) then
    raise exception using errcode = '22023', message = 'Score dimensions or levels do not match the mission.';
  end if;

  insert into public.tbos_observations (
    team_id, mission_id, profile_id, batch, status, notes, client_submission_id
  ) values (
    p_team_id, p_mission_id, p_facilitator_id, v_team_batch, 'submitted',
    nullif(p_notes, ''), btrim(p_client_submission_id)
  )
  on conflict (profile_id, client_submission_id)
    where client_submission_id is not null
  do nothing
  returning id into v_observation_id;

  if v_observation_id is null then
    select id into v_observation_id
    from public.tbos_observations
    where profile_id = p_facilitator_id
      and client_submission_id = btrim(p_client_submission_id);

    if not exists (
      select 1
      from public.tbos_observations o
      where o.id = v_observation_id
        and o.team_id = p_team_id
        and o.mission_id = p_mission_id
        and coalesce(o.notes, '') = coalesce(nullif(p_notes, ''), '')
        and not exists (
          (select s.dimension_id, s.level_value
           from public.tbos_observation_scores s
           where s.observation_id = o.id)
          except
          (select (score->>'dimensionId')::uuid, (score->>'levelValue')::integer
           from jsonb_array_elements(p_scores) score)
        )
        and not exists (
          (select (score->>'dimensionId')::uuid, (score->>'levelValue')::integer
           from jsonb_array_elements(p_scores) score)
          except
          (select s.dimension_id, s.level_value
           from public.tbos_observation_scores s
           where s.observation_id = o.id)
        )
    ) then
      raise exception using errcode = '22023', message = 'Client submission ID was already used for different data.';
    end if;

    return v_observation_id;
  end if;

  insert into public.tbos_observation_scores (observation_id, dimension_id, level_value)
  select v_observation_id, (score->>'dimensionId')::uuid, (score->>'levelValue')::integer
  from jsonb_array_elements(p_scores) score;

  insert into public.tbos_observation_audit_log (
    observation_id, actor_id, actor_role, action, new_status
  ) values (
    v_observation_id, p_facilitator_id,
    case when p_is_admin then 'admin' else 'facilitator' end,
    'create', 'submitted'
  );

  return v_observation_id;
end;
$$;

create or replace function public.tbos_set_team_captain(
  p_team_id uuid,
  p_member_id uuid,
  p_is_captain boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_is_captain is null then
    raise exception using errcode = '22023', message = 'Captain state is required.';
  end if;

  perform 1 from public.tbos_teams where id = p_team_id for update;
  if not found then
    raise exception using errcode = '23503', message = 'Team not found.';
  end if;

  if not exists (
    select 1 from public.tbos_team_members
    where id = p_member_id and team_id = p_team_id
  ) then
    raise exception using errcode = '23503', message = 'Team member not found.';
  end if;

  if p_is_captain then
    update public.tbos_team_members
    set is_captain = false
    where team_id = p_team_id and is_captain;

    update public.tbos_team_members
    set is_captain = true
    where team_id = p_team_id and id = p_member_id;
  else
    update public.tbos_team_members
    set is_captain = false
    where team_id = p_team_id and id = p_member_id;
  end if;

  return p_member_id;
end;
$$;

revoke all on function public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, boolean)
  from public, anon, authenticated;
revoke all on function public.tbos_set_team_captain(uuid, uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, boolean)
  to service_role;
grant execute on function public.tbos_set_team_captain(uuid, uuid, boolean)
  to service_role;

commit;
