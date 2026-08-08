-- ============================================================
-- Migration 0010 — Fix T-BOS RLS Security & Roles Alignment
-- ============================================================

-- 1. Ensure profiles role check constraint includes 'peserta' and 'client'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles drop constraint if exists profiles_role_check1;
alter table profiles add constraint profiles_role_check
  check (role in ('admin', 'facilitator', 'client', 'peserta'));

-- 2. Clean up open RLS policies from migration 0008
drop policy if exists "tbos_teams_select" on tbos_teams;
drop policy if exists "tbos_team_members_select" on tbos_team_members;
drop policy if exists "tbos_fac_missions_select" on tbos_facilitator_missions;
drop policy if exists "tbos_observations_select" on tbos_observations;
drop policy if exists "tbos_observations_insert" on tbos_observations;
drop policy if exists "tbos_observations_update" on tbos_observations;
drop policy if exists "tbos_scores_select" on tbos_observation_scores;
drop policy if exists "tbos_scores_insert" on tbos_observation_scores;
drop policy if exists "tbos_scores_update" on tbos_observation_scores;
drop policy if exists "tbos_audit_select" on tbos_observation_audit_log;
drop policy if exists "tbos_audit_insert" on tbos_observation_audit_log;

-- 3. Secure Read Policies
create policy "tbos_teams_select" on tbos_teams for select to authenticated using (true);
create policy "tbos_team_members_select" on tbos_team_members for select to authenticated using (true);
create policy "tbos_fac_missions_select" on tbos_facilitator_missions for select to authenticated using (
  auth.uid() = profile_id
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Observations: Facilitators see own, admins see all, participants see team's observations
create policy "tbos_observations_select" on tbos_observations for select to authenticated using (
  auth.uid() = profile_id
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  or exists (
    select 1 from tbos_team_members tm
    where tm.team_id = tbos_observations.team_id and tm.profile_id = auth.uid()
  )
);

-- Observations Insert: authenticated user setting self as profile_id
create policy "tbos_observations_insert" on tbos_observations for insert to authenticated with check (
  auth.uid() = profile_id
);

-- Observations Update: owner before revision_deadline, or admin
create policy "tbos_observations_update" on tbos_observations for update to authenticated using (
  (
    auth.uid() = profile_id
    and status = 'submitted'
    and (revision_deadline is null or now() <= revision_deadline)
  )
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Observation Scores: readable by authenticated users
create policy "tbos_scores_select" on tbos_observation_scores for select to authenticated using (true);

-- Observation Scores Insert/Update: owner of parent observation or admin
create policy "tbos_scores_insert" on tbos_observation_scores for insert to authenticated with check (
  exists (
    select 1 from tbos_observations o
    where o.id = observation_id
    and (o.profile_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  )
);

create policy "tbos_scores_update" on tbos_observation_scores for update to authenticated using (
  exists (
    select 1 from tbos_observations o
    where o.id = observation_id
    and (
      (o.profile_id = auth.uid() and o.status = 'submitted' and (o.revision_deadline is null or now() <= o.revision_deadline))
      or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  )
);

-- Audit Log: readable by authenticated, insertable by owner/admin
create policy "tbos_audit_select" on tbos_observation_audit_log for select to authenticated using (true);
create policy "tbos_audit_insert" on tbos_observation_audit_log for insert to authenticated with check (
  auth.uid() = actor_id
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
