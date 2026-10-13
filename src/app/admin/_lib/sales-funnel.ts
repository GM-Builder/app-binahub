import type { ClientAccountRecord, DashboardData, PipelineLeadRecord } from "./types";

export const FUNNEL_STAGES = [
  { id: "awareness", label: "Awareness", shortLabel: "Lead tercatat", description: "Calon klien sudah tercatat pada tahap Teridentifikasi. Ini jumlah peluang, bukan jumlah pengunjung atau impresi iklan.", color: "#3768B1" },
  { id: "interest", label: "Interest", shortLabel: "Minat terkonfirmasi", description: "Peluang ditandai Terkualifikasi. Tingkat minat Hot/Warm/Cold ditampilkan terpisah, bukan diasumsikan dari tahap ini.", color: "#2D5798" },
  { id: "interact", label: "Interact", shortLabel: "Konsultasi", description: "Peluang berada pada tahap Konsultasi. Jadwal dan status meeting tersedia jika sudah tercatat.", color: "#24467F" },
  { id: "consideration", label: "Consideration", shortLabel: "Proposal & negosiasi", description: "Peluang berada pada tahap Proposal atau Negosiasi. Status penyusunan dan pengiriman penawaran terlihat dalam detail.", color: "#0B2C6B" },
  { id: "decision", label: "Decision", shortLabel: "Klien / deal berhasil", description: "Peluang ditandai Berhasil dan belum memiliki pengembangan akun atau peluang repeat yang berhasil tercatat. Berhasil tidak otomatis berarti pembayaran sudah diterima.", color: "#176B5B" },
] as const;

export type FunnelStage = typeof FUNNEL_STAGES[number]["id"] | "loyal" | "lost" | "unknown";
export const FUNNEL_LABELS: Record<FunnelStage, string> = {
  ...Object.fromEntries(FUNNEL_STAGES.map(stage => [stage.id, stage.label])),
  loyal: "Loyal", lost: "Tidak lanjut", unknown: "Tahap belum dikenali",
} as Record<FunnelStage, string>;

const pipelineStageMap: Record<string, FunnelStage> = {
  identified: "awareness", qualified: "interest", consultation: "interact", proposal: "consideration",
  negotiation: "consideration", won: "decision", lost: "lost",
};
export function funnelStage(value: string, loyal = false): FunnelStage {
  const stage = value.trim().toLowerCase();
  return stage === "won" && loyal ? "loyal" : pipelineStageMap[stage] || "unknown";
}

export function isFunnelTestLead(lead: PipelineLeadRecord) {
  const marker = [lead.name, lead.email, lead.company, lead.source].join(" ");
  return /@example\.invalid$/i.test(lead.email) || /\bphase\s*1[0-9]\b/i.test(marker) || /\bphase1[0-9][-_]/i.test(marker);
}

export function funnelAttention(lead: PipelineLeadRecord, now: number) {
  if (["decision", "lost"].includes(funnelStage(lead.opportunityStage))) return { overdue: false, unassigned: false, missingAction: false };
  const due = lead.nextActionDueAt ? Date.parse(lead.nextActionDueAt) : NaN;
  return {
    overdue: Number.isFinite(due) && due < now,
    unassigned: !lead.opportunityOwner?.trim(),
    missingAction: funnelStage(lead.opportunityStage) !== "awareness" && (!lead.nextAction?.trim() || !Number.isFinite(due)),
  };
}

export function buildSalesFunnel(data: DashboardData, includeTest = false, now = Date.now()) {
  // One pipeline record is one opportunity, not one company/email. Never merge different leads by email.
  const unique = new Map((data.pipelineLeads || []).map(lead => [lead.id, lead]));
  const all = [...unique.values()];
  const testCount = all.filter(isFunnelTestLead).length;
  const leads = includeTest ? all : all.filter(lead => !isFunnelTestLead(lead));
  const loyalAccounts = new Set((data.retentionOpportunities || []).filter(opportunity =>
    opportunity.status === "won" && ["repeat", "renewal", "upsell", "cross_sell"].includes(opportunity.opportunityType)).map(opportunity => opportunity.clientAccountId));
  const loyalLeads = new Set((data.clientAccounts || []).filter(account => account.sourceLeadId &&
    ["onboarding", "active", "at_risk"].includes(account.status) && account.retainStatus !== "churned" &&
    (account.retainStatus === "expanded" || loyalAccounts.has(account.id))).map(account => account.sourceLeadId!));
  const buckets: Record<FunnelStage, PipelineLeadRecord[]> = { awareness: [], interest: [], interact: [], consideration: [], decision: [], loyal: [], lost: [], unknown: [] };
  for (const lead of leads) buckets[funnelStage(lead.opportunityStage, loyalLeads.has(lead.id))].push(lead);
  for (const list of Object.values(buckets)) list.sort((a, b) => {
    const aFlags = funnelAttention(a, now), bFlags = funnelAttention(b, now);
    const rank = (flags: ReturnType<typeof funnelAttention>) => Number(flags.overdue) * 4 + Number(flags.unassigned) * 2 + Number(flags.missingAction);
    return rank(bFlags) - rank(aFlags) || (Date.parse(b.pipelineUpdatedAt || b.createdAt || "") || 0) - (Date.parse(a.pipelineUpdatedAt || a.createdAt || "") || 0);
  });
  const accountsByLead = new Map<string, ClientAccountRecord[]>();
  const unlinkedAccounts: ClientAccountRecord[] = [];
  for (const account of data.clientAccounts || []) {
    if (!account.sourceLeadId || !unique.has(account.sourceLeadId)) { unlinkedAccounts.push(account); continue; }
    accountsByLead.set(account.sourceLeadId, [...accountsByLead.get(account.sourceLeadId) || [], account]);
  }
  const active = leads.filter(lead => !["decision", "lost", "unknown"].includes(funnelStage(lead.opportunityStage)));
  return { leads, buckets, testCount, accountsByLead, unlinkedAccounts, activeCount: active.length,
    activeValue: active.reduce((sum, lead) => sum + (Number.isFinite(Number(lead.opportunityValue)) ? Number(lead.opportunityValue) : 0), 0) };
}

export function funnelRupiah(value: number | null | undefined, compact = false) {
  if (value == null || !Number.isFinite(Number(value))) return "Belum dinilai";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: compact ? 1 : 0,
    ...(compact ? { notation: "compact" as const } : {}) }).format(Number(value));
}

const stateLabels: Record<string, string> = {
  prospect: "Prospek", lead: "Lead", client: "Klien", customer: "Klien", retained: "Klien berulang",
  identified: "Teridentifikasi", qualified: "Terkualifikasi", consultation: "Konsultasi", proposal: "Proposal",
  negotiation: "Negosiasi", won: "Berhasil", lost: "Tidak lanjut",
  onboarding: "Orientasi", active: "Aktif", at_risk: "Berisiko", inactive: "Tidak aktif", churned: "Berhenti",
  hot: "Prioritas tinggi", warm: "Potensial", cold: "Tahap awal", new: "Baru", unclassified: "Belum diklasifikasi",
  healthy: "Sehat", watch: "Perlu dipantau", critical: "Kritis", monitoring: "Dipantau", opportunity: "Ada peluang",
  renewal_due: "Perpanjangan segera", expanded: "Berkembang", requested: "Diminta", confirmed: "Terkonfirmasi",
  rescheduled: "Dijadwalkan ulang", cancelled: "Dibatalkan", completed: "Selesai", handoff: "Serah terima",
  kickoff: "Pertemuan awal", planning: "Perencanaan", in_progress: "Berjalan", on_hold: "Ditunda",
};
export function funnelStatusLabel(value: string | null | undefined) {
  return value ? stateLabels[value.toLowerCase()] || value.replaceAll("_", " ") : "Belum tercatat";
}
