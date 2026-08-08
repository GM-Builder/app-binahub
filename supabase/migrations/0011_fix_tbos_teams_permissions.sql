-- ============================================================
-- Migration 0011 — Fix Permissive Select on tbos_teams & profiles
-- ============================================================

-- 1. Grant table access to all standard roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- 2. Permissive select policies on tbos_teams
drop policy if exists "tbos_teams_select" on tbos_teams;
drop policy if exists "tbos_teams_read" on tbos_teams;
create policy "tbos_teams_select" on tbos_teams for select using (true);
create policy "tbos_teams_insert" on tbos_teams for insert with check (true);
create policy "tbos_teams_update" on tbos_teams for update using (true);

-- 3. Permissive select on profiles for admin user listing
drop policy if exists "profiles_select_all" on profiles;
drop policy if exists "profiles_read" on profiles;
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_all" on profiles for update using (true);
create policy "profiles_insert_all" on profiles for insert with check (true);

-- 4. Permissive select on team members
drop policy if exists "tbos_team_members_select" on tbos_team_members;
create policy "tbos_team_members_select" on tbos_team_members for select using (true);
create policy "tbos_team_members_insert" on tbos_team_members for insert with check (true);

-- 5. Permissive select on facilitator missions
drop policy if exists "tbos_fac_missions_select" on tbos_facilitator_missions;
create policy "tbos_fac_missions_select" on tbos_facilitator_missions for select using (true);
