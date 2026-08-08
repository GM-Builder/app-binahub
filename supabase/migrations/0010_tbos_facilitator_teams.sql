-- ============================================================
-- Migration 0010 — Change facilitator assignment from missions to teams
-- tbos_facilitator_missions → tbos_facilitator_teams
-- ============================================================

-- 1. Create new table tbos_facilitator_teams
create table if not exists tbos_facilitator_teams (
  profile_id uuid not null references profiles(id) on delete cascade,
  team_id uuid not null references tbos_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, team_id)
);

-- 2. Migrate existing data (if any) from tbos_facilitator_missions
-- Note: This assumes facilitators were assigned to missions for specific teams.
-- Since there's no direct mapping, we'll create assignments based on existing observations.
insert into tbos_facilitator_teams (profile_id, team_id)
select distinct fm.profile_id, o.team_id
from tbos_facilitator_missions fm
join tbos_observations o on o.profile_id = fm.profile_id and o.mission_id = fm.mission_id
on conflict do nothing;

-- 3. Drop old table
drop table if exists tbos_facilitator_missions;

-- 4. Enable RLS
alter table tbos_facilitator_teams enable row level security;

-- 5. RLS Policies
create policy "tbos_fac_teams_read_own" on tbos_facilitator_teams
  for select to authenticated using (auth.uid() = profile_id);

create policy "tbos_fac_teams_admin_all" on tbos_facilitator_teams
  for all to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 6. Grant privileges
grant select on tbos_facilitator_teams to authenticated;
grant insert, delete on tbos_facilitator_teams to authenticated;

-- ============================================================
-- Update comments
-- ============================================================
comment on table tbos_facilitator_teams is 'Mapping fasilitator ke tim yang bisa mereka observasi. Fasilitator hanya bisa mengisi observasi untuk tim yang di-assign.';
