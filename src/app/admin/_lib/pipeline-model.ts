import type { PipelineLeadRecord } from "./types";

export const ACTIVE_STAGES = [
  "identified",
  "qualified",
  "consultation",
  "proposal",
  "negotiation",
] as const;
export const STAGES = [...ACTIVE_STAGES, "won", "lost"] as const;
export type PipelineStage = (typeof STAGES)[number];
export type PipelineView = "active" | "won" | "lost" | "review";
export type PriorityFilter =
  | "all"
  | "attention"
  | "overdue"
  | "unassigned"
  | "paused";
export const STAGE_LABELS: Record<PipelineStage, string> = {
  identified: "Lead baru",
  qualified: "Terkualifikasi",
  consultation: "Konsultasi",
  proposal: "Proposal",
  negotiation: "Negosiasi",
  won: "Berhasil",
  lost: "Tidak lanjut",
};
export const STAGE_DESCRIPTIONS: Record<PipelineStage, string> = {
  identified: "Kenali kebutuhan calon klien",
  qualified: "Pastikan kebutuhan dan kecocokan",
  consultation: "Diskusikan solusi bersama",
  proposal: "Tindak lanjuti penawaran",
  negotiation: "Sepakati langkah kerja sama",
  won: "Kesepakatan berhasil dicapai",
  lost: "Ditutup tanpa kesepakatan",
};
export const STAGE_COLORS: Record<PipelineStage, string> = {
  identified: "bg-slate-400",
  qualified: "bg-sky-500",
  consultation: "bg-violet-500",
  proposal: "bg-[#D9A441]",
  negotiation: "bg-[#0B2C6B]",
  won: "bg-emerald-500",
  lost: "bg-rose-400",
};
export function stageLabel(value: string | null) {
  return value && value in STAGE_LABELS
    ? STAGE_LABELS[value as PipelineStage]
    : value || "Belum tercatat";
}
export function sourceLabel(value: string | null) {
  return (
    (
      {
        assessment: "Assessment",
        outbound: "Outbound",
        inquiry: "Pertanyaan masuk",
        contact: "Form kontak",
        website: "Website",
        calcom: "Konsultasi",
        manual_upload: "Impor manual",
      } as Record<string, string>
    )[value || ""] ||
    (value || "").replaceAll("_", " ") ||
    "Belum tercatat"
  );
}
export function isActiveStage(
  stage: string,
): stage is (typeof ACTIVE_STAGES)[number] {
  return ACTIVE_STAGES.includes(stage as (typeof ACTIVE_STAGES)[number]);
}
function timestamp(value: string | null) {
  const result = value ? Date.parse(value) : NaN;
  return Number.isFinite(result) ? result : Infinity;
}
export function isOverdue(lead: PipelineLeadRecord, now = Date.now()) {
  return (
    isActiveStage(lead.opportunityStage) &&
    timestamp(lead.nextActionDueAt) < now
  );
}
export function isLikelyTestLead(lead: PipelineLeadRecord) {
  const marker = [lead.name, lead.email, lead.company, lead.source]
    .filter(Boolean)
    .join(" ");
  return (
    /@example\.invalid$/i.test(lead.email) ||
    /\bphase\s*1[0-9]\b/i.test(marker) ||
    /\bphase1[0-9][-_]/i.test(marker)
  );
}
export function leadNeedsAttention(lead: PipelineLeadRecord, now = Date.now()) {
  if (!isActiveStage(lead.opportunityStage)) return false;
  return (
    !lead.opportunityOwner?.trim() ||
    isOverdue(lead, now) ||
    (lead.opportunityStage !== "identified" &&
      (!lead.nextAction?.trim() ||
        !Number.isFinite(timestamp(lead.nextActionDueAt))))
  );
}
function priority(lead: PipelineLeadRecord, now: number) {
  if (!isActiveStage(lead.opportunityStage)) return 0;
  const remaining = timestamp(lead.nextActionDueAt) - now;
  return (
    (isOverdue(lead, now) ? 100 : 0) +
    (!lead.opportunityOwner?.trim() ? 60 : 0) +
    (lead.opportunityStage !== "identified" &&
    (!lead.nextAction?.trim() ||
      !Number.isFinite(timestamp(lead.nextActionDueAt)))
      ? 45
      : 0) +
    (remaining >= 0 && remaining <= 86_400_000 ? 25 : 0) +
    (lead.leadTemperature === "hot" ? 15 : 0)
  );
}
export function sortPipelineLeads(
  leads: PipelineLeadRecord[],
  now = Date.now(),
) {
  return [...leads].sort((a, b) => {
    const difference = priority(b, now) - priority(a, now);
    if (difference) return difference;
    const left = isActiveStage(a.opportunityStage)
      ? timestamp(a.nextActionDueAt)
      : Infinity;
    const right = isActiveStage(b.opportunityStage)
      ? timestamp(b.nextActionDueAt)
      : Infinity;
    return (
      (left !== right ? left - right : 0) ||
      (b.opportunityValue || 0) - (a.opportunityValue || 0)
    );
  });
}
export function matchesPriority(
  lead: PipelineLeadRecord,
  filter: PriorityFilter,
  now: number,
) {
  if (filter === "all") return true;
  if (!isActiveStage(lead.opportunityStage)) return false;
  if (filter === "attention") return leadNeedsAttention(lead, now);
  if (filter === "overdue") return isOverdue(lead, now);
  if (filter === "unassigned") return !lead.opportunityOwner?.trim();
  return lead.outreachPaused;
}
export function rupiah(value: number | null) {
  return value == null
    ? "Belum dinilai"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(value);
}
export function compactRupiah(value: number) {
  for (const [divisor, suffix] of [
    [1e12, "triliun"],
    [1e9, "miliar"],
    [1e6, "jt"],
    [1e3, "rb"],
  ] as const) {
    if (Math.abs(value) >= divisor)
      return `Rp${(value / divisor).toFixed(1).replace(/\.0$/, "").replace(".", ",")} ${suffix}`;
  }
  return `Rp${Math.round(value)}`;
}
export function temperatureLabel(value: string) {
  return (
    (
      {
        hot: "Minat tinggi",
        warm: "Potensial",
        cold: "Tahap awal",
        new: "Baru",
        won: "Berhasil",
      } as Record<string, string>
    )[value] || value
  );
}
export type PipelineForm = {
  stage: string;
  owner: string;
  nextAction: string;
  nextActionDueAt: string;
  opportunityValue: string;
  leadTimeZone: string;
  lostReason: string;
  outreachPaused: boolean;
  outreachPauseReason: string;
  note: string;
};
export function formFromLead(lead: PipelineLeadRecord): PipelineForm {
  const date = lead.nextActionDueAt ? new Date(lead.nextActionDueAt) : null;
  const local =
    date && Number.isFinite(date.getTime())
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
          .toISOString()
          .slice(0, 16)
      : "";
  return {
    stage: lead.opportunityStage,
    owner: lead.opportunityOwner || "",
    nextAction: lead.nextAction || "",
    nextActionDueAt: local,
    opportunityValue:
      lead.opportunityValue == null ? "" : String(lead.opportunityValue),
    leadTimeZone: lead.leadTimeZone || "Asia/Jakarta",
    lostReason: lead.lostReason || "",
    outreachPaused: lead.outreachPaused,
    outreachPauseReason: lead.outreachPauseReason || "",
    note: "",
  };
}
// Keep the client-side checks aligned with /api/admin/pipeline; the API remains authoritative.
export function validatePipelineForm(form: PipelineForm) {
  const errors: string[] = [];
  const active = [
    "qualified",
    "consultation",
    "proposal",
    "negotiation",
  ].includes(form.stage);
  if (!STAGES.includes(form.stage as PipelineStage))
    errors.push("Pilih tahap peluang yang valid.");
  if (form.stage !== "identified" && !form.owner.trim())
    errors.push("Tentukan penanggung jawab peluang.");
  else if (
    form.owner &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.owner.trim()) ||
      form.owner.trim().length > 320)
  )
    errors.push("Gunakan email penanggung jawab yang valid.");
  if (
    (active || (isActiveStage(form.stage) && form.nextActionDueAt)) &&
    !form.nextAction.trim()
  )
    errors.push("Isi tindakan berikutnya.");
  if (active && !form.nextActionDueAt)
    errors.push("Tentukan tenggat tindakan.");
  if (
    form.nextActionDueAt &&
    !Number.isFinite(Date.parse(form.nextActionDueAt))
  )
    errors.push("Periksa tanggal tenggat tindakan.");
  if (form.stage === "lost" && form.lostReason.trim().length < 5)
    errors.push("Jelaskan alasan tidak lanjut (minimal 5 karakter).");
  const value = Number(form.opportunityValue);
  if (
    form.opportunityValue !== "" &&
    (!Number.isFinite(value) || value < 0 || value > 999_999_999_999)
  )
    errors.push("Nilai peluang harus antara Rp0 dan Rp999.999.999.999.");
  if (
    form.leadTimeZone.trim().length < 3 ||
    form.leadTimeZone.trim().length > 80
  )
    errors.push("Isi zona waktu klien dengan benar.");
  if (
    form.nextAction.trim().length > 2000 ||
    form.lostReason.trim().length > 2000 ||
    form.note.trim().length > 4000 ||
    form.outreachPauseReason.trim().length > 1000
  )
    errors.push("Ringkas catatan atau tindakan yang terlalu panjang.");
  return errors;
}
