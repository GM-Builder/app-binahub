import type { AssessmentRecord, DashboardData } from "./types";
import { stageLabel } from "./pipeline-model";

export type JourneyEvent = {
  id: string;
  source: "Peluang" | "Assessment" | "Proposal" | "Konsultasi" | "Pelaksanaan";
  title: string;
  description: string;
  at: string | null;
  actor?: string;
};

const activityLabels: Record<string, string> = {
  created: "Peluang dibuat",
  stage_changed: "Tahap peluang diperbarui",
  owner_assigned: "Penanggung jawab ditetapkan",
  next_action_updated: "Langkah berikutnya diperbarui",
  outreach_paused: "Tindak lanjut dijeda",
  outreach_resumed: "Tindak lanjut dilanjutkan",
  converted_to_client: "Serah terima klien dicatat",
};

function timestamp(value?: string | null): string | null {
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

function newestFirst(a: { createdAt: string }, b: { createdAt: string }) {
  return (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
}

/** Read-only projection of authorized dashboard records, never identity matching by email. */
export function buildClientJourney(
  data: DashboardData,
  scope: { leadId?: string | null; accountId?: string | null },
) {
  const leadIds = new Set<string>();
  if (scope.leadId && !scope.accountId) leadIds.add(scope.leadId);
  const accounts = (data.clientAccounts || []).filter((account) =>
    scope.accountId
      ? account.id === scope.accountId
      : Boolean(account.sourceLeadId && leadIds.has(account.sourceLeadId)),
  );
  const accountIds = new Set(accounts.map((account) => account.id));
  if (scope.accountId) {
    for (const account of accounts) {
      if (account.sourceLeadId) leadIds.add(account.sourceLeadId);
    }
  }
  const projects = (data.deliveryProjects || []).filter((project) =>
    scope.accountId
      ? accountIds.has(project.clientAccountId)
      : Boolean(project.sourceLeadId && leadIds.has(project.sourceLeadId))
        || accountIds.has(project.clientAccountId),
  );
  if (scope.accountId) {
    for (const project of projects) {
      if (project.sourceLeadId) leadIds.add(project.sourceLeadId);
    }
  }
  const projectIds = new Set(projects.map((project) => project.id));
  const assessments = (data.assessments || [])
    .filter((assessment) => Boolean(assessment.leadId && leadIds.has(assessment.leadId)))
    .sort(newestFirst);
  const assessmentIds = new Set(assessments.map((assessment) => assessment.id));
  const meetings = (data.calendarBookings || []).filter((meeting) =>
    Boolean(meeting.leadId && leadIds.has(meeting.leadId))
      || Boolean(meeting.assessmentId && assessmentIds.has(meeting.assessmentId)),
  );
  // Do not splice fields from different respondents or create a new assessment conclusion.
  const brief = assessments.find((assessment) =>
    [assessment.challenge, assessment.target, assessment.businessConsequence].some((value) => value?.trim()),
  ) || null;
  const events: JourneyEvent[] = [];
  const add = (event: Omit<JourneyEvent, "at"> & { at?: string | null }) => {
    events.push({ ...event, at: timestamp(event.at) });
  };

  for (const lead of data.pipelineLeads || []) {
    if (!leadIds.has(lead.id)) continue;
    add({ id: `lead:${lead.id}`, source: "Peluang", title: "Kontak masuk ke pipeline", description: lead.name, at: lead.createdAt });
  }
  for (const activity of data.opportunityActivities || []) {
    if (!leadIds.has(activity.leadId)) continue;
    add({
      id: `opportunity:${activity.id}`, source: "Peluang",
      title: activityLabels[activity.eventType] || "Aktivitas peluang dicatat",
      description: activity.note || (activity.fromStage || activity.toStage
        ? `${stageLabel(activity.fromStage)} → ${stageLabel(activity.toStage)}` : "Perubahan tersimpan pada peluang ini."),
      actor: activity.actor, at: activity.createdAt,
    });
  }
  for (const assessment of assessments) {
    add({ id: `assessment:${assessment.id}`, source: "Assessment", title: "Assessment diterima", description: assessment.name, at: assessment.createdAt });
    if (assessment.resultEmailSentAt) {
      add({ id: `result:${assessment.id}`, source: "Assessment", title: "Pengiriman hasil dicatat", description: "Status pengiriman tercatat; bukan konfirmasi bahwa email telah dibaca.", at: assessment.resultEmailSentAt });
    }
    if (assessment.proposalRequestedAt) {
      add({ id: `proposal-request:${assessment.id}`, source: "Proposal", title: "Proposal diminta", description: assessment.name, at: assessment.proposalRequestedAt });
    }
    if (assessment.proposalSentAt) {
      add({ id: `proposal-send:${assessment.id}`, source: "Proposal", title: "Pengiriman proposal dicatat", description: "Proposal tercatat dikirim; belum berarti kesepakatan atau pembayaran.", at: assessment.proposalSentAt });
    }
  }
  for (const meeting of meetings) {
    const cancelled = ["cancelled", "canceled", "rejected"].includes(meeting.status.toLowerCase());
    add({ id: `meeting:${meeting.id}`, source: "Konsultasi", title: cancelled ? "Konsultasi dibatalkan" : "Jadwal konsultasi tercatat", description: meeting.title, at: meeting.updatedAt });
  }
  for (const account of accounts) {
    add({ id: `account:${account.id}`, source: "Pelaksanaan", title: "Akun klien dibuat", description: account.organizationName, at: account.clientSince });
  }
  for (const project of projects) {
    add({ id: `project:${project.id}`, source: "Pelaksanaan", title: "Proyek disiapkan", description: project.programName, at: project.createdAt });
  }
  for (const activity of data.clientActivities || []) {
    if (!accountIds.has(activity.clientAccountId)
      && !(activity.projectId && projectIds.has(activity.projectId))) continue;
    add({ id: `client:${activity.id}`, source: "Pelaksanaan", title: "Aktivitas klien dicatat", description: activity.note || "Perubahan tersimpan pada akun klien.", actor: activity.actor, at: activity.createdAt });
  }
  // A stable key avoids duplicate rows in a partially repeated dashboard payload.
  const uniqueEvents = Array.from(new Map(events.map((event) => [event.id, event])).values());
  uniqueEvents.sort((a, b) =>
    (b.at ? Date.parse(b.at) : -Infinity) - (a.at ? Date.parse(a.at) : -Infinity)
      || a.id.localeCompare(b.id),
  );
  return { assessments, brief, meetings, accounts, projects, events: uniqueEvents };
}

export type ClientJourney = ReturnType<typeof buildClientJourney>;

export function briefFields(assessment: AssessmentRecord) {
  return [
    ["Tantangan yang disampaikan", assessment.challenge],
    ["Tujuan yang diharapkan", assessment.target],
    ["Dampak yang dirasakan", assessment.businessConsequence],
  ].filter((field): field is [string, string] => Boolean(field[1]?.trim()));
}
