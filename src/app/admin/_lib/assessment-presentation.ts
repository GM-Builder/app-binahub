import type { AssessmentRecord } from "./types";

export type AssessmentQueue = "all" | "attention" | "processing" | "sent";
export type AssessmentDetailTab = "summary" | "proposal" | "documents" | "followup";

const resultStops = new Set(["Minta Proposal", "Proposal Terkirim", "Lanjut Diskusi", "Closed"]);
const resultProposalStops = new Set(["Diminta", "Sedang Disusun", "Gagal Otomatis", "Perlu Rekonsiliasi", "Terkirim", "Revisi", "Lanjut Diskusi", "Deal", "Lost", "Closed"]);
const proposalStops = new Set(["Revisi", "Lanjut Diskusi", "Deal", "Lost", "Closed"]);

/** Mirrors the assessment follow-up eligibility rules in the API. */
export function dueFollowUp(record: AssessmentRecord, channel: "result" | "proposal", now = Date.now()): number | null {
  const current = channel === "result" ? record.resultFollowUpLevel || 0 : record.proposalFollowUpLevel || 0;
  if (record.followUpPaused || current >= (channel === "result" ? 3 : 1)) return null;
  if (channel === "result" && (resultStops.has(record.assessmentStatus) || resultProposalStops.has(record.proposalStatus))) return null;
  if (channel === "proposal" && proposalStops.has(record.proposalStatus)) return null;
  const anchor = channel === "result" ? record.resultEmailSentAt || record.createdAt : record.proposalSentAt;
  const elapsed = anchor ? Math.floor((now - new Date(anchor).getTime()) / 86_400_000) : NaN;
  const next = Math.max(0, current) + 1;
  return elapsed >= [0, 2, 7, 14][next] ? next : null;
}

export function proposalState(record: AssessmentRecord) {
  const manual = Boolean(record.proposalDraft?.proposal && !record.proposalDraft.automatic);
  const sent = Boolean(record.proposalSentAt) || record.proposalStatus === "Terkirim";
  const processing = !sent && !manual && record.proposalStatus === "Sedang Disusun";
  const reconcile = !sent && record.proposalStatus === "Perlu Rekonsiliasi";
  const failed = !sent && record.proposalStatus === "Gagal Otomatis";
  const review = manual && ["pending_approval", "revision_required", "rejected"].includes(record.proposalGateStatus || "");
  const label = sent ? "Proposal terkirim" : reconcile ? "Periksa pengiriman" : failed ? "Perlu dicoba ulang" : processing ? "Proposal diproses" : review ? "Draf perlu ditinjau" : record.proposalStatus === "Diminta" ? "Proposal diminta" : manual ? "Draf proposal" : "Belum ada proposal";
  return { manual, sent, processing, reconcile, failed, review, label };
}

export function needsAttention(record: AssessmentRecord) {
  const state = proposalState(record);
  return !state.sent && (state.failed || state.reconcile || state.review || record.proposalStatus === "Diminta")
    || dueFollowUp(record, "result") !== null || dueFollowUp(record, "proposal") !== null;
}

export function matchesQueue(record: AssessmentRecord, queue: AssessmentQueue) {
  if (queue === "attention") return needsAttention(record);
  if (queue === "processing") return proposalState(record).processing;
  if (queue === "sent") return proposalState(record).sent;
  return true;
}

export function assessmentLabel(value?: string | null) {
  const labels: Record<string, string> = {
    "Result Otomatis Terkirim": "Hasil terkirim", "Result Email Terkirim": "Hasil terkirim",
    "Minta Proposal": "Proposal diminta", "Proposal Terkirim": "Proposal terkirim",
    "Result Follow Up 1 Terkirim": "Pengingat hasil 1 terkirim", "Result Follow Up 2 Terkirim": "Pengingat hasil 2 terkirim",
    "Result Follow Up 3 Terkirim": "Pengingat hasil 3 terkirim", "Follow Up": "Dalam tindak lanjut",
    "Closed": "Ditutup", "Deal": "Disepakati", "Lost": "Tidak dilanjutkan",
    "Draft Simulasi": "Draf uji coba", "Menunggu Approval": "Menunggu persetujuan",
    "Gagal Otomatis": "Perlu dicoba ulang", "Perlu Rekonsiliasi": "Periksa pengiriman",
    "Proposal Follow Up 1 Terkirim": "Pengingat proposal terkirim",
    "Proposal Follow Up 2 Terkirim": "Pengingat proposal 2 terkirim", "Proposal Follow Up 3 Terkirim": "Pengingat proposal 3 terkirim",
  };
  return value ? labels[value] || value : "Belum tersedia";
}

export function profileLabel(value?: string | null) {
  const labels: Record<string, string> = {
    prospect: "Prospek", lead: "Lead", client: "Klien", expanded: "Klien berkembang",
    cold: "Minat awal", warm: "Minat berkembang", hot: "Minat tinggi",
    identified: "Peluang baru", qualified: "Peluang terverifikasi", proposal: "Tahap proposal",
    negotiation: "Tahap negosiasi", won: "Disepakati", lost: "Tidak dilanjutkan",
    explore: "Pelajari hasil dahulu", discussion: "Diskusi kebutuhan", proposal_request: "Minta proposal",
    "0_3": "Dalam 3 bulan", "3_6": "Dalam 3–6 bulan", "6_12": "Dalam 6–12 bulan",
    unknown: "Belum ditentukan", later: "Belum ditentukan",
    objectiveOrExpectedOutcome: "tujuan atau hasil yang diharapkan", nextStepOrMeeting: "rencana langkah berikutnya",
    industry: "industri", location: "lokasi", companySizeConfirmation: "konfirmasi jumlah karyawan",
    decisionMakerOrChampion: "jabatan kontak", problemOrNeed: "rincian tantangan", timeline: "waktu mulai",
    businessConsequence: "dampak bisnis",
  };
  return value ? labels[value.toLowerCase()] || labels[value] || value.replaceAll("_", " ") : "Belum diisi";
}
