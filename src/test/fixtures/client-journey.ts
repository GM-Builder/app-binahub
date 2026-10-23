import type { DeliveryProjectRecord } from "@/app/admin/_lib/types";
import { assessmentFixture } from "./assessment-admin";
import { funnelAccount, funnelDashboard, funnelLead } from "./sales-funnel";

// Synthetic and local only. Never seed a production database from this fixture.
export function clientJourneyFixture() {
  const lead = funnelLead({ id: "journey-lead", opportunityStage: "won", lifecycleStage: "client" });
  const account = funnelAccount({ id: "journey-account", sourceLeadId: lead.id });
  const data = funnelDashboard([lead]);
  data.clientAccounts = [account];
  data.assessments = [assessmentFixture({ id: "journey-assessment", leadId: lead.id })];
  data.deliveryProjects = [{
    id: "journey-project", clientAccountId: account.id, sourceLeadId: lead.id,
    engagementId: null, clientName: account.organizationName, contactName: lead.name,
    contactEmail: lead.email, programName: "Team Communication & Collaboration",
    service: "BinaLab", projectType: "workshop", scope: "Kesepakatan cara kerja tim",
    startDate: null, endDate: null, status: "active", deliveryStage: "planning",
    deliveryOwner: "delivery@example.invalid", kickoffAt: null, deliveryGoal: null,
    successMetrics: [], riskLevel: "low", riskSummary: null, initialHandoff: true,
    handoffApprovedBy: "admin@example.invalid", handoffApprovedAt: "2026-10-12T02:00:00Z",
    createdAt: "2026-10-12T02:00:00Z", updatedAt: "2026-10-12T02:00:00Z",
  } satisfies DeliveryProjectRecord];
  data.calendarBookings = [{
    id: "journey-meeting", providerUid: "synthetic-booking", leadId: null,
    assessmentId: "journey-assessment", eventTypeSlug: "consultation", title: "Pembahasan kebutuhan tim",
    status: "confirmed", attendeeName: lead.name, attendeeEmail: lead.email,
    organizerEmail: "consultant@example.invalid", startTime: "2026-10-25T03:00:00Z",
    endTime: "2026-10-25T04:00:00Z", timeZone: "Asia/Jakarta", meetingUrl: null,
    cancellationReason: null, updatedAt: "2026-10-11T02:00:00Z", isUpcoming: true,
  }];
  data.opportunityActivities = [{
    id: "journey-activity", leadId: lead.id, assessmentId: null, inquiryId: null,
    eventType: "stage_changed", fromStage: "negotiation", toStage: "won",
    actor: "admin@example.invalid", note: "Klien menyepakati ruang lingkup.", metadata: {},
    createdAt: "2026-10-11T03:00:00Z",
  }];
  data.clientActivities = [{
    id: "journey-client-activity", clientAccountId: account.id, projectId: "journey-project",
    milestoneId: null, retentionOpportunityId: null, eventType: "project_updated",
    actor: "delivery@example.invalid", note: "Jadwalkan pembahasan tujuan dan indikator bersama klien.",
    metadata: {}, createdAt: "2026-10-13T03:00:00Z",
  }];
  return { data, lead, account };
}
