// T-BOS Types
// Source: DATA-MODEL.md, STATE-MACHINE.md

import type { MissionCode, DimensionCode, LevelValue } from "./config";

export type ObservationStatus = "draft" | "submitted" | "locked";

export interface TbosObservation {
  id: string;
  teamId: string;
  teamName: string;
  missionId: string;
  missionCode: MissionCode;
  missionName: string;
  profileId: string;
  facilitatorName: string;
  batch: string;
  observedAt: string;
  submittedAt: string;
  status: ObservationStatus;
  notes: string | null;
  scores: TbosObservationScore[];
}

export interface TbosObservationScore {
  dimensionCode: DimensionCode;
  dimensionName: string;
  levelValue: LevelValue;
  levelLabel: string;
}

export interface TbosTeam {
  id: string;
  name: string;
  batch: string;
  members: TbosTeamMember[];
}

export interface TbosTeamMember {
  profileId: string | null;
  memberName: string;
}

export interface TbosFacilitatorTeam {
  teamId: string;
  teamName: string;
}

// --- Scoring Types ---

export interface DimensionScore {
  dimensionCode: DimensionCode;
  dimensionName: string;
  score: number | null;
  observationCount: number;
}

export interface MissionScore {
  missionCode: MissionCode;
  missionName: string;
  tbosScore: number | null;
  dimensionScores: DimensionScore[];
}

export interface TeamScoreSummary {
  teamId: string;
  teamName: string;
  batch: string;
  overallTeamScore: number | null;
  missionScores: MissionScore[];
  dimensionAverages: DimensionScore[];
  strongestDimension: DimensionScore | null;
  weakestDimension: DimensionScore | null;
  totalObservations: number;
}

export interface BatchComparison {
  dimensionCode: DimensionCode;
  dimensionName: string;
  batch1Avg: number | null;
  batch2Avg: number | null;
}

export interface ExecutiveSummary {
  topStrengths: DimensionScore[];
  developmentAreas: DimensionScore[];
  totalTeams: number;
  totalObservations: number;
}

export interface TbosDashboardData {
  teams: TeamScoreSummary[];
  batchComparisons: BatchComparison[];
  executiveSummary: ExecutiveSummary;
  generatedAt: string;
}

// --- Form/Input Types ---

export interface ObservationFormData {
  teamId: string;
  missionCode: MissionCode;
  batch: string;
  scores: Record<DimensionCode, LevelValue>;
  notes: string;
}

export interface ObservationInput {
  teamId: string;
  missionId: string;
  profileId: string;
  batch: string;
  status: ObservationStatus;
  notes?: string;
  scores: {
    dimensionId: string;
    levelValue: LevelValue;
  }[];
}
