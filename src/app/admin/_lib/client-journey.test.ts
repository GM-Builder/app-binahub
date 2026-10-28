import { describe, expect, it } from "vitest";
import { assessmentFixture } from "@/test/fixtures/assessment-admin";
import { clientJourneyFixture } from "@/test/fixtures/client-journey";
import { buildClientJourney, briefFields } from "./client-journey";

describe("read-only client journey", () => {
  it("joins by explicit lead and Self Diagnostic IDs, including a booking with no lead ID", () => {
    const { data, lead } = clientJourneyFixture();
    data.assessments.push(assessmentFixture({ id: "unrelated", leadId: "other", email: lead.email }));
    const journey = buildClientJourney(data, { leadId: lead.id });
    expect(journey.assessments.map((item) => item.id)).toEqual(["journey-assessment"]);
    expect(journey.meetings.map((item) => item.id)).toEqual(["journey-meeting"]);
    expect(journey.accounts).toHaveLength(1);
    expect(journey.projects).toHaveLength(1);
    expect(journey.events.some((event) => event.id.includes("unrelated"))).toBe(false);
  });

  it("finds source context from the selected account, not another company with the same name", () => {
    const { data, account } = clientJourneyFixture();
    data.clientAccounts!.push({ ...account, id: "other-account", sourceLeadId: "other-lead" });
    data.assessments.push(assessmentFixture({ id: "other", leadId: "other-lead", challenge: "PRIVATE_OTHER_CONTEXT" }));
    const journey = buildClientJourney(data, { accountId: account.id });
    expect(journey.accounts.map((item) => item.id)).toEqual([account.id]);
    expect(journey.brief?.id).toBe("journey-assessment");
    expect(JSON.stringify(journey)).not.toContain("PRIVATE_OTHER_CONTEXT");
  });

  it("does not let missing or unknown IDs match unlinked records", () => {
    const { data } = clientJourneyFixture();
    data.clientAccounts![0].sourceLeadId = null;
    data.deliveryProjects![0].sourceLeadId = null;
    data.assessments[0].leadId = null;
    expect(buildClientJourney(data, {}).events).toEqual([]);
    expect(buildClientJourney(data, { accountId: "unknown" }).events).toEqual([]);
    expect(buildClientJourney(data, { accountId: "unknown", leadId: "journey-lead" }).events).toEqual([]);
  });

  it("uses an account project's explicit source lead when the account has no source lead", () => {
    const { data, account } = clientJourneyFixture();
    data.clientAccounts![0].sourceLeadId = null;
    expect(buildClientJourney(data, { accountId: account.id }).brief?.id).toBe("journey-assessment");
  });

  it("keeps one dated respondent brief without mixing fields or reordering the input", () => {
    const { data, lead } = clientJourneyFixture();
    data.assessments.push(assessmentFixture({ id: "new", leadId: lead.id, name: "Responden baru", createdAt: "2026-10-18T02:00:00Z", challenge: "Kebutuhan terbaru", target: "", businessConsequence: "" }));
    data.assessments.push(assessmentFixture({ id: "blank", leadId: lead.id, createdAt: "2026-10-19T02:00:00Z", challenge: " ", target: "", businessConsequence: "" }));
    const before = JSON.stringify(data);
    const journey = buildClientJourney(data, { leadId: lead.id });
    expect(journey.brief?.id).toBe("new");
    expect(briefFields(journey.brief!)).toEqual([["Tantangan yang disampaikan", "Kebutuhan terbaru"]]);
    expect(JSON.stringify(data)).toBe(before);
  });

  it("does not turn a future booking, sent proposal, or account into attendance/payment evidence", () => {
    const { data, lead } = clientJourneyFixture();
    data.assessments[0].proposalSentAt = "2026-10-12T03:00:00Z";
    const events = buildClientJourney(data, { leadId: lead.id }).events;
    expect(events.find((item) => item.id === "meeting:journey-meeting")).toMatchObject({ at: "2026-10-11T02:00:00Z", title: "Jadwal konsultasi tercatat" });
    expect(events.find((item) => item.id.startsWith("proposal-send:"))?.description).toContain("belum berarti kesepakatan atau pembayaran");
    expect(events.some((item) => /lunas|order kedua|konsultasi selesai|ROI/i.test(item.title))).toBe(false);
  });

  it("handles absent dates, unknown event types and repeated event rows without exposing metadata", () => {
    const { data, lead } = clientJourneyFixture();
    data.opportunityActivities![0] = { ...data.opportunityActivities![0], createdAt: "invalid", eventType: "internal_secret_state", note: null, metadata: { hidden: "DO_NOT_RENDER" } };
    data.opportunityActivities!.push({ ...data.opportunityActivities![0] });
    const events = buildClientJourney(data, { leadId: lead.id }).events;
    expect(events.filter((item) => item.id === "opportunity:journey-activity")).toHaveLength(1);
    expect(events.at(-1)).toMatchObject({ at: null, title: "Aktivitas peluang dicatat" });
    expect(JSON.stringify(events)).not.toMatch(/DO_NOT_RENDER|internal_secret_state/);
  });

  it("retains cancellations without presenting them as completed meetings", () => {
    const { data, lead } = clientJourneyFixture();
    data.calendarBookings![0].status = "cancelled";
    expect(buildClientJourney(data, { leadId: lead.id }).events.find((item) => item.source === "Konsultasi")?.title).toBe("Konsultasi dibatalkan");
  });
});
