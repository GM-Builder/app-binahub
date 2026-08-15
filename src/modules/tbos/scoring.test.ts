import { describe, expect, it } from "vitest";
import { calculateTeamScoreSummary } from "./scoring";
import type { TbosObservation } from "./types";

function observation(overrides: Partial<TbosObservation>): TbosObservation {
  return {
    id: crypto.randomUUID(),
    teamId: "team-1",
    teamName: "Tim Satu",
    missionId: "mission-1",
    missionCode: "lost_detonator",
    missionName: "Lost Detonator Mission",
    profileId: "facilitator-1",
    facilitatorName: "Fasilitator",
    batch: "Batch 1",
    observedAt: "2026-08-08",
    submittedAt: "2026-08-08T10:00:00Z",
    status: "submitted",
    notes: null,
    scores: [
      { dimensionCode: "goal_alignment", dimensionName: "Goal Alignment", levelValue: 4, levelLabel: "Effective" },
      { dimensionCode: "communication", dimensionName: "Communication", levelValue: 3, levelLabel: "Functional" },
      { dimensionCode: "adaptability", dimensionName: "Adaptability", levelValue: 5, levelLabel: "Exemplary" },
    ],
    ...overrides,
  };
}

describe("T-BOS scoring", () => {
  it("averages mission scores and keeps the scale at 1-5", () => {
    const result = calculateTeamScoreSummary("team-1", "Tim Satu", "Batch 1", [
      observation({}),
      observation({
        id: "observation-2",
        scores: [
          { dimensionCode: "goal_alignment", dimensionName: "Goal Alignment", levelValue: 2, levelLabel: "Emerging" },
          { dimensionCode: "communication", dimensionName: "Communication", levelValue: 5, levelLabel: "Exemplary" },
          { dimensionCode: "adaptability", dimensionName: "Adaptability", levelValue: 3, levelLabel: "Functional" },
        ],
      }),
    ]);

    expect(result.overallTeamScore).toBe(3.7);
    expect(result.totalObservations).toBe(2);
    expect(result.missionScores[0].tbosScore).toBe(3.7);
  });

  it("excludes draft observations", () => {
    const result = calculateTeamScoreSummary("team-1", "Tim Satu", "Batch 1", [
      observation({}),
      observation({ id: "draft", status: "draft", scores: [
        { dimensionCode: "goal_alignment", dimensionName: "Goal Alignment", levelValue: 1, levelLabel: "Reactive" },
        { dimensionCode: "communication", dimensionName: "Communication", levelValue: 1, levelLabel: "Reactive" },
        { dimensionCode: "adaptability", dimensionName: "Adaptability", levelValue: 1, levelLabel: "Reactive" },
      ] }),
    ]);

    expect(result.overallTeamScore).toBe(4);
    expect(result.totalObservations).toBe(1);
  });

  it("does not mix a shared dimension across different missions", () => {
    const result = calculateTeamScoreSummary("team-1", "Tim Satu", "Batch 1", [
      observation({
        scores: [
          { dimensionCode: "goal_alignment", dimensionName: "Goal Alignment", levelValue: 5, levelLabel: "Exemplary" },
          { dimensionCode: "communication", dimensionName: "Communication", levelValue: 5, levelLabel: "Exemplary" },
          { dimensionCode: "adaptability", dimensionName: "Adaptability", levelValue: 5, levelLabel: "Exemplary" },
        ],
      }),
      observation({
        id: "goldsmith-observation",
        missionId: "mission-2",
        missionCode: "goldsmith_precision",
        missionName: "Goldsmith Precision Lab",
        scores: [
          { dimensionCode: "communication", dimensionName: "Communication", levelValue: 1, levelLabel: "Reactive" },
          { dimensionCode: "execution_discipline", dimensionName: "Execution Discipline", levelValue: 1, levelLabel: "Reactive" },
          { dimensionCode: "accountability", dimensionName: "Accountability", levelValue: 1, levelLabel: "Reactive" },
        ],
      }),
    ]);

    expect(result.missionScores.find((mission) => mission.missionCode === "lost_detonator")?.tbosScore).toBe(5);
    expect(result.missionScores.find((mission) => mission.missionCode === "goldsmith_precision")?.tbosScore).toBe(1);
    expect(result.overallTeamScore).toBe(3);
  });
});
