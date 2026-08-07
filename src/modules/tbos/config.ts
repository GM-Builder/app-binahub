// T-BOS Mission Configuration
// Source: T-BOS_PRD_v1.md §4.2 — Mapping Mission vs Behavioral Dimensions

export type MissionCode =
  | "lost_detonator"
  | "goldsmith_precision"
  | "ore_extraction"
  | "lean_bridge"
  | "x_case";

export type DimensionCode =
  | "goal_alignment"
  | "communication"
  | "data_based_decision"
  | "execution_discipline"
  | "accountability"
  | "adaptability"
  | "collaboration"
  | "org_ownership";

export type LevelValue = 1 | 2 | 3 | 4 | 5;

export type LevelLabel = "Reactive" | "Emerging" | "Functional" | "Effective" | "Exemplary";

export interface MissionConfig {
  code: MissionCode;
  name: string;
  description: string;
  dimensions: DimensionCode[];
}

export interface DimensionConfig {
  code: DimensionCode;
  name: string;
  question: string;
  orderIndex: number;
}

export interface DimensionLevelConfig {
  levelValue: LevelValue;
  levelLabel: LevelLabel;
  description: string;
}

export const MISSIONS: Record<MissionCode, MissionConfig> = {
  lost_detonator: {
    code: "lost_detonator",
    name: "Lost Detonator Mission",
    description: "Tim harus menemukan dan menonaktifkan detonator dengan koordinasi penuh.",
    dimensions: ["goal_alignment", "communication", "adaptability"],
  },
  goldsmith_precision: {
    code: "goldsmith_precision",
    name: "Goldsmith Precision Lab",
    description: "Tim bekerja di lab presisi untuk mengolah bahan baku menjadi emas murni.",
    dimensions: ["communication", "execution_discipline", "accountability"],
  },
  ore_extraction: {
    code: "ore_extraction",
    name: "Ore Extraction Challenge",
    description: "Tim bersaing mengekstraksi bijih dengan efisiensi tertinggi.",
    dimensions: ["communication", "collaboration", "org_ownership"],
  },
  lean_bridge: {
    code: "lean_bridge",
    name: "Lean Bridge Challenge",
    description: "Tim membangun jembatan dengan sumber daya terbatas.",
    dimensions: ["goal_alignment", "data_based_decision", "execution_discipline"],
  },
  x_case: {
    code: "x_case",
    name: "X-Case",
    description: "Mission khusus dengan skenario kompleks dan multi-stakeholder.",
    dimensions: ["communication", "data_based_decision", "accountability", "org_ownership"],
  },
};

export const MISSION_LIST: MissionConfig[] = Object.values(MISSIONS);

export const DIMENSIONS: Record<DimensionCode, DimensionConfig> = {
  goal_alignment: {
    code: "goal_alignment",
    name: "Goal Alignment",
    question: "Bagaimana tim memulai mission?",
    orderIndex: 1,
  },
  communication: {
    code: "communication",
    name: "Communication",
    question: "Bagaimana komunikasi berlangsung selama mission?",
    orderIndex: 2,
  },
  data_based_decision: {
    code: "data_based_decision",
    name: "Data-Based Decision Making",
    question: "Bagaimana keputusan diambil oleh tim?",
    orderIndex: 3,
  },
  execution_discipline: {
    code: "execution_discipline",
    name: "Execution Discipline",
    question: "Bagaimana tim menuntaskan pekerjaannya?",
    orderIndex: 4,
  },
  accountability: {
    code: "accountability",
    name: "Accountability",
    question: "Bagaimana tim merespons ketika muncul masalah?",
    orderIndex: 5,
  },
  adaptability: {
    code: "adaptability",
    name: "Adaptability",
    question: "Bagaimana tim merespons perubahan (twist)?",
    orderIndex: 6,
  },
  collaboration: {
    code: "collaboration",
    name: "Collaboration",
    question: "Bagaimana anggota tim bekerja sama?",
    orderIndex: 7,
  },
  org_ownership: {
    code: "org_ownership",
    name: "Organizational Ownership",
    question: "Bagaimana kepedulian tim terhadap target organisasi?",
    orderIndex: 8,
  },
};

export const DIMENSION_LIST: DimensionConfig[] = Object.values(DIMENSIONS).sort(
  (a, b) => a.orderIndex - b.orderIndex
);

export const LEVEL_LABELS: Record<LevelValue, LevelLabel> = {
  1: "Reactive",
  2: "Emerging",
  3: "Functional",
  4: "Effective",
  5: "Exemplary",
};

export const LEVEL_VALUES: LevelValue[] = [1, 2, 3, 4, 5];

export const DIMENSION_LEVELS: Record<DimensionCode, DimensionLevelConfig[]> = {
  goal_alignment: [
    { levelValue: 1, levelLabel: "Reactive", description: "Langsung bekerja tanpa diskusi." },
    { levelValue: 2, levelLabel: "Emerging", description: "Diskusi singkat tetapi belum menghasilkan arah yang jelas." },
    { levelValue: 3, levelLabel: "Functional", description: "Menentukan tujuan bersama sebelum mulai bekerja." },
    { levelValue: 4, levelLabel: "Effective", description: "Menentukan tujuan dan strategi pelaksanaan." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Menentukan tujuan, strategi, pembagian peran, serta contingency plan." },
  ],
  communication: [
    { levelValue: 1, levelLabel: "Reactive", description: "Banyak miskomunikasi dan informasi tidak tersampaikan." },
    { levelValue: 2, levelLabel: "Emerging", description: "Informasi hanya berputar pada beberapa anggota." },
    { levelValue: 3, levelLabel: "Functional", description: "Informasi mengalir tetapi belum konsisten." },
    { levelValue: 4, levelLabel: "Effective", description: "Komunikasi jelas, dua arah, dan saling memperbarui." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Seluruh anggota aktif berbagi informasi secara real-time." },
  ],
  data_based_decision: [
    { levelValue: 1, levelLabel: "Reactive", description: "Keputusan berdasarkan tebakan." },
    { levelValue: 2, levelLabel: "Emerging", description: "Keputusan berdasarkan asumsi." },
    { levelValue: 3, levelLabel: "Functional", description: "Sebagian keputusan menggunakan data yang tersedia." },
    { levelValue: 4, levelLabel: "Effective", description: "Mayoritas keputusan menggunakan data dan informasi." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Semua keputusan dibuat berdasarkan fakta, data, dan evaluasi alternatif." },
  ],
  execution_discipline: [
    { levelValue: 1, levelLabel: "Reactive", description: "Banyak pekerjaan tidak selesai." },
    { levelValue: 2, levelLabel: "Emerging", description: "Target selesai tetapi terburu-buru." },
    { levelValue: 3, levelLabel: "Functional", description: "Target selesai sesuai ketentuan." },
    { levelValue: 4, levelLabel: "Effective", description: "Target selesai dan dilakukan pengecekan." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Target selesai, diverifikasi, dan siap digunakan oleh tim/proses berikutnya." },
  ],
  accountability: [
    { levelValue: 1, levelLabel: "Reactive", description: "Saling menyalahkan." },
    { levelValue: 2, levelLabel: "Emerging", description: "Menunggu arahan fasilitator." },
    { levelValue: 3, levelLabel: "Functional", description: "Bertanggung jawab terhadap tugas masing-masing." },
    { levelValue: 4, levelLabel: "Effective", description: "Bertanggung jawab terhadap hasil tim." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Proaktif mengambil kepemilikan dan segera menyelesaikan masalah." },
  ],
  adaptability: [
    { levelValue: 1, levelLabel: "Reactive", description: "Bingung dan kehilangan arah." },
    { levelValue: 2, levelLabel: "Emerging", description: "Terlambat menyesuaikan." },
    { levelValue: 3, levelLabel: "Functional", description: "Menyesuaikan sebagian strategi." },
    { levelValue: 4, levelLabel: "Effective", description: "Cepat menyusun strategi baru." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Langsung beradaptasi tanpa kehilangan momentum kerja." },
  ],
  collaboration: [
    { levelValue: 1, levelLabel: "Reactive", description: "Bekerja sendiri-sendiri." },
    { levelValue: 2, levelLabel: "Emerging", description: "Kerja sama masih terbatas." },
    { levelValue: 3, levelLabel: "Functional", description: "Bekerja sama ketika diperlukan." },
    { levelValue: 4, levelLabel: "Effective", description: "Aktif saling membantu selama mission." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Kolaborasi sangat solid dan saling melengkapi." },
  ],
  org_ownership: [
    { levelValue: 1, levelLabel: "Reactive", description: "Menunggu mission selesai setelah target tim tercapai." },
    { levelValue: 2, levelLabel: "Emerging", description: "Fokus pada kemenangan tim sendiri." },
    { levelValue: 3, levelLabel: "Functional", description: "Membantu tim lain jika diminta." },
    { levelValue: 4, levelLabel: "Effective", description: "Secara aktif menawarkan bantuan kepada tim lain." },
    { levelValue: 5, levelLabel: "Exemplary", description: "Berinisiatif memastikan seluruh tim berhasil mencapai target organisasi." },
  ],
};

export function getMissionDimensions(missionCode: MissionCode): DimensionConfig[] {
  const mission = MISSIONS[missionCode];
  if (!mission) return [];
  return mission.dimensions
    .map((code) => DIMENSIONS[code])
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getDimensionLevels(dimensionCode: DimensionCode): DimensionLevelConfig[] {
  return DIMENSION_LEVELS[dimensionCode] || [];
}
