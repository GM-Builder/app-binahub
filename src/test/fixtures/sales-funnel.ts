import type { ClientAccountRecord, DashboardData, PipelineLeadRecord } from "@/app/admin/_lib/types";
import { assessmentDashboard, assessmentFixture } from "./assessment-admin";

// Synthetic records only, never used to seed production.
export function funnelLead(overrides: Partial<PipelineLeadRecord> = {}): PipelineLeadRecord {
  return { id: "lead-1", name: "Nadia Putri", email: "nadia@example.com", company: "PT Aurora Nusantara", industry: "Teknologi", location: "Jakarta", qualificationProfile: {}, phone: "",
    source: "assessment", leadScore: 80, leadTemperature: "warm", leadScoreConfidence: 1, lifecycleStage: "lead", opportunityStage: "identified",
    opportunityOwner: "admin@example.com", nextAction: "Diskusikan kebutuhan tim", nextActionDueAt: "2026-10-15T03:00:00Z", leadTimeZone: "Asia/Jakarta", opportunityValue: 25_000_000,
    lostReason: null, wonAt: null, lostAt: null, outreachPaused: false, outreachPauseReason: null, outreachPausedAt: null, outreachPausedBy: null,
    pipelineUpdatedAt: "2026-10-13T02:00:00Z", createdAt: "2026-10-12T02:00:00Z", ...overrides };
}
export function funnelAccount(overrides: Partial<ClientAccountRecord> = {}): ClientAccountRecord {
  return { id: "account-1", organizationId: "org-1", organizationName: "PT Aurora Nusantara", industry: "Teknologi", organizationSize: "51–100", location: "Jakarta",
    sourceLeadId: "lead-won", commercialOwner: "admin@example.com", deliveryOwner: "delivery@example.com", status: "active", healthScore: 85, healthStatus: "healthy",
    nextReviewAt: null, renewalDate: null, retainStatus: "monitoring", churnReason: null, notes: null, clientSince: "2026-10-10T02:00:00Z", updatedAt: "2026-10-13T02:00:00Z", ...overrides };
}
export function funnelDashboard(leads: PipelineLeadRecord[] = []): DashboardData {
  return { ...assessmentDashboard([]), generatedAt: "2026-10-13T03:00:00Z", pipelineLeads: leads, salesFunnelCoverage: { loaded: leads.length, total: leads.length, stageDataAvailable: true, loadError: false }, clientAccounts: [], retentionOpportunities: [] };
}
export function funnelPreviewData(): DashboardData {
  const leads = [
    ...Array.from({ length: 7 }, (_, index) => funnelLead({ id: `lead-new-${index}`, name: ["Nadia Putri", "Aditya Rahman", "Dian Kartika", "Rangga Pratama", "Mira Sari", "Farhan Akbar", "Laras Wulandari"][index], company: ["PT Aurora Nusantara", "Aruna Teknologi", "Meridian Group", "Karya Bersama", "Studio Cakrawala", "Lentera Digital", "Nusantara Digital"][index], opportunityOwner: index === 0 ? null : "admin@example.com", source: index % 2 ? "outbound" : "assessment", opportunityValue: null })),
    funnelLead({ id: "lead-qualified", name: "Reza Aditya", company: "Lentera Digital", opportunityStage: "qualified", leadTemperature: "hot", nextActionDueAt: "2026-10-12T03:00:00Z" }),
    funnelLead({ id: "lead-meeting", name: "Dina Maheswari", company: "Meridian Group", opportunityStage: "consultation", nextAction: "Konsultasi kebutuhan kepemimpinan" }),
    funnelLead({ id: "lead-proposal", name: "Arif Pratama", company: "Studio Cakrawala", opportunityStage: "proposal", nextAction: "Konfirmasi isi penawaran", outreachPaused: true, outreachPauseReason: "Menunggu respons klien" }),
    funnelLead({ id: "lead-nego", name: "Mira Sari", company: "Karya Bersama", opportunityStage: "negotiation", opportunityValue: 50_000_000 }),
    funnelLead({ id: "lead-won", name: "Bima Satriya", opportunityStage: "won", lifecycleStage: "client", wonAt: "2026-10-10T03:00:00Z" }),
    funnelLead({ id: "lead-loyal", name: "Anisa Dewi", company: "Cakra Group", opportunityStage: "won", lifecycleStage: "client", wonAt: "2026-10-01T03:00:00Z" }),
    funnelLead({ id: "lead-lost", name: "Dito Santoso", company: "Samudra Digital", opportunityStage: "lost", lostReason: "Prioritas perusahaan berubah", lostAt: "2026-10-11T03:00:00Z" }),
    funnelLead({ id: "lead-test", name: "Phase 13 Evidence", email: "phase13@example.invalid" }),
  ];
  const result = funnelDashboard(leads);
  result.clientAccounts = [funnelAccount(), funnelAccount({ id: "account-loyal", sourceLeadId: "lead-loyal", organizationName: "Cakra Group", retainStatus: "expanded" })];
  result.assessments = [assessmentFixture({ id: "assessment-proposal", leadId: "lead-proposal", name: "Arif Pratama", company: "Studio Cakrawala", proposalStatus: "Terkirim", proposalSentAt: "2026-10-12T03:00:00Z" })];
  result.calendarBookings = [{ id: "meeting-1", providerUid: "demo-meeting", leadId: "lead-meeting", assessmentId: null, title: "Konsultasi pengembangan tim", status: "confirmed", attendeeName: "Dina Maheswari", attendeeEmail: "dina@example.com", organizerEmail: "admin@example.com", startTime: "2026-10-15T03:00:00Z", endTime: "2026-10-15T04:00:00Z", timeZone: "Asia/Jakarta", eventTypeSlug: "consultation", meetingUrl: null, cancellationReason: null, updatedAt: "2026-10-13T03:00:00Z", isUpcoming: true }];
  return result;
}
