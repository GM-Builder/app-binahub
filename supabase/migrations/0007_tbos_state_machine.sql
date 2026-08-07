-- ============================================================
-- Migration 0007 — T-BOS State Machine + Audit Log
-- Source: STATE-MACHINE.md
-- ============================================================

-- ============================================================
-- 1. Observation Audit Log
-- ============================================================
create table if not exists tbos_observation_audit_log (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references tbos_observations(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  actor_role text not null default 'facilitator'
    check (actor_role in ('facilitator', 'admin', 'system')),
  action text not null
    check (action in ('create', 'submit', 'edit', 'lock', 'unlock', 'delete')),
  previous_status text,
  new_status text,
  changes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tbos_audit_log_observation_idx on tbos_observation_audit_log (observation_id);
create index if not exists tbos_audit_log_created_idx on tbos_observation_audit_log (created_at desc);

alter table tbos_observation_audit_log enable row level security;
drop policy if exists "tbos_audit_read" on tbos_observation_audit_log;
create policy "tbos_audit_read" on tbos_observation_audit_log for select to authenticated using (true);

-- ============================================================
-- 2. Add revision window fields to observations
-- ============================================================
alter table tbos_observations add column if not exists locked_at timestamptz;
alter table tbos_observations add column if not exists locked_by uuid references profiles(id) on delete set null;
alter table tbos_observations add column if not exists revision_deadline timestamptz;

-- ============================================================
-- 3. Trigger: auto-set revision_deadline on insert (submitted) or update (draft→submitted)
--    Facilitators can edit until end of the observed date + 1 day (23:59 Jakarta time)
-- ============================================================
create or replace function tbos_set_revision_deadline()
returns trigger
language plpgsql
as $$
begin
  -- Fire on INSERT when status is submitted
  if tg_op = 'INSERT' and new.status = 'submitted' then
    new.revision_deadline = (new.observed_at::timestamp + interval '1 day 23:59:59') at time zone 'Asia/Jakarta';
  end if;
  -- Fire on UPDATE when transitioning from draft to submitted
  if tg_op = 'UPDATE' and new.status = 'submitted' and old.status = 'draft' then
    new.revision_deadline = (new.observed_at::timestamp + interval '1 day 23:59:59') at time zone 'Asia/Jakarta';
  end if;
  return new;
end;
$$;

drop trigger if exists tbos_observations_revision_trigger on tbos_observations;
create trigger tbos_observations_revision_trigger
before insert or update on tbos_observations
for each row execute function tbos_set_revision_deadline();

-- ============================================================
-- 4. RLS: admin can lock/unlock (update any observation)
-- ============================================================
drop policy if exists "tbos_observations_update_own" on tbos_observations;
create policy "tbos_observations_update_own" on tbos_observations
  for update to authenticated
  using (
    auth.uid() = profile_id
    or exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 5. Seed: audit log entry for existing observations
-- ============================================================
insert into tbos_observation_audit_log (observation_id, actor_id, actor_role, action, new_status)
select o.id, o.profile_id, 'facilitator', 'create', o.status
from tbos_observations o
where not exists (
  select 1 from tbos_observation_audit_log al where al.observation_id = o.id
);
