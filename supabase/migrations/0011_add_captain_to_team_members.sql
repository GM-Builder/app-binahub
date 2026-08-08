-- ============================================================
-- Migration 0011 — Add is_captain flag to tbos_team_members
-- Facilitator can mark one member as team captain
-- ============================================================

-- 1. Add is_captain column
alter table tbos_team_members
add column if not exists is_captain boolean not null default false;

-- 2. Create index for quick captain lookup
create index if not exists tbos_team_members_captain_idx
on tbos_team_members (team_id, is_captain) where is_captain = true;

-- 3. Ensure only one captain per team (optional constraint)
-- This uses a partial unique index
create unique index if not exists tbos_team_members_one_captain
on tbos_team_members (team_id) where is_captain = true;

-- 4. Grant privileges
grant all on tbos_team_members to anon, authenticated, service_role;

-- 5. Update comment
comment on column tbos_team_members.is_captain is 'Menandai anggota sebagai captain/ketua tim. Hanya boleh ada 1 captain per tim.';
