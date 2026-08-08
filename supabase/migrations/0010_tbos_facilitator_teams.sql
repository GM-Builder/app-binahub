-- ============================================================
-- Migration 0010 — Change facilitator assignment from missions to teams
-- tbos_facilitator_missions → tbos_facilitator_teams
-- ============================================================

-- 1. Create new table tbos_facilitator_teams (if not exists)
create table if not exists tbos_facilitator_teams (
  profile_id uuid not null references profiles(id) on delete cascade,
  team_id uuid not null references tbos_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, team_id)
);

-- 2. Migrate existing data (only if old table exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'tbos_facilitator_missions') then
    insert into tbos_facilitator_teams (profile_id, team_id)
    select distinct fm.profile_id, o.team_id
    from tbos_facilitator_missions fm
    join tbos_observations o on o.profile_id = fm.profile_id and o.mission_id = fm.mission_id
    on conflict do nothing;

    -- Drop old table after migration
    drop table tbos_facilitator_missions;
  end if;
end $$;

-- 3. Disable RLS (consistent with other T-BOS tables - security enforced at API level)
alter table tbos_facilitator_teams disable row level security;

-- 4. Grant privileges to all roles
grant all on tbos_facilitator_teams to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ============================================================
-- Update comments
-- ============================================================
comment on table tbos_facilitator_teams is 'Mapping fasilitator ke tim yang bisa mereka observasi. Fasilitator hanya bisa mengisi observasi untuk tim yang di-assign.';
