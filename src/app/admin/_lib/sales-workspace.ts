import { dueFollowUp, proposalState } from "./assessment-presentation";
import type { DashboardData } from "./types";

export type SalesView = "priorities" | "inbound" | "outbound" | "clients" | "followup" | "pipeline" | "meetings";
export type SalesTask = {
  id: string; recordId: string; kind: "inquiry" | "assessment" | "proposal" | "followup" | "pipeline";
  name: string; company: string; email: string; source: string; note: string; action: string;
  view: SalesView; detail?: "summary" | "proposal" | "followup"; priority: number; at: string | null;
};
const closed = new Set(["closed", "deal", "lost", "client", "selesai", "diarsipkan", "won"]);
const isClosed = (value?: string) => closed.has((value || "").toLowerCase());

/** A work queue, not an AI decision or an authorization to send. The API rechecks every action. */
export function salesTasks(data: Pick<DashboardData, "assessments" | "inquiries" | "pipelineLeads" | "calendarBookings">, now = Date.now()): SalesTask[] {
  const tasks: SalesTask[] = [];
  const stopped = (email: string) => (data.pipelineLeads || []).some((lead) => lead.email.toLowerCase() === email.toLowerCase()
    && (lead.outreachPaused || ["consultation", "negotiation", "won", "lost"].includes(lead.opportunityStage)))
    || (data.calendarBookings || []).some((booking) => booking.attendeeEmail.toLowerCase() === email.toLowerCase()
      && ["confirmed", "rescheduled", "completed"].includes(booking.status));
  for (const record of data.inquiries) {
    if (isClosed(record.status) || ["Lanjut Diskusi", "Qualified"].includes(record.status)) continue;
    const base = { recordId: record.id, name: record.name, company: "Inquiry masuk", email: record.email, source: record.source || "Belum tercatat", at: record.createdAt };
    if (!record.replySentAt && record.replyStatus !== "sending") {
      tasks.push({ ...base, id: `inquiry:${record.id}`, kind: "inquiry", note: "Pertanyaan klien belum dibalas", action: "Tulis balasan", view: "clients", priority: 1 });
    } else if (record.replySentAt && !record.followUpPaused && !stopped(record.email)) {
      const level = (record.followUpLevel || 0) + 1;
      const days = [0, 2, 7, 14][level];
      if (days && now - Date.parse(record.replySentAt) >= days * 86_400_000) tasks.push({ ...base, id: `followup:inquiry:${record.id}`, kind: "followup", note: `Pengingat percakapan ${level} siap ditinjau`, action: "Tinjau tindak lanjut", view: "clients", priority: 3 });
    }
  }
  for (const record of data.assessments) {
    if (isClosed(record.assessmentStatus) || isClosed(record.proposalStatus)) continue;
    const state = proposalState(record);
    const base = { recordId: record.id, name: record.name, company: record.company, email: record.email, source: record.attribution?.utmSource || record.attribution?.utm_source || "Self Diagnostic website", at: record.proposalRequestedAt || record.createdAt };
    if (!state.sent && (state.failed || state.reconcile || state.review || record.proposalStatus === "Diminta")) {
      tasks.push({ ...base, id: `proposal:${record.id}`, kind: "proposal", note: state.label, action: state.reconcile ? "Periksa pengiriman" : "Buka proposal", view: "clients", detail: "proposal", priority: 0 });
    } else if (!record.resultEmailSentAt) {
      tasks.push({ ...base, id: `Self Diagnostic:${record.id}`, kind: "assessment", note: "Pengiriman hasil belum tercatat", action: "Periksa hasil", view: "clients", detail: "summary", priority: 2 });
    } else if (!stopped(record.email) && (dueFollowUp(record, "result", now) || dueFollowUp(record, "proposal", now))) {
      tasks.push({ ...base, id: `followup:Self Diagnostic:${record.id}`, kind: "followup", note: "Pengingat hasil atau proposal siap ditinjau", action: "Tinjau tindak lanjut", view: "clients", detail: "followup", priority: 3 });
    }
  }
  for (const record of data.pipelineLeads || []) {
    if (["won", "lost"].includes(record.opportunityStage) || !record.nextActionDueAt || Date.parse(record.nextActionDueAt) > now) continue;
    tasks.push({ id: `pipeline:${record.id}`, recordId: record.id, kind: "pipeline", name: record.name, company: record.company, email: record.email, source: record.source || "Peluang penjualan", note: record.nextAction || "Tentukan langkah berikutnya", action: "Buka peluang", view: "pipeline", priority: 2, at: record.nextActionDueAt });
  }
  return tasks.sort((a, b) => a.priority - b.priority || (Date.parse(a.at || "") || 0) - (Date.parse(b.at || "") || 0));
}
