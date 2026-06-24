import { describe, it, expect } from "vitest";
import {
  calculateEvidenceScore,
  getTypeWeight,
  getSourceReliability,
  recalculateCapabilities,
  calculateParticipantScore,
  getCapabilitySummary,
} from "./capability-engine";
import type { Evidence, ParticipantCapability } from "./transformation-types";

describe("capability-engine", () => {
  describe("getTypeWeight", () => {
    it("returns 1.0 for assessment", () => {
      expect(getTypeWeight("assessment")).toBe(1.0);
    });

    it("returns 0.85 for observation", () => {
      expect(getTypeWeight("observation")).toBe(0.85);
    });

    it("returns 0.55 for reflection", () => {
      expect(getTypeWeight("reflection")).toBe(0.55);
    });

    it("returns 0.5 for unknown type", () => {
      expect(getTypeWeight("unknown")).toBe(0.5);
    });
  });

  describe("getSourceReliability", () => {
    it("returns 0.95 for system", () => {
      expect(getSourceReliability("system")).toBe(0.95);
    });

    it("returns 0.9 for facilitator", () => {
      expect(getSourceReliability("facilitator")).toBe(0.9);
    });

    it("returns 0.7 for participant", () => {
      expect(getSourceReliability("participant")).toBe(0.7);
    });

    it("returns 0.7 for unknown source", () => {
      expect(getSourceReliability("unknown")).toBe(0.7);
    });
  });

  describe("calculateEvidenceScore", () => {
    it("calculates score correctly for assessment", () => {
      const evidence: Evidence = {
        id: "1",
        engagement_id: "eng1",
        participant_id: "part1",
        type: "assessment",
        source: "system",
        content: {},
        capability_tags: ["Leadership"],
        confidence_score: 0.9,
        created_at: new Date().toISOString(),
        created_by: null,
      };

      const score = calculateEvidenceScore(evidence);
      // 0.9 * 1.0 * 0.95 * 100 = 85.5 ≈ 86
      expect(score).toBe(86);
    });

    it("calculates score correctly for observation", () => {
      const evidence: Evidence = {
        id: "2",
        engagement_id: "eng1",
        participant_id: "part1",
        type: "observation",
        source: "facilitator",
        content: {},
        capability_tags: ["Communication"],
        confidence_score: 0.8,
        created_at: new Date().toISOString(),
        created_by: null,
      };

      const score = calculateEvidenceScore(evidence);
      // 0.8 * 0.85 * 0.9 * 100 = 61.2 ≈ 61
      expect(score).toBe(61);
    });
  });

  describe("recalculateCapabilities", () => {
    it("recalculates capabilities from evidence", () => {
      const evidence: Evidence[] = [
        {
          id: "1",
          engagement_id: "eng1",
          participant_id: "part1",
          type: "assessment",
          source: "system",
          content: {},
          capability_tags: ["Leadership"],
          confidence_score: 0.9,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        {
          id: "2",
          engagement_id: "eng1",
          participant_id: "part1",
          type: "observation",
          source: "facilitator",
          content: {},
          capability_tags: ["Leadership"],
          confidence_score: 0.8,
          created_at: new Date().toISOString(),
          created_by: null,
        },
      ];

      const result = recalculateCapabilities(evidence, []);
      expect(result.length).toBe(1);
      expect(result[0].capability?.name).toBe("Leadership");
      expect(result[0].evidence_count).toBe(2);
      expect(result[0].score).toBeGreaterThan(0);
    });

    it("handles empty evidence", () => {
      const result = recalculateCapabilities([], []);
      expect(result.length).toBe(0);
    });

    it("preserves existing capabilities with decay", () => {
      const existing: ParticipantCapability[] = [
        {
          id: "cap1",
          participant_id: "part1",
          capability_id: "Leadership",
          score: 80,
          trend: "stable",
          evidence_count: 5,
          last_event_id: null,
          last_updated: new Date().toISOString(),
          capability: { id: "Leadership", name: "Leadership", description: null },
        },
      ];

      const result = recalculateCapabilities([], existing);
      expect(result.length).toBe(1);
      expect(result[0].score).toBe(79); // decay by 1
      expect(result[0].trend).toBe("down");
    });
  });

  describe("calculateParticipantScore", () => {
    it("calculates average score", () => {
      const capabilities: ParticipantCapability[] = [
        { id: "1", participant_id: "p1", capability_id: "c1", score: 80, trend: "up", evidence_count: 5, last_event_id: null, last_updated: "", capability: { id: "c1", name: "C1", description: null } },
        { id: "2", participant_id: "p1", capability_id: "c2", score: 60, trend: "down", evidence_count: 3, last_event_id: null, last_updated: "", capability: { id: "c2", name: "C2", description: null } },
      ];

      expect(calculateParticipantScore(capabilities)).toBe(70);
    });

    it("returns 0 for empty capabilities", () => {
      expect(calculateParticipantScore([])).toBe(0);
    });
  });

  describe("getCapabilitySummary", () => {
    it("returns correct summary", () => {
      const capabilities: ParticipantCapability[] = [
        { id: "1", participant_id: "p1", capability_id: "c1", score: 90, trend: "up", evidence_count: 5, last_event_id: null, last_updated: "", capability: { id: "c1", name: "C1", description: null } },
        { id: "2", participant_id: "p1", capability_id: "c2", score: 60, trend: "down", evidence_count: 3, last_event_id: null, last_updated: "", capability: { id: "c2", name: "C2", description: null } },
        { id: "3", participant_id: "p1", capability_id: "c3", score: 40, trend: "stable", evidence_count: 2, last_event_id: null, last_updated: "", capability: { id: "c3", name: "C3", description: null } },
      ];

      const summary = getCapabilitySummary(capabilities);
      expect(summary.total).toBe(3);
      expect(summary.avgScore).toBe(63);
      expect(summary.highCount).toBe(1);
      expect(summary.mediumCount).toBe(1);
      expect(summary.lowCount).toBe(1);
      expect(summary.improving).toBe(1);
      expect(summary.declining).toBe(1);
    });
  });
});
