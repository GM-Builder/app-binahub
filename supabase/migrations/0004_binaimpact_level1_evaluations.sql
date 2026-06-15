create table if not exists public.binaimpact_level1_evaluations (
  id uuid primary key default gen_random_uuid(),
  client_access_id uuid references public.app_client_access_codes(id) on delete set null,
  company_name text,
  team_name text,
  organization_name text not null,
  assessment_date date not null,
  email text not null,
  ratings jsonb not null,
  most_important_learning text not null,
  most_interesting_part text not null,
  general_feedback text,
  created_at timestamptz default now()
);

alter table if exists public.binaimpact_level1_evaluations
  add column if not exists participant_name text;

update public.binaimpact_level1_evaluations
set participant_name = coalesce(participant_name, email, 'Peserta')
where participant_name is null;

alter table if exists public.binaimpact_level1_evaluations
  alter column participant_name set not null;

create index if not exists binaimpact_level1_client_idx
  on public.binaimpact_level1_evaluations (client_access_id);

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on public.binaimpact_level1_evaluations
  to service_role;

grant insert
  on public.binaimpact_level1_evaluations
  to anon, authenticated;
