import { describe, expect, it } from "vitest";
import { funnelAccount, funnelDashboard, funnelLead } from "@/test/fixtures/sales-funnel";
import { buildSalesFunnel, funnelAttention, funnelStage } from "./sales-funnel";

const now = Date.parse("2026-10-13T03:00:00Z");
describe("current sales funnel snapshot", () => {
  it("maps five business stages to recorded pipeline states", () => {
    expect(["identified", "qualified", "consultation", "proposal", "negotiation", "won", "lost", "invalid"].map(stage => funnelStage(stage)))
      .toEqual(["awareness", "interest", "interact", "consideration", "consideration", "decision", "lost", "unknown"]);
    expect(funnelStage(" WON ", true)).toBe("loyal");
  });
  it("counts each lead ID once without merging different opportunities sharing an email", () => {
    const data = funnelDashboard([funnelLead(), funnelLead(), funnelLead({ id: "another" })]);
    const funnel = buildSalesFunnel(data);
    expect(funnel.leads).toHaveLength(2); expect(funnel.buckets.awareness).toHaveLength(2);
  });
  it("does not inflate earlier stages or derive them from minat/Self Diagnostic status", () => {
    const funnel = buildSalesFunnel(funnelDashboard([funnelLead({ opportunityStage: "won", leadTemperature: "hot" })]));
    expect(funnel.buckets.awareness).toHaveLength(0); expect(funnel.buckets.interest).toHaveLength(0); expect(funnel.buckets.decision).toHaveLength(1);
    expect(funnel.activeCount).toBe(0); expect(funnel.activeValue).toBe(0);
  });
  it("excludes known test evidence by default but lets it be inspected explicitly", () => {
    const data = funnelDashboard([funnelLead(), funnelLead({ id: "test", email: "test@example.invalid" })]);
    expect(buildSalesFunnel(data).testCount).toBe(1); expect(buildSalesFunnel(data).leads).toHaveLength(1);
    expect(buildSalesFunnel(data, true).leads).toHaveLength(2);
  });
  it("places unknown states outside the active value and does not silently turn them into leads", () => {
    const funnel = buildSalesFunnel(funnelDashboard([funnelLead({ opportunityStage: "future-stage" })]));
    expect(funnel.buckets.unknown).toHaveLength(1); expect(funnel.activeValue).toBe(0);
  });
  it("requires a won opportunity and recorded expansion before marking Loyal", () => {
    const data = funnelDashboard([funnelLead({ id: "lead-won", opportunityStage: "won" })]);
    data.clientAccounts = [funnelAccount({ status: "active", healthStatus: "healthy" })];
    expect(buildSalesFunnel(data).buckets.decision).toHaveLength(1);
    data.clientAccounts[0].retainStatus = "expanded";
    expect(buildSalesFunnel(data).buckets.loyal).toHaveLength(1); expect(buildSalesFunnel(data).buckets.decision).toHaveLength(0);
    data.pipelineLeads![0].opportunityStage = "qualified";
    expect(buildSalesFunnel(data).buckets.loyal).toHaveLength(0); expect(buildSalesFunnel(data).buckets.interest).toHaveLength(1);
  });
  it("uses successful repeat/renewal evidence, not a merely identified repeat", () => {
    const data = funnelDashboard([funnelLead({ id: "lead-won", opportunityStage: "won" })]); data.clientAccounts = [funnelAccount()];
    data.retentionOpportunities = [{ id: "repeat-1", clientAccountId: "account-1", opportunityType: "repeat", status: "identified" }] as typeof data.retentionOpportunities;
    expect(buildSalesFunnel(data).buckets.loyal).toHaveLength(0);
    data.retentionOpportunities![0].status = "won";
    expect(buildSalesFunnel(data).buckets.loyal).toHaveLength(1);
  });
  it("surfaces accounts whose lead is missing without counting synthetic clients", () => {
    const data = funnelDashboard([]); data.clientAccounts = [funnelAccount()];
    const funnel = buildSalesFunnel(data); expect(funnel.unlinkedAccounts).toHaveLength(1); expect(funnel.buckets.decision).toHaveLength(0);
  });
  it("does not keep churned accounts in Loyal because of historical expansion", () => {
    const data = funnelDashboard([funnelLead({ id: "lead-won", opportunityStage: "won" })]);
    data.clientAccounts = [funnelAccount({ retainStatus: "expanded", status: "churned" })];
    expect(buildSalesFunnel(data).buckets.loyal).toHaveLength(0);
  });
  it("ignores invalid timestamps and closed-deal deadlines, and prioritizes overdue records", () => {
    expect(funnelAttention(funnelLead({ nextActionDueAt: "bad-date" }), now).overdue).toBe(false);
    expect(funnelAttention(funnelLead({ opportunityStage: "won", nextActionDueAt: "2020-01-01" }), now).overdue).toBe(false);
    const funnel = buildSalesFunnel(funnelDashboard([funnelLead({ id: "healthy" }), funnelLead({ id: "overdue", nextActionDueAt: "2026-10-12T03:00:00Z" })]), false, now);
    expect(funnel.buckets.awareness[0].id).toBe("overdue");
  });
});
