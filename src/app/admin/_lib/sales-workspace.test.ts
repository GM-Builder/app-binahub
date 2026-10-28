import { describe, expect, it } from "vitest";
import { assessmentFixture } from "@/test/fixtures/assessment-admin";
import { salesTasks } from "./sales-workspace";
import type { InquiryRecord, PipelineLeadRecord } from "./types";
const now = Date.parse("2026-10-06T03:00:00Z");
const inquiry: InquiryRecord = { id: "inquiry", name: "Rina", email: "rina@example.com", whatsapp: "", message: "Ingin berdiskusi", source: "instagram", status: "Baru", notes: "", createdAt: "2026-10-01T00:00:00Z" };
const data = () => ({ assessments: [assessmentFixture()], inquiries: [inquiry], pipelineLeads: [] as PipelineLeadRecord[] });
describe("sales work queue", () => {
  it("prioritizes a requested proposal, then unanswered inquiry", () => {
    const tasks = salesTasks(data(), now);
    expect(tasks.map((task) => task.kind)).toEqual(["proposal", "inquiry"]);
    expect(tasks[0]).toMatchObject({ recordId: "demo-assessment-1", detail: "proposal", action: "Buka proposal" });
    expect(tasks[1].source).toBe("instagram");
  });
  it("does not offer reminders for missing initial delivery or a sending reply", () => {
    const record = assessmentFixture({ resultEmailSentAt: null, proposalStatus: "Belum Diminta", assessmentStatus: "Baru" });
    const tasks = salesTasks({ ...data(), assessments: [record], inquiries: [{ ...inquiry, replyStatus: "sending" }] }, now);
    expect(tasks.map((task) => task.kind)).toEqual(["assessment"]);
  });
  it("excludes closed, paused and actively handled conversations from follow-up", () => {
    const record = assessmentFixture({ proposalStatus: "Belum Diminta", assessmentStatus: "Result Otomatis Terkirim", followUpPaused: true });
    expect(salesTasks({ ...data(), assessments: [record], inquiries: [{ ...inquiry, status: "Closed" }] }, now)).toEqual([]);
    expect(salesTasks({ ...data(), assessments: [], inquiries: [{ ...inquiry, replySentAt: "2026-10-01T00:00:00Z" }], pipelineLeads: [{ email: inquiry.email, opportunityStage: "consultation" } as PipelineLeadRecord] }, now)).toEqual([]);
  });
  it("uses due follow-up levels and produces just one action per Self Diagnostic", () => {
    const record = assessmentFixture({ proposalStatus: "Terkirim", assessmentStatus: "Proposal Terkirim", proposalSentAt: "2026-10-01T00:00:00Z" });
    expect(salesTasks({ ...data(), assessments: [record], inquiries: [] }, now)).toHaveLength(1);
    expect(salesTasks({ ...data(), assessments: [{ ...record, proposalFollowUpLevel: 1 }], inquiries: [] }, now)).toEqual([]);
  });
  it("handles old dashboard responses without pipeline data", () => {
    expect(salesTasks({ assessments: [], inquiries: [] }, now)).toEqual([]);
  });
  it("reads the API camelCase UTM source and legacy snake_case", () => {
    const record = assessmentFixture({ attribution: { utmSource: "instagram", utmCampaign: "demo" } });
    expect(salesTasks({ ...data(), assessments: [record], inquiries: [] }, now)[0].source).toBe("instagram");
    expect(salesTasks({ ...data(), assessments: [{ ...record, attribution: { utm_source: "tiktok" } }], inquiries: [] }, now)[0].source).toBe("tiktok");
  });
  it("does not suggest outreach after a confirmed consultation", () => {
    const record = assessmentFixture({ proposalStatus: "Belum Diminta", assessmentStatus: "Result Email Terkirim" });
    expect(salesTasks({ ...data(), assessments: [record], inquiries: [], calendarBookings: [{ attendeeEmail: record.email, status: "confirmed" } as import('./types').CalendarBookingRecord] }, now)).toEqual([]);
  });
});
