alter table if exists public.facilitator_team_scores
  add column if not exists session_number int not null default 1 check (session_number > 0);

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on public.facilitator_team_scores
  to service_role;

grant select, insert, update
  on public.facilitator_team_scores
  to authenticated;

grant select
  on public.facilitator_team_scores
  to anon;

grant select
  on public.app_client_access_codes
  to anon, authenticated, service_role;
