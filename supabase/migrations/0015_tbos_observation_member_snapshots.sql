-- Persist the roster used for each T-BOS observation in the submission transaction.

begin;

create table public.tbos_observation_members (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.tbos_observations(id) on delete cascade,
  team_member_id uuid references public.tbos_team_members(id) on delete set null,
  member_name text not null check (btrim(member_name) <> '' and char_length(member_name) <= 200),
  is_present boolean not null default true,
  is_captain boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tbos_observation_members_observation_idx
  on public.tbos_observation_members (observation_id);
create unique index tbos_observation_members_source_unique
  on public.tbos_observation_members (observation_id, team_member_id)
  where team_member_id is not null;
create unique index tbos_observation_members_one_captain
  on public.tbos_observation_members (observation_id)
  where is_captain;

create trigger tbos_observation_members_set_updated_at
before update on public.tbos_observation_members
for each row execute function public.set_transformation_updated_at();

revoke all on table public.tbos_observation_members from anon, authenticated;
grant all on table public.tbos_observation_members to service_role;
alter table public.tbos_observation_members enable row level security;

create or replace function public.tbos_submit_observation(
  p_facilitator_id uuid,
  p_team_id uuid,
  p_mission_id uuid,
  p_client_submission_id text,
  p_notes text,
  p_scores jsonb,
  p_members jsonb,
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
  v_member_count integer;
  v_present_count integer;
  v_captain_count integer;
  v_present_captain_count integer;
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
  if jsonb_typeof(p_members) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Members must be an array.';
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

  begin
    select
      count(*),
      count(*) filter (where (member->>'isPresent')::boolean),
      count(*) filter (where (member->>'isCaptain')::boolean),
      count(*) filter (where (member->>'isPresent')::boolean and (member->>'isCaptain')::boolean)
    into v_member_count, v_present_count, v_captain_count, v_present_captain_count
    from jsonb_array_elements(p_members) member
    where jsonb_typeof(member) = 'object'
      and jsonb_typeof(member->'memberName') = 'string'
      and btrim(member->>'memberName') <> ''
      and char_length(member->>'memberName') <= 200
      and jsonb_typeof(member->'isPresent') = 'boolean'
      and jsonb_typeof(member->'isCaptain') = 'boolean'
      and (
        not (member ? 'teamMemberId')
        or jsonb_typeof(member->'teamMemberId') = 'null'
        or (jsonb_typeof(member->'teamMemberId') = 'string' and btrim(member->>'teamMemberId') <> '')
      );

    perform nullif(member->>'teamMemberId', '')::uuid
    from jsonb_array_elements(p_members) member
    where member ? 'teamMemberId' and jsonb_typeof(member->'teamMemberId') <> 'null';
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'Invalid team member ID.';
  end;

  if v_member_count <> jsonb_array_length(p_members) or v_member_count = 0 then
    raise exception using errcode = '22023', message = 'Each member must have a valid name, presence, and captain state.';
  end if;
  if v_present_count < 1 then
    raise exception using errcode = '22023', message = 'At least one member must be present.';
  end if;
  if v_captain_count <> 1 or v_present_captain_count <> 1 then
    raise exception using errcode = '22023', message = 'Exactly one present member must be captain.';
  end if;
  if (
    select count(*) <> count(distinct nullif(member->>'teamMemberId', '')::uuid)
    from jsonb_array_elements(p_members) member
    where nullif(member->>'teamMemberId', '') is not null
  ) then
    raise exception using errcode = '22023', message = 'A team member may only appear once.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_members) member
    left join public.tbos_team_members tm
      on tm.id = nullif(member->>'teamMemberId', '')::uuid
      and tm.team_id = p_team_id
    where nullif(member->>'teamMemberId', '') is not null and tm.id is null
  ) then
    raise exception using errcode = '23503', message = 'Roster contains a member from another team or an unknown member.';
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
        and (select count(*) from public.tbos_observation_scores s where s.observation_id = o.id) = jsonb_array_length(p_scores)
        and not exists (
          (select s.dimension_id, s.level_value from public.tbos_observation_scores s where s.observation_id = o.id)
          except
          (select (score->>'dimensionId')::uuid, (score->>'levelValue')::integer from jsonb_array_elements(p_scores) score)
        )
        and not exists (
          (select (score->>'dimensionId')::uuid, (score->>'levelValue')::integer from jsonb_array_elements(p_scores) score)
          except
          (select s.dimension_id, s.level_value from public.tbos_observation_scores s where s.observation_id = o.id)
        )
        and (select count(*) from public.tbos_observation_members m where m.observation_id = o.id) = jsonb_array_length(p_members)
        and not exists (
          (select m.team_member_id, m.member_name, m.is_present, m.is_captain
           from public.tbos_observation_members m where m.observation_id = o.id)
          except
          (select nullif(member->>'teamMemberId', '')::uuid, btrim(member->>'memberName'),
                  (member->>'isPresent')::boolean, (member->>'isCaptain')::boolean
           from jsonb_array_elements(p_members) member)
        )
        and not exists (
          (select nullif(member->>'teamMemberId', '')::uuid, btrim(member->>'memberName'),
                  (member->>'isPresent')::boolean, (member->>'isCaptain')::boolean
           from jsonb_array_elements(p_members) member)
          except
          (select m.team_member_id, m.member_name, m.is_present, m.is_captain
           from public.tbos_observation_members m where m.observation_id = o.id)
        )
    ) then
      raise exception using errcode = '22023', message = 'Client submission ID was already used for different data.';
    end if;

    return v_observation_id;
  end if;

  insert into public.tbos_observation_scores (observation_id, dimension_id, level_value)
  select v_observation_id, (score->>'dimensionId')::uuid, (score->>'levelValue')::integer
  from jsonb_array_elements(p_scores) score;

  insert into public.tbos_observation_members (
    observation_id, team_member_id, member_name, is_present, is_captain
  )
  select v_observation_id, nullif(member->>'teamMemberId', '')::uuid,
    btrim(member->>'memberName'), (member->>'isPresent')::boolean, (member->>'isCaptain')::boolean
  from jsonb_array_elements(p_members) member;

  insert into public.tbos_observation_audit_log (
    observation_id, actor_id, actor_role, action, new_status, changes
  ) values (
    v_observation_id, p_facilitator_id,
    case when p_is_admin then 'admin' else 'facilitator' end,
    'create', 'submitted', jsonb_build_object('memberCount', v_member_count, 'presentCount', v_present_count)
  );

  return v_observation_id;
end;
$$;

revoke all on function public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, jsonb, boolean)
  to service_role;

drop function public.tbos_submit_observation(uuid, uuid, uuid, text, text, jsonb, boolean);

commit;
