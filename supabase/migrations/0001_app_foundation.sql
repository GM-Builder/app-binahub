/*
Step 0 audit note:
Run the Supabase schema audit before applying this migration to an existing
project. If `profiles` or `organizations` already exist, reuse them and keep
only the missing ALTER TABLE statements needed by this platform.

Do not rename or delete any existing BinaInsight tables.
*/

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'client'
    check (role in ('admin', 'facilitator', 'client')),
  organization_id uuid references organizations(id),
  created_at timestamptz default now()
);

alter table profiles
  add column if not exists role text not null default 'client'
    check (role in ('admin', 'facilitator', 'client'));

alter table profiles
  add column if not exists organization_id uuid references organizations(id);

create table if not exists service_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  service_slug text not null,
  status text not null default 'active'
    check (status in ('active', 'locked', 'completed')),
  created_at timestamptz default now(),
  unique (user_id, service_slug)
);

create table if not exists impact_models (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz default now()
);

create table if not exists impact_levels (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references impact_models(id) on delete cascade,
  level_number int not null check (level_number in (1, 2)),
  name text not null,
  unique (model_id, level_number)
);

create table if not exists impact_sections (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references impact_levels(id) on delete cascade,
  name text not null,
  order_index int not null default 0
);

create table if not exists impact_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references impact_sections(id) on delete cascade,
  text text not null,
  question_type text not null default 'scale'
    check (question_type in ('scale', 'text')),
  scale_min int default 1,
  scale_max int default 5,
  order_index int not null default 0
);

create table if not exists impact_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references impact_questions(id) on delete cascade,
  value_numeric numeric,
  value_text text,
  updated_at timestamptz default now(),
  unique (user_id, question_id)
);

create table if not exists impact_section_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  section_id uuid not null references impact_sections(id) on delete cascade,
  score numeric not null,
  calculated_at timestamptz default now(),
  unique (user_id, section_id)
);

create table if not exists impact_level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  level_id uuid not null references impact_levels(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  score numeric,
  completed_at timestamptz,
  unique (user_id, level_id)
);

create table if not exists impact_facilitator_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  model_id uuid not null references impact_models(id) on delete cascade,
  facilitator_id uuid not null references profiles(id),
  notes text,
  score_adjustment numeric,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed')),
  created_at timestamptz default now(),
  reviewed_at timestamptz
);
