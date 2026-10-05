import { describe, expect, it } from "vitest";
import { assessmentFixture } from "@/test/fixtures/assessment-admin";
import { assessmentLabel, dueFollowUp, matchesQueue, needsAttention, profileLabel, proposalState } from "./assessment-presentation";

const now = Date.parse("2026-10-05T03:00:00Z");
const result = () => assessmentFixture({ assessmentStatus: "Result Otomatis Terkirim", proposalStatus: "Belum Diminta" });

describe("Assessment presentation", () => {
  it("uses the next scheduled result reminder, not just a two-day threshold", () => {
    expect(dueFollowUp(result(), "result", now)).toBe(1);
    expect(dueFollowUp({ ...result(), resultFollowUpLevel: 1 }, "result", now)).toBeNull();
    expect(dueFollowUp({ ...result(), resultFollowUpLevel: 1, resultEmailSentAt: "2026-09-28T03:00:00Z" }, "result", now)).toBe(2);
    expect(dueFollowUp({ ...result(), resultFollowUpLevel: 2, resultEmailSentAt: "2026-09-21T03:00:00Z" }, "result", now)).toBe(3);
    expect(dueFollowUp({ ...result(), resultFollowUpLevel: 3 }, "result", now)).toBeNull();
  });
  it.each(["Diminta", "Sedang Disusun", "Gagal Otomatis", "Perlu Rekonsiliasi", "Terkirim", "Deal", "Lost", "Closed"])("stops result reminders for proposal status %s", (proposalStatus) => {
    expect(dueFollowUp({ ...result(), proposalStatus }, "result", now)).toBeNull();
  });
  it.each(["Minta Proposal", "Proposal Terkirim", "Lanjut Diskusi", "Closed"])("stops result reminders for assessment status %s", (assessmentStatus) => {
    expect(dueFollowUp({ ...result(), assessmentStatus }, "result", now)).toBeNull();
  });
  it("supports only one proposal reminder and requires a sent date", () => {
    expect(dueFollowUp(assessmentFixture(), "proposal", now)).toBeNull();
    const record = assessmentFixture({ proposalStatus: "Terkirim", proposalSentAt: "2026-10-03T03:00:00Z" });
    expect(dueFollowUp(record, "proposal", now)).toBe(1);
    expect(dueFollowUp({ ...record, proposalFollowUpLevel: 1 }, "proposal", now)).toBeNull();
    expect(dueFollowUp({ ...record, proposalSentAt: "2026-10-04T03:00:00Z" }, "proposal", now)).toBeNull();
  });
  it.each(["Revisi", "Lanjut Diskusi", "Deal", "Lost", "Closed"])("stops proposal reminders for %s", (proposalStatus) => {
    expect(dueFollowUp(assessmentFixture({ proposalStatus, proposalSentAt: "2026-10-01T03:00:00Z" }), "proposal", now)).toBeNull();
  });
  it("does not allow paused or invalid-date reminders", () => {
    expect(dueFollowUp({ ...result(), followUpPaused: true }, "result", now)).toBeNull();
    expect(dueFollowUp({ ...result(), resultEmailSentAt: "invalid" }, "result", now)).toBeNull();
  });
  it("classifies queues using proposal state rather than diagnosis score", () => {
    const failed = assessmentFixture({ proposalStatus: "Gagal Otomatis", overallScore: 10 });
    expect(needsAttention(failed)).toBe(true);
    expect(matchesQueue(failed, "attention")).toBe(true);
    expect(matchesQueue(failed, "processing")).toBe(false);
    expect(matchesQueue(assessmentFixture({ proposalStatus: "Sedang Disusun" }), "processing")).toBe(true);
    expect(matchesQueue(assessmentFixture({ proposalSentAt: "2026-10-05T03:00:00Z" }), "sent")).toBe(true);
  });
  it("does not treat a manual draft as an automatic process", () => {
    expect(proposalState(assessmentFixture({ proposalStatus: "Sedang Disusun", proposalDraft: { proposal: { subject: "Draf" } }, proposalGateStatus: "pending_approval" })).processing).toBe(false);
  });
  it("keeps friendly labels separate from API values", () => {
    expect(assessmentLabel("Result Email Terkirim")).toBe("Hasil terkirim");
    expect(profileLabel("WARM")).toBe("Minat berkembang");
    expect(profileLabel("0_3")).toBe("Dalam 3 bulan");
  });
});
