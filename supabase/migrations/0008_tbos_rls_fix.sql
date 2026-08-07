-- ============================================================
-- Migration 0008 — Fix RLS: add anon select policies for T-BOS tables
-- Fix: "permission denied for table tbos_teams" when service role key not configured
-- ============================================================

-- Drop existing restrictive policies and add permissive ones
drop policy if exists "tbos_teams_read" on tbos_teams;
create policy "tbos_teams_select" on tbos_teams for select using (true);

drop policy if exists "tbos_team_members_read" on tbos_team_members;
create policy "tbos_team_members_select" on tbos_team_members for select using (true);

drop policy if exists "tbos_fac_missions_read" on tbos_facilitator_missions;
create policy "tbos_fac_missions_select" on tbos_facilitator_missions for select using (true);

drop policy if exists "tbos_observations_read_own" on tbos_observations;
create policy "tbos_observations_select" on tbos_observations for select using (true);
drop policy if exists "tbos_observations_insert_own" on tbos_observations;
create policy "tbos_observations_insert" on tbos_observations for insert with check (true);
drop policy if exists "tbos_observations_update_own" on tbos_observations;
create policy "tbos_observations_update" on tbos_observations for update using (true);

drop policy if exists "tbos_scores_read" on tbos_observation_scores;
create policy "tbos_scores_select" on tbos_observation_scores for select using (true);
create policy "tbos_scores_insert" on tbos_observation_scores for insert with check (true);
create policy "tbos_scores_update" on tbos_observation_scores for update using (true);

drop policy if exists "tbos_audit_read" on tbos_observation_audit_log;
create policy "tbos_audit_select" on tbos_observation_audit_log for select using (true);
create policy "tbos_audit_insert" on tbos_observation_audit_log for insert with check (true);
