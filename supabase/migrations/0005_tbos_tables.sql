-- ============================================================
-- T-BOS (Team Behavioral Observation System)
-- Migration 0005 — tbos_* tables + seed data
-- ============================================================

-- ============================================================
-- 1. MISSIONS
-- ============================================================
create table if not exists tbos_missions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. BEHAVIORAL DIMENSIONS (8 total)
-- ============================================================
create table if not exists tbos_behavioral_dimensions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  question text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. MISSION ↔ DIMENSION MAPPING (many-to-many, 2-4 per mission)
-- ============================================================
create table if not exists tbos_mission_dimensions (
  mission_id uuid not null references tbos_missions(id) on delete cascade,
  dimension_id uuid not null references tbos_behavioral_dimensions(id) on delete cascade,
  primary key (mission_id, dimension_id)
);

-- ============================================================
-- 4. DIMENSION LEVELS (5 levels × 8 dimensions = 40 rows seed)
-- ============================================================
create table if not exists tbos_dimension_levels (
  id uuid primary key default gen_random_uuid(),
  dimension_id uuid not null references tbos_behavioral_dimensions(id) on delete cascade,
  level_value int not null check (level_value in (1, 2, 3, 4, 5)),
  level_label text not null,
  description text not null,
  unique (dimension_id, level_value)
);

-- ============================================================
-- 5. TEAMS
-- ============================================================
create table if not exists tbos_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  batch text not null check (batch in ('Batch 1', 'Batch 2')),
  organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, batch)
);

-- ============================================================
-- 6. TEAM MEMBERS
-- ============================================================
create table if not exists tbos_team_members (
  team_id uuid not null references tbos_teams(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  member_name text,
  primary key (team_id, profile_id)
);

-- ============================================================
-- 7. FACILITATOR ↔ MISSION MAPPING
-- ============================================================
create table if not exists tbos_facilitator_missions (
  profile_id uuid not null references profiles(id) on delete cascade,
  mission_id uuid not null references tbos_missions(id) on delete cascade,
  primary key (profile_id, mission_id)
);

-- ============================================================
-- 8. OBSERVATIONS
-- ============================================================
create table if not exists tbos_observations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references tbos_teams(id) on delete cascade,
  mission_id uuid not null references tbos_missions(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  batch text not null,
  observed_at date not null default current_date,
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'locked')),
  notes text check (length(notes) <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tbos_observations_team_idx on tbos_observations (team_id);
create index if not exists tbos_observations_mission_idx on tbos_observations (mission_id);
create index if not exists tbos_observations_facilitator_idx on tbos_observations (profile_id);
create index if not exists tbos_observations_status_idx on tbos_observations (status);

drop trigger if exists tbos_observations_set_updated_at on tbos_observations;
create trigger tbos_observations_set_updated_at
before update on tbos_observations
for each row execute function public.set_transformation_updated_at();

-- ============================================================
-- 9. OBSERVATION SCORES
-- ============================================================
create table if not exists tbos_observation_scores (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references tbos_observations(id) on delete cascade,
  dimension_id uuid not null references tbos_behavioral_dimensions(id) on delete cascade,
  level_value int not null check (level_value in (1, 2, 3, 4, 5)),
  unique (observation_id, dimension_id)
);

create index if not exists tbos_observation_scores_observation_idx on tbos_observation_scores (observation_id);
create index if not exists tbos_observation_scores_dimension_idx on tbos_observation_scores (dimension_id);

-- ============================================================
-- 10. RLS POLICIES
-- ============================================================
alter table tbos_missions enable row level security;
alter table tbos_behavioral_dimensions enable row level security;
alter table tbos_mission_dimensions enable row level security;
alter table tbos_dimension_levels enable row level security;
alter table tbos_teams enable row level security;
alter table tbos_team_members enable row level security;
alter table tbos_facilitator_missions enable row level security;
alter table tbos_observations enable row level security;
alter table tbos_observation_scores enable row level security;

-- Public read for master data
create policy "tbos_missions_read" on tbos_missions for select using (true);
create policy "tbos_dimensions_read" on tbos_behavioral_dimensions for select using (true);
create policy "tbos_mission_dims_read" on tbos_mission_dimensions for select using (true);
create policy "tbos_levels_read" on tbos_dimension_levels for select using (true);

-- Teams: authenticated can read
create policy "tbos_teams_read" on tbos_teams for select to authenticated using (true);

-- Team members: authenticated can read
create policy "tbos_team_members_read" on tbos_team_members for select to authenticated using (true);

-- Facilitator missions: user can read own mappings
create policy "tbos_fac_missions_read" on tbos_facilitator_missions for select to authenticated using (auth.uid() = profile_id);

-- Observations: facilitator can read own + admin can read all
create policy "tbos_observations_read_own" on tbos_observations for select to authenticated using (auth.uid() = profile_id);
create policy "tbos_observations_insert_own" on tbos_observations for insert to authenticated with check (auth.uid() = profile_id);
create policy "tbos_observations_update_own" on tbos_observations for update to authenticated using (auth.uid() = profile_id);

-- Observation scores: via observation ownership (simplified — service role handles enforcement)
create policy "tbos_scores_read" on tbos_observation_scores for select to authenticated using (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- --- 5 Missions ---
insert into tbos_missions (code, name, description) values
  ('lost_detonator', 'Lost Detonator Mission', 'Tim harus menemukan dan menonaktifkan detonator dengan koordinasi penuh.'),
  ('goldsmith_precision', 'Goldsmith Precision Lab', 'Tim bekerja di lab presisi untuk mengolah bahan baku menjadi emas murni.'),
  ('ore_extraction', 'Ore Extraction Challenge', 'Tim bersaing mengekstraksi bijih dengan efisiensi tertinggi.'),
  ('lean_bridge', 'Lean Bridge Challenge', 'Tim membangun jembatan dengan sumber daya terbatas.'),
  ('x_case', 'X-Case', 'Mission khusus dengan skenario kompleks dan multi-stakeholder.')
on conflict (code) do nothing;

-- --- 8 Behavioral Dimensions ---
insert into tbos_behavioral_dimensions (code, name, question, order_index) values
  ('goal_alignment', 'Goal Alignment', 'Bagaimana tim memulai mission?', 1),
  ('communication', 'Communication', 'Bagaimana komunikasi berlangsung selama mission?', 2),
  ('data_based_decision', 'Data-Based Decision Making', 'Bagaimana keputusan diambil oleh tim?', 3),
  ('execution_discipline', 'Execution Discipline', 'Bagaimana tim menuntaskan pekerjaannya?', 4),
  ('accountability', 'Accountability', 'Bagaimana tim merespons ketika muncul masalah?', 5),
  ('adaptability', 'Adaptability', 'Bagaimana tim merespons perubahan (twist)?', 6),
  ('collaboration', 'Collaboration', 'Bagaimana anggota tim bekerja sama?', 7),
  ('org_ownership', 'Organizational Ownership', 'Bagaimana kepedulian tim terhadap target organisasi?', 8)
on conflict (code) do nothing;

-- --- Mission ↔ Dimension Mapping ---
-- Lost Detonator: Goal Alignment, Communication, Adaptability
insert into tbos_mission_dimensions (mission_id, dimension_id)
select m.id, d.id from tbos_missions m, tbos_behavioral_dimensions d
where m.code = 'lost_detonator' and d.code in ('goal_alignment', 'communication', 'adaptability')
on conflict do nothing;

-- Goldsmith Precision: Communication, Execution Discipline, Accountability
insert into tbos_mission_dimensions (mission_id, dimension_id)
select m.id, d.id from tbos_missions m, tbos_behavioral_dimensions d
where m.code = 'goldsmith_precision' and d.code in ('communication', 'execution_discipline', 'accountability')
on conflict do nothing;

-- Ore Extraction: Communication, Collaboration, Organizational Ownership
insert into tbos_mission_dimensions (mission_id, dimension_id)
select m.id, d.id from tbos_missions m, tbos_behavioral_dimensions d
where m.code = 'ore_extraction' and d.code in ('communication', 'collaboration', 'org_ownership')
on conflict do nothing;

-- Lean Bridge: Goal Alignment, Data-Based Decision Making, Execution Discipline
insert into tbos_mission_dimensions (mission_id, dimension_id)
select m.id, d.id from tbos_missions m, tbos_behavioral_dimensions d
where m.code = 'lean_bridge' and d.code in ('goal_alignment', 'data_based_decision', 'execution_discipline')
on conflict do nothing;

-- X-Case: Communication, Data-Based Decision Making, Accountability, Organizational Ownership
insert into tbos_mission_dimensions (mission_id, dimension_id)
select m.id, d.id from tbos_missions m, tbos_behavioral_dimensions d
where m.code = 'x_case' and d.code in ('communication', 'data_based_decision', 'accountability', 'org_ownership')
on conflict do nothing;

-- --- Dimension Levels (5 × 8 = 40 rows) ---
-- Using a CTE to generate all level descriptions
with dim_levels as (
  select d.id as dimension_id, d.code as dim_code, v.level_value, v.level_label
  from tbos_behavioral_dimensions d
  cross join (values
    (1, 'Reactive'),
    (2, 'Emerging'),
    (3, 'Functional'),
    (4, 'Effective'),
    (5, 'Exemplary')
  ) as v(level_value, level_label)
)
insert into tbos_dimension_levels (dimension_id, level_value, level_label, description)
select
  dl.dimension_id,
  dl.level_value,
  dl.level_label,
  case
    -- Goal Alignment
    when dl.dim_code = 'goal_alignment' and dl.level_value = 1 then 'Langsung bekerja tanpa diskusi.'
    when dl.dim_code = 'goal_alignment' and dl.level_value = 2 then 'Diskusi singkat tetapi belum menghasilkan arah yang jelas.'
    when dl.dim_code = 'goal_alignment' and dl.level_value = 3 then 'Menentukan tujuan bersama sebelum mulai bekerja.'
    when dl.dim_code = 'goal_alignment' and dl.level_value = 4 then 'Menentukan tujuan dan strategi pelaksanaan.'
    when dl.dim_code = 'goal_alignment' and dl.level_value = 5 then 'Menentukan tujuan, strategi, pembagian peran, serta contingency plan.'
    -- Communication
    when dl.dim_code = 'communication' and dl.level_value = 1 then 'Banyak miskomunikasi dan informasi tidak tersampaikan.'
    when dl.dim_code = 'communication' and dl.level_value = 2 then 'Informasi hanya berputar pada beberapa anggota.'
    when dl.dim_code = 'communication' and dl.level_value = 3 then 'Informasi mengalir tetapi belum konsisten.'
    when dl.dim_code = 'communication' and dl.level_value = 4 then 'Komunikasi jelas, dua arah, dan saling memperbarui.'
    when dl.dim_code = 'communication' and dl.level_value = 5 then 'Seluruh anggota aktif berbagi informasi secara real-time.'
    -- Data-Based Decision Making
    when dl.dim_code = 'data_based_decision' and dl.level_value = 1 then 'Keputusan berdasarkan tebakan.'
    when dl.dim_code = 'data_based_decision' and dl.level_value = 2 then 'Keputusan berdasarkan asumsi.'
    when dl.dim_code = 'data_based_decision' and dl.level_value = 3 then 'Sebagian keputusan menggunakan data yang tersedia.'
    when dl.dim_code = 'data_based_decision' and dl.level_value = 4 then 'Mayoritas keputusan menggunakan data dan informasi.'
    when dl.dim_code = 'data_based_decision' and dl.level_value = 5 then 'Semua keputusan dibuat berdasarkan fakta, data, dan evaluasi alternatif.'
    -- Execution Discipline
    when dl.dim_code = 'execution_discipline' and dl.level_value = 1 then 'Banyak pekerjaan tidak selesai.'
    when dl.dim_code = 'execution_discipline' and dl.level_value = 2 then 'Target selesai tetapi terburu-buru.'
    when dl.dim_code = 'execution_discipline' and dl.level_value = 3 then 'Target selesai sesuai ketentuan.'
    when dl.dim_code = 'execution_discipline' and dl.level_value = 4 then 'Target selesai dan dilakukan pengecekan.'
    when dl.dim_code = 'execution_discipline' and dl.level_value = 5 then 'Target selesai, diverifikasi, dan siap digunakan oleh tim/proses berikutnya.'
    -- Accountability
    when dl.dim_code = 'accountability' and dl.level_value = 1 then 'Saling menyalahkan.'
    when dl.dim_code = 'accountability' and dl.level_value = 2 then 'Menunggu arahan fasilitator.'
    when dl.dim_code = 'accountability' and dl.level_value = 3 then 'Bertanggung jawab terhadap tugas masing-masing.'
    when dl.dim_code = 'accountability' and dl.level_value = 4 then 'Bertanggung jawab terhadap hasil tim.'
    when dl.dim_code = 'accountability' and dl.level_value = 5 then 'Proaktif mengambil kepemilikan dan segera menyelesaikan masalah.'
    -- Adaptability
    when dl.dim_code = 'adaptability' and dl.level_value = 1 then 'Bingung dan kehilangan arah.'
    when dl.dim_code = 'adaptability' and dl.level_value = 2 then 'Terlambat menyesuaikan.'
    when dl.dim_code = 'adaptability' and dl.level_value = 3 then 'Menyesuaikan sebagian strategi.'
    when dl.dim_code = 'adaptability' and dl.level_value = 4 then 'Cepat menyusun strategi baru.'
    when dl.dim_code = 'adaptability' and dl.level_value = 5 then 'Langsung beradaptasi tanpa kehilangan momentum kerja.'
    -- Collaboration
    when dl.dim_code = 'collaboration' and dl.level_value = 1 then 'Bekerja sendiri-sendiri.'
    when dl.dim_code = 'collaboration' and dl.level_value = 2 then 'Kerja sama masih terbatas.'
    when dl.dim_code = 'collaboration' and dl.level_value = 3 then 'Bekerja sama ketika diperlukan.'
    when dl.dim_code = 'collaboration' and dl.level_value = 4 then 'Aktif saling membantu selama mission.'
    when dl.dim_code = 'collaboration' and dl.level_value = 5 then 'Kolaborasi sangat solid dan saling melengkapi.'
    -- Organizational Ownership
    when dl.dim_code = 'org_ownership' and dl.level_value = 1 then 'Menunggu mission selesai setelah target tim tercapai.'
    when dl.dim_code = 'org_ownership' and dl.level_value = 2 then 'Fokus pada kemenangan tim sendiri.'
    when dl.dim_code = 'org_ownership' and dl.level_value = 3 then 'Membantu tim lain jika diminta.'
    when dl.dim_code = 'org_ownership' and dl.level_value = 4 then 'Secara aktif menawarkan bantuan kepada tim lain.'
    when dl.dim_code = 'org_ownership' and dl.level_value = 5 then 'Berinisiatif memastikan seluruh tim berhasil mencapai target organisasi.'
  end
from dim_levels dl
on conflict (dimension_id, level_value) do nothing;
