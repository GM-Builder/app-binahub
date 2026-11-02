import { z } from "zod";

const timestamp = z.string().datetime({ offset: true });
const count = z.number().int().nonnegative().safe();
export const healthQueueSchema = z.object({
  key: z.enum([
    "team_analysis",
    "individual_email",
    "program_analysis",
    "program_email",
  ]),
  pending: count,
  processing: count,
  overdue: count,
  stalled: count,
  review: count,
  oldestDueAt: timestamp.nullable(),
});
const ready = z.object({
  readiness: z.literal("ready"),
  operations: z.enum(["healthy", "attention"]),
  checkedAt: timestamp,
  overdueMinutes: z.literal(10),
  queues: z
    .array(healthQueueSchema)
    .length(4)
    .refine((items) => new Set(items.map((item) => item.key)).size === 4),
  worker: z.object({
    state: z.enum([
      "never_seen",
      "running",
      "recent",
      "stale",
      "degraded",
      "failed",
    ]),
    startedAt: timestamp.optional(),
    finishedAt: timestamp.nullable().optional(),
    succeededAt: timestamp.nullable().optional(),
  }),
  alertChannel: z.literal("admin_dashboard"),
  externalAlertsEnabled: z.literal(false),
});
export const serviceHealthSchema = z.union([
  ready,
  z.object({
    readiness: z.enum(["setup_required", "unavailable"]),
    operations: z.literal("unknown"),
  }),
]);
export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
export type HealthQueue = z.infer<typeof healthQueueSchema>;
export const queueLabels: Record<HealthQueue["key"], string> = {
  team_analysis: "Diagnosis tim / organisasi",
  individual_email: "Email hasil individu",
  program_analysis: "Analisis rekomendasi program",
  program_email: "Email rekomendasi program",
};

export function parseServiceHealthResponse(raw: unknown, now = Date.now()) {
  const health = serviceHealthSchema.parse(
    z.object({ success: z.literal(true), health: z.unknown() }).parse(raw)
      .health,
  );
  if (health.readiness === "ready") {
    const age = now - Date.parse(health.checkedAt);
    if (age > 120_000 || age < -60_000) throw new Error("SERVICE_HEALTH_STALE");
  }
  return health;
}
export function healthWarning(health: ServiceHealth | null) {
  if (!health) return "";
  if (health.readiness !== "ready")
    return health.readiness === "setup_required"
      ? "Monitoring antrean memerlukan pembaruan API/database. Status belum dapat dipastikan."
      : "Kesiapan layanan belum dapat diperiksa. Perbarui untuk mencoba kembali.";
  const held = health.queues.some(
    (queue) => queue.overdue + queue.stalled + queue.review > 0,
  );
  if (held)
    return "Ada pekerjaan terlambat, melewati batas proses, atau memerlukan peninjauan. Periksa antrean laporan.";
  if (
    health.operations === "attention" ||
    !["recent", "running"].includes(health.worker.state)
  )
    return "Aktivitas pemroses laporan perlu diperiksa. Pemulihan rutin belum terbukti berjalan normal.";
  return "";
}
