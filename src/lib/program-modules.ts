export const PROGRAM_MODULE_KEYS = ["tbos", "lep", "binainsight", "pre_test", "post_test", "peta"] as const;

export type ProgramModuleKey = (typeof PROGRAM_MODULE_KEYS)[number];

export const PROGRAM_MODULE_META: Record<ProgramModuleKey, { label: string; description: string }> = {
  tbos: { label: "T-BOS", description: "Observasi perilaku tim berbasis misi" },
  peta: { label: "PETA", description: "Pemetaan kecenderungan perilaku untuk refleksi pribadi" },
  lep: { label: "LEP", description: "Evaluasi program oleh peserta" },
  binainsight: { label: "BinaInsight", description: "Diagnostik performa 7 dimensi untuk peserta" },
  pre_test: { label: "Pre-test", description: "Pengukuran awal yang dapat disusun khusus untuk setiap program" },
  post_test: { label: "Post-test", description: "Pengukuran akhir dan perbandingan hasil pembelajaran" },
};
