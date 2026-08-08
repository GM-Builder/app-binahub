-- Reconcile the complete T-BOS schema for clean and partially provisioned databases.
-- This migration is intentionally self-contained so it can also be run directly
-- from the Supabase SQL editor when the historical T-BOS migrations did not finish.

begin;

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'peserta',
  organization_id uuid references public.organizations(id),
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text not null default 'peserta';
alter table public.profiles add column if not exists organization_id uuid references public.organizations(id);
alter table public.profiles add column if not exists created_at timestamptz default now();

create or replace function public.set_transformation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tbos_missions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tbos_behavioral_dimensions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  question text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tbos_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  batch text not null check (batch in ('Batch 1', 'Batch 2')),
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, batch)
);

create table if not exists public.tbos_mission_dimensions (
  mission_id uuid not null references public.tbos_missions(id) on delete cascade,
  dimension_id uuid not null references public.tbos_behavioral_dimensions(id) on delete cascade,
  primary key (mission_id, dimension_id)
);

create table if not exists public.tbos_dimension_levels (
  id uuid primary key default gen_random_uuid(),
  dimension_id uuid not null references public.tbos_behavioral_dimensions(id) on delete cascade,
  level_value integer not null check (level_value between 1 and 5),
  level_label text not null,
  description text not null,
  unique (dimension_id, level_value)
);

-- A surrogate key permits field-entered members without a Supabase account.
create table if not exists public.tbos_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.tbos_teams(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  member_name text not null,
  is_captain boolean not null default false,
  created_at timestamptz not null default now()
);

-- Repair the original composite-PK variant if it already exists.
alter table public.tbos_team_members add column if not exists id uuid default gen_random_uuid();
alter table public.tbos_team_members add column if not exists is_captain boolean not null default false;
alter table public.tbos_team_members add column if not exists created_at timestamptz not null default now();
update public.tbos_team_members set id = gen_random_uuid() where id is null;
alter table public.tbos_team_members alter column id set not null;
update public.tbos_team_members
set member_name = 'Anggota ' || left(id::text, 8)
where member_name is null or btrim(member_name) = '';
alter table public.tbos_team_members alter column member_name set not null;

do $$
declare
  pk_name text;
begin
  select c.conname into pk_name
  from pg_constraint c
  where c.conrelid = 'public.tbos_team_members'::regclass and c.contype = 'p';

  if pk_name is not null and pk_name <> 'tbos_team_members_pkey' then
    execute format('alter table public.tbos_team_members drop constraint %I', pk_name);
    pk_name := null;
  elsif pk_name = 'tbos_team_members_pkey' and exists (
    select 1
    from pg_constraint c
    join unnest(c.conkey) with ordinality k(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.conrelid = 'public.tbos_team_members'::regclass
      and c.contype = 'p'
      and a.attname <> 'id'
  ) then
    alter table public.tbos_team_members drop constraint tbos_team_members_pkey;
    pk_name := null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tbos_team_members'::regclass and contype = 'p'
  ) then
    alter table public.tbos_team_members alter column profile_id drop not null;
    alter table public.tbos_team_members add constraint tbos_team_members_pkey primary key (id);
  end if;
end;
$$;

alter table public.tbos_team_members alter column profile_id drop not null;

create unique index if not exists tbos_team_members_profile_unique
  on public.tbos_team_members (team_id, profile_id) where profile_id is not null;

-- Keep at most one existing captain before installing the invariant.
with ranked as (
  select id, row_number() over (partition by team_id order by created_at, id) as position
  from public.tbos_team_members where is_captain
)
update public.tbos_team_members tm set is_captain = false
from ranked r where tm.id = r.id and r.position > 1;

create unique index if not exists tbos_team_members_one_captain
  on public.tbos_team_members (team_id) where is_captain;

create table if not exists public.tbos_facilitator_teams (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid not null references public.tbos_teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, team_id)
);

create table if not exists public.tbos_observations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.tbos_teams(id) on delete cascade,
  mission_id uuid not null references public.tbos_missions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  batch text not null check (batch in ('Batch 1', 'Batch 2')),
  observed_at date not null default current_date,
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'locked')),
  notes text check (char_length(notes) <= 50),
  locked_at timestamptz,
  locked_by uuid references public.profiles(id) on delete set null,
  revision_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tbos_observations add column if not exists locked_at timestamptz;
alter table public.tbos_observations add column if not exists locked_by uuid references public.profiles(id) on delete set null;
alter table public.tbos_observations add column if not exists revision_deadline timestamptz;

create table if not exists public.tbos_observation_scores (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.tbos_observations(id) on delete cascade,
  dimension_id uuid not null references public.tbos_behavioral_dimensions(id) on delete cascade,
  level_value integer not null check (level_value between 1 and 5),
  unique (observation_id, dimension_id)
);

create table if not exists public.tbos_observation_audit_log (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.tbos_observations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text not null default 'facilitator' check (actor_role in ('facilitator', 'admin', 'system')),
  action text not null check (action in ('create', 'submit', 'edit', 'lock', 'unlock', 'delete')),
  previous_status text,
  new_status text,
  changes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tbos_observations_team_idx on public.tbos_observations(team_id);
create index if not exists tbos_observations_mission_idx on public.tbos_observations(mission_id);
create index if not exists tbos_observations_facilitator_idx on public.tbos_observations(profile_id);
create index if not exists tbos_observation_scores_observation_idx on public.tbos_observation_scores(observation_id);
create index if not exists tbos_audit_log_observation_idx on public.tbos_observation_audit_log(observation_id);

drop trigger if exists tbos_observations_set_updated_at on public.tbos_observations;
create trigger tbos_observations_set_updated_at before update on public.tbos_observations
for each row execute function public.set_transformation_updated_at();

create or replace function public.tbos_set_revision_deadline()
returns trigger language plpgsql as $$
begin
  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status = 'draft') then
    new.revision_deadline = (new.observed_at::timestamp + interval '1 day 23:59:59') at time zone 'Asia/Jakarta';
  end if;
  return new;
end;
$$;

drop trigger if exists tbos_observations_revision_trigger on public.tbos_observations;
create trigger tbos_observations_revision_trigger before insert or update on public.tbos_observations
for each row execute function public.tbos_set_revision_deadline();

insert into public.tbos_missions (code, name, description) values
  ('lost_detonator', 'Lost Detonator Mission', 'Tim menemukan dan menonaktifkan detonator dengan koordinasi penuh.'),
  ('goldsmith_precision', 'Goldsmith Precision Lab', 'Tim mengolah bahan baku menjadi emas dengan kerja presisi.'),
  ('ore_extraction', 'Ore Extraction Challenge', 'Tim mengekstraksi bijih dengan efisiensi terbaik.'),
  ('lean_bridge', 'Lean Bridge Challenge', 'Tim membangun jembatan dengan sumber daya terbatas.'),
  ('x_case', 'X-Case', 'Skenario kompleks dengan banyak pemangku kepentingan.')
on conflict (code) do update set name = excluded.name, description = excluded.description;

insert into public.tbos_behavioral_dimensions (code, name, question, order_index) values
  ('goal_alignment', 'Goal Alignment', 'Bagaimana tim memulai misi?', 1),
  ('communication', 'Communication', 'Bagaimana komunikasi berlangsung selama misi?', 2),
  ('data_based_decision', 'Data-Based Decision Making', 'Bagaimana keputusan diambil oleh tim?', 3),
  ('execution_discipline', 'Execution Discipline', 'Bagaimana tim menuntaskan pekerjaannya?', 4),
  ('accountability', 'Accountability', 'Bagaimana tim merespons ketika muncul masalah?', 5),
  ('adaptability', 'Adaptability', 'Bagaimana tim merespons perubahan?', 6),
  ('collaboration', 'Collaboration', 'Bagaimana anggota tim bekerja sama?', 7),
  ('org_ownership', 'Organizational Ownership', 'Bagaimana kepedulian tim terhadap target organisasi?', 8)
on conflict (code) do update set name = excluded.name, question = excluded.question, order_index = excluded.order_index;

insert into public.tbos_mission_dimensions (mission_id, dimension_id)
select m.id, d.id from public.tbos_missions m cross join public.tbos_behavioral_dimensions d
where (m.code = 'lost_detonator' and d.code in ('goal_alignment', 'communication', 'adaptability'))
   or (m.code = 'goldsmith_precision' and d.code in ('communication', 'execution_discipline', 'accountability'))
   or (m.code = 'ore_extraction' and d.code in ('communication', 'collaboration', 'org_ownership'))
   or (m.code = 'lean_bridge' and d.code in ('goal_alignment', 'data_based_decision', 'execution_discipline'))
   or (m.code = 'x_case' and d.code in ('communication', 'data_based_decision', 'accountability', 'org_ownership'))
on conflict do nothing;

with labels(level_value, level_label) as (
  values (1, 'Reactive'), (2, 'Emerging'), (3, 'Functional'), (4, 'Effective'), (5, 'Exemplary')
)
insert into public.tbos_dimension_levels (dimension_id, level_value, level_label, description)
select d.id, l.level_value, l.level_label,
  case l.level_value
    when 1 then 'Perilaku masih reaktif dan membutuhkan arahan.'
    when 2 then 'Perilaku mulai muncul tetapi belum konsisten.'
    when 3 then 'Perilaku sudah berfungsi dalam situasi normal.'
    when 4 then 'Perilaku efektif, konsisten, dan mendukung hasil tim.'
    when 5 then 'Perilaku menjadi teladan dan memperkuat tim lain.'
  end
from public.tbos_behavioral_dimensions d cross join labels l
on conflict (dimension_id, level_value) do nothing;

-- The backend uses service_role for all operational T-BOS access.
revoke all on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists "profiles_update_all" on public.profiles;
drop policy if exists "profiles_insert_all" on public.profiles;

revoke all on table public.tbos_missions, public.tbos_behavioral_dimensions,
  public.tbos_mission_dimensions, public.tbos_dimension_levels, public.tbos_teams,
  public.tbos_team_members, public.tbos_facilitator_teams, public.tbos_observations,
  public.tbos_observation_scores, public.tbos_observation_audit_log from anon, authenticated;
grant all on table public.tbos_missions, public.tbos_behavioral_dimensions,
  public.tbos_mission_dimensions, public.tbos_dimension_levels, public.tbos_teams,
  public.tbos_team_members, public.tbos_facilitator_teams, public.tbos_observations,
  public.tbos_observation_scores, public.tbos_observation_audit_log to service_role;

alter table public.tbos_missions enable row level security;
alter table public.tbos_behavioral_dimensions enable row level security;
alter table public.tbos_mission_dimensions enable row level security;
alter table public.tbos_dimension_levels enable row level security;
alter table public.tbos_teams enable row level security;
alter table public.tbos_team_members enable row level security;
alter table public.tbos_facilitator_teams enable row level security;
alter table public.tbos_observations enable row level security;
alter table public.tbos_observation_scores enable row level security;
alter table public.tbos_observation_audit_log enable row level security;

commit;
