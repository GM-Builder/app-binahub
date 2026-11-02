import { describe, expect, it } from "vitest";
import {
  parseServiceHealthResponse,
  healthWarning,
} from "./service-health-contract";
import { syntheticServiceHealth } from "@/test/fixtures/service-health";
describe("admin health contract", () => {
  it("accepts unknown explicitly but never substitutes zeros or a healthy label", () => {
    expect(
      healthWarning(
        parseServiceHealthResponse(syntheticServiceHealth("setup_required")),
      ),
    ).toContain("belum dapat dipastikan");
    expect(
      healthWarning(
        parseServiceHealthResponse(syntheticServiceHealth("unavailable")),
      ),
    ).toContain("belum dapat diperiksa");
    expect(() => parseServiceHealthResponse({ success: true })).toThrow();
  });
  it("rejects stale/partial evidence and distinguishes queues from heartbeat", () => {
    expect(
      healthWarning(parseServiceHealthResponse(syntheticServiceHealth())),
    ).toBe("");
    expect(
      healthWarning(
        parseServiceHealthResponse(syntheticServiceHealth("never_seen")),
      ),
    ).toContain("belum terbukti");
    expect(
      healthWarning(
        parseServiceHealthResponse(syntheticServiceHealth("attention")),
      ),
    ).toContain("pekerjaan terlambat");
    expect(() =>
      parseServiceHealthResponse(
        syntheticServiceHealth(),
        Date.now() + 180_000,
      ),
    ).toThrow("SERVICE_HEALTH_STALE");
    const incomplete = syntheticServiceHealth();
    if ("queues" in incomplete.health) incomplete.health.queues = [];
    expect(() => parseServiceHealthResponse(incomplete)).toThrow();
  });
});
