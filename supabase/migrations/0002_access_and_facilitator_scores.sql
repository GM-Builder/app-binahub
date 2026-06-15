create extension if not exists "pgcrypto";

create table if not exists app_client_access_codes (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  team_name text,
  code_hash text unique not null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists facilitator_team_scores (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  team_name text not null,
  game_name text not null,
  session_count int not null check (session_count > 0),
  assessment_date date not null,
  facilitator_name text not null,
  facilitator_email text not null,
  scores jsonb not null,
  total_score int not null default 0,
  created_at timestamptz default now()
);

create index if not exists facilitator_team_scores_company_idx
  on facilitator_team_scores (company_name);

create index if not exists facilitator_team_scores_team_idx
  on facilitator_team_scores (team_name);

insert into app_client_access_codes (company_name, team_name, code_hash)
values
  ('PT Masmindo Dwi Area', 'Tim A', encode(digest('MASMINDO-A', 'sha256'), 'hex')),
  ('PT Masmindo Dwi Area', 'Tim B', encode(digest('MASMINDO-B', 'sha256'), 'hex')),
  ('PT Masmindo Dwi Area', 'Tim C', encode(digest('MASMINDO-C', 'sha256'), 'hex'))
on conflict (code_hash) do nothing;
