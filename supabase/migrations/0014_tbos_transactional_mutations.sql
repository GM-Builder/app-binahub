-- Make observation edit/lock/unlock and their audit records atomic.

begin;

create or replace function public.tbos_mutate_observation(
  p_observation_id uuid,
  p_actor_id uuid,
  p_actor_role text,
  p_action text,
  p_notes text default null,
  p_scores jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_observation public.tbos_observations%rowtype;
  v_required_count integer;
  v_score_count integer;
  v_distinct_count integer;
begin
  if p_actor_role not in ('admin', 'facilitator') then
    raise exception using errcode = '42501', message = 'Invalid actor role.';
  end if;
  if p_action not in ('edit', 'lock', 'unlock') then
    raise exception using errcode = '22023', message = 'Invalid observation action.';
  end if;

  select * into v_observation
  from public.tbos_observations
  where id = p_observation_id
  for update;

  if not found then
    raise exception using errcode = '23503', message = 'Observation not found.';
  end if;

  if p_action in ('lock', 'unlock') and p_actor_role <> 'admin' then
    raise exception using errcode = '42501', message = 'Only admins may change the lock state.';
  end if;

  if p_action = 'lock' then
    if v_observation.status = 'locked' then
      raise exception using errcode = '23505', message = 'Observation is already locked.';
    end if;

    update public.tbos_observations
    set status = 'locked', locked_at = now(), locked_by = p_actor_id
    where id = p_observation_id;

    insert into public.tbos_observation_audit_log (
      observation_id, actor_id, actor_role, action, previous_status, new_status
    ) values (
      p_observation_id, p_actor_id, 'admin', 'lock', v_observation.status, 'locked'
    );
    return;
  end if;

  if p_action = 'unlock' then
    if v_observation.status <> 'locked' then
      raise exception using errcode = '23505', message = 'Observation is not locked.';
    end if;

    update public.tbos_observations
    set status = 'submitted', locked_at = null, locked_by = null
    where id = p_observation_id;

    insert into public.tbos_observation_audit_log (
      observation_id, actor_id, actor_role, action, previous_status, new_status
    ) values (
      p_observation_id, p_actor_id, 'admin', 'unlock', 'locked', 'submitted'
    );
    return;
  end if;

  if p_actor_role <> 'admin' and v_observation.profile_id <> p_actor_id then
    raise exception using errcode = '42501', message = 'Observation is owned by another facilitator.';
  end if;
  if v_observation.status = 'locked' then
    raise exception using errcode = '55000', message = 'Observation is locked.';
  end if;
  if p_actor_role <> 'admin'
    and v_observation.revision_deadline is not null
    and now() > v_observation.revision_deadline
  then
    raise exception using errcode = '42501', message = 'Revision window has ended.';
  end if;
  if p_notes is not null and char_length(p_notes) > 50 then
    raise exception using errcode = '22023', message = 'Notes must not exceed 50 characters.';
  end if;

  if p_scores is not null then
    if jsonb_typeof(p_scores) is distinct from 'array' then
      raise exception using errcode = '22023', message = 'Scores must be an array.';
    end if;

    select count(*) into v_required_count
    from public.tbos_mission_dimensions
    where mission_id = v_observation.mission_id;

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
      or v_score_count <> v_required_count
      or v_distinct_count <> v_score_count
      or exists (
        select 1
        from jsonb_array_elements(p_scores) score
        left join public.tbos_mission_dimensions md
          on md.mission_id = v_observation.mission_id
          and md.dimension_id = (score->>'dimensionId')::uuid
        left join public.tbos_dimension_levels dl
          on dl.dimension_id = (score->>'dimensionId')::uuid
          and dl.level_value = (score->>'levelValue')::integer
        where md.dimension_id is null or dl.id is null
      )
    then
      raise exception using errcode = '22023', message = 'Scores do not match the mission.';
    end if;

    delete from public.tbos_observation_scores where observation_id = p_observation_id;
    insert into public.tbos_observation_scores (observation_id, dimension_id, level_value)
    select p_observation_id, (score->>'dimensionId')::uuid, (score->>'levelValue')::integer
    from jsonb_array_elements(p_scores) score;
  end if;

  if p_notes is not null then
    update public.tbos_observations
    set notes = nullif(p_notes, '')
    where id = p_observation_id;
  end if;

  insert into public.tbos_observation_audit_log (
    observation_id, actor_id, actor_role, action, previous_status, new_status, changes
  ) values (
    p_observation_id, p_actor_id, p_actor_role, 'edit', v_observation.status,
    v_observation.status,
    jsonb_build_object('notesChanged', p_notes is not null, 'scoresChanged', p_scores is not null)
  );
end;
$$;

revoke all on function public.tbos_mutate_observation(uuid, uuid, text, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.tbos_mutate_observation(uuid, uuid, text, text, text, jsonb)
to service_role;

commit;
