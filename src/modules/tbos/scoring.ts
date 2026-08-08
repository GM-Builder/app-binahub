// T-BOS Scoring Logic
// Source: SCORING-LOGIC.md

import type {
  DimensionCode,
  LevelValue,
  MissionCode,
} from "./config";
import { MISSIONS, DIMENSIONS, LEVEL_LABELS } from "./config";
import type {
  DimensionScore,
  MissionScore,
  TeamScoreSummary,
  BatchComparison,
  ExecutiveSummary,
  TbosDashboardData,
  TbosObservation,
} from "./types";

// --- Core scoring functions ---

/**
 * Calculate Dimension Score for a team.
 * = average of all level_values from observation_scores
 *   for that team & dimension (across submitted/locked observations).
 * Returns null if no observations exist (not 0 — see SCORING-LOGIC.md §3).
 */
export function calculateDimensionScore(
  observations: TbosObservation[],
  dimensionCode: DimensionCode
): { score: number | null; count: number } {
  const values: number[] = [];

  for (const obs of observations) {
    if (obs.status === "draft") continue;
    const score = obs.scores.find((s) => s.dimensionCode === dimensionCode);
    if (score) {
      values.push(score.levelValue);
    }
  }

  if (values.length === 0) {
    return { score: null, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  return { score: round1(sum / values.length), count: values.length };
}

/**
 * Calculate T-BOS Score for a specific mission.
 * = average of Dimension Scores for dimensions relevant to that mission.
 * Only counts dimensions that have been observed (null scores excluded).
 */
export function calculateTbosScore(
  observations: TbosObservation[],
  missionCode: MissionCode
): { score: number | null; dimensionScores: DimensionScore[] } {
  const mission = MISSIONS[missionCode];
  if (!mission) return { score: null, dimensionScores: [] };

  const dimensionScores: DimensionScore[] = [];
  const validScores: number[] = [];

  for (const dimCode of mission.dimensions) {
    const { score, count } = calculateDimensionScore(observations, dimCode);
    const dim = DIMENSIONS[dimCode];
    dimensionScores.push({
      dimensionCode: dimCode,
      dimensionName: dim.name,
      score,
      observationCount: count,
    });
    if (score !== null) {
      validScores.push(score);
    }
  }

  if (validScores.length === 0) {
    return { score: null, dimensionScores };
  }

  const sum = validScores.reduce((a, b) => a + b, 0);
  return { score: round1(sum / validScores.length), dimensionScores };
}

/**
 * Calculate Overall Team Score.
 * = average of T-BOS Scores from all missions the team participated in.
 * (ADR-005: using average, not sum — keeps scale 1-5)
 */
export function calculateOverallTeamScore(
  missionScores: MissionScore[]
): number | null {
  const validScores = missionScores
    .map((m) => m.tbosScore)
    .filter((s): s is number => s !== null);

  if (validScores.length === 0) return null;

  const sum = validScores.reduce((a, b) => a + b, 0);
  return round1(sum / validScores.length);
}

/**
 * Calculate all scores for a single team across all missions.
 */
export function calculateTeamScoreSummary(
  teamId: string,
  teamName: string,
  batch: string,
  observations: TbosObservation[]
): TeamScoreSummary {
  const teamObservations = observations.filter((o) => o.teamId === teamId);

  const missionScores: MissionScore[] = [];
  const missionsObserved = new Set<MissionCode>();

  for (const obs of teamObservations) {
    missionsObserved.add(obs.missionCode);
  }

  for (const missionCode of missionsObserved) {
    const mission = MISSIONS[missionCode];
    if (!mission) continue; // skip unknown mission codes from DB
    const { score, dimensionScores } = calculateTbosScore(teamObservations, missionCode);
    missionScores.push({
      missionCode,
      missionName: mission.name,
      tbosScore: score,
      dimensionScores,
    });
  }

  const overallTeamScore = calculateOverallTeamScore(missionScores);

  // Calculate dimension averages across all observations for this team
  const allDimensions = Object.keys(DIMENSIONS) as DimensionCode[];
  const dimensionAverages: DimensionScore[] = allDimensions.map((dimCode) => {
    const { score, count } = calculateDimensionScore(teamObservations, dimCode);
    return {
      dimensionCode: dimCode,
      dimensionName: DIMENSIONS[dimCode].name,
      score,
      observationCount: count,
    };
  });

  // Find strongest and weakest dimensions (only among observed dimensions)
  const observedDims = dimensionAverages.filter((d) => d.score !== null);
  const sortedByScore = [...observedDims].sort((a, b) => (b.score || 0) - (a.score || 0));

  const strongestDimension = sortedByScore[0] || null;
  const weakestDimension = sortedByScore[sortedByScore.length - 1] || null;

  return {
    teamId,
    teamName,
    batch,
    overallTeamScore,
    missionScores,
    dimensionAverages,
    strongestDimension,
    weakestDimension,
    totalObservations: teamObservations.filter((o) => o.status !== "draft").length,
  };
}

/**
 * Calculate batch comparisons (average per dimension per batch).
 */
export function calculateBatchComparisons(
  observations: TbosObservation[]
): BatchComparison[] {
  const allDimensions = Object.keys(DIMENSIONS) as DimensionCode[];

  return allDimensions.map((dimCode) => {
    const dim = DIMENSIONS[dimCode];

    const batch1Values: number[] = [];
    const batch2Values: number[] = [];

    for (const obs of observations) {
      if (obs.status === "draft") continue;
      const score = obs.scores.find((s) => s.dimensionCode === dimCode);
      if (!score) continue;

      if (obs.batch === "Batch 1") {
        batch1Values.push(score.levelValue);
      } else if (obs.batch === "Batch 2") {
        batch2Values.push(score.levelValue);
      }
    }

    return {
      dimensionCode: dimCode,
      dimensionName: dim.name,
      batch1Avg: batch1Values.length > 0 ? round1(batch1Values.reduce((a, b) => a + b, 0) / batch1Values.length) : null,
      batch2Avg: batch2Values.length > 0 ? round1(batch2Values.reduce((a, b) => a + b, 0) / batch2Values.length) : null,
    };
  });
}

/**
 * Generate executive summary: top 3 strengths & 3 development areas.
 */
export function calculateExecutiveSummary(
  teamSummaries: TeamScoreSummary[]
): ExecutiveSummary {
  // Collect all dimension scores across all teams
  const dimensionAggregates = new Map<DimensionCode, { total: number; count: number }>();

  for (const team of teamSummaries) {
    for (const dim of team.dimensionAverages) {
      if (dim.score === null) continue;
      const existing = dimensionAggregates.get(dim.dimensionCode) || { total: 0, count: 0 };
      existing.total += dim.score;
      existing.count += 1;
      dimensionAggregates.set(dim.dimensionCode, existing);
    }
  }

  const dimensionAverages: DimensionScore[] = [];
  let totalObservations = 0;

  for (const [dimCode, agg] of dimensionAggregates) {
    dimensionAverages.push({
      dimensionCode: dimCode,
      dimensionName: DIMENSIONS[dimCode].name,
      score: round1(agg.total / agg.count),
      observationCount: agg.count,
    });
  }

  for (const team of teamSummaries) {
    totalObservations += team.totalObservations;
  }

  const sorted = [...dimensionAverages].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Prevent overlap: only include development areas that are NOT in topStrengths
  const strengthCount = Math.min(3, sorted.length);
  const topStrengths = sorted.slice(0, strengthCount);
  const strengthCodes = new Set(topStrengths.map((d) => d.dimensionCode));
  const developmentAreas = sorted
    .slice(strengthCount)
    .filter((d) => !strengthCodes.has(d.dimensionCode))
    .slice(-3)
    .reverse();

  return {
    topStrengths,
    developmentAreas,
    totalTeams: teamSummaries.length,
    totalObservations,
  };
}

/**
 * Generate full dashboard data from raw observations.
 */
export function generateDashboardData(
  teams: { id: string; name: string; batch: string }[],
  observations: TbosObservation[]
): TbosDashboardData {
  const teamSummaries = teams.map((team) =>
    calculateTeamScoreSummary(team.id, team.name, team.batch, observations)
  );

  const batchComparisons = calculateBatchComparisons(observations);
  const executiveSummary = calculateExecutiveSummary(teamSummaries);

  return {
    teams: teamSummaries,
    batchComparisons,
    executiveSummary,
    generatedAt: new Date().toISOString(),
  };
}

// --- Helpers ---

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getLevelLabel(value: LevelValue): string {
  return LEVEL_LABELS[value];
}

export function formatScore(score: number | null): string {
  if (score === null) return "-";
  return score.toFixed(1);
}

// --- Narrative Text Generation ---

export interface ExecutiveNarrative {
  overview: string;
  strengthsNarrative: string[];
  developmentNarrative: string[];
  recommendation: string;
}

export function generateExecutiveNarrative(
  summary: ExecutiveSummary,
  batchComparisons: BatchComparison[]
): ExecutiveNarrative {
  const { topStrengths, developmentAreas, totalTeams, totalObservations } = summary;

  // Overview paragraph
  const avgScore =
    topStrengths.length > 0
      ? (topStrengths.reduce((a, b) => a + (b.score || 0), 0) / topStrengths.length).toFixed(1)
      : "0";
  const overview = `Berdasarkan ${totalObservations} observasi perilaku dari ${totalTeams} tim, rata-rata skor dimensi perilaku organisasi berada pada level ${avgScore} dari skala 5.0. ${topStrengths.length > 0 ? `Dimensi perilaku yang paling menonjol adalah ${topStrengths[0].dimensionName} dengan skor rata-rata ${topStrengths[0].score?.toFixed(1)}.` : ""} ${developmentAreas.length > 0 ? `Sementara itu, area yang paling membutuhkan perhatian adalah ${developmentAreas[0].dimensionName} dengan skor ${developmentAreas[0].score?.toFixed(1)}.` : ""}`;

  // Strengths narratives
  const strengthsNarrative = topStrengths.map((dim, i) => {
    const level = getScoreLevelLabel(dim.score);
    return `${i + 1}. ${dim.dimensionName} — Skor ${dim.score?.toFixed(1)}/5 (${level}). Dimensi ini menunjukkan ${level === "Sangat Baik" ? "kapabilitas tim yang sudah solid dan menjadi pondasi kekuatan organisasi" : level === "Baik" ? "praktik yang sudah berjalan baik dengan ruang pengembangan minimal" : "praktik yang sudah berfungsi namun dapat ditingkatkan lebih lanjut"}. Terobservasi pada ${dim.observationCount} observasi.`;
  });

  // Development narratives
  const developmentNarrative = developmentAreas.map((dim, i) => {
    const level = getScoreLevelLabel(dim.score);
    const batchInfo = getBatchInsight(dim.dimensionCode, batchComparisons);
    return `${i + 1}. ${dim.dimensionName} — Skor ${dim.score?.toFixed(1)}/5 (${level}). ${level === "Perlu Perhatian" ? "Dimensi ini menunjukkan kesenjangan signifikan dalam perilaku tim dan perlu menjadi prioritas pengembangan." : level === "Cukup" ? "Dimensi ini berada pada level fungsional namun belum konsisten di seluruh tim." : "Dimensi ini sudah berjalan tetapi masih ada ruang untuk peningkatan."} ${batchInfo} Terobservasi pada ${dim.observationCount} observasi.`;
  });

  // Recommendation
  const topDev = developmentAreas[0];
  const topStr = topStrengths[0];
  const recommendation = topDev
    ? `Rekomendasi prioritas: Fokus program pengembangan pada ${topDev.dimensionName} sebagai area dengan skor terendah (${topDev.score?.toFixed(1)}), dengan memanfaatkan kekuatan existing di ${topStr?.dimensionName || "dimensi unggulan"} sebagai model praktik terbaik untuk di-replikasi.`
    : "Belum cukup data untuk memberikan rekomendasi spesifik. Lanjutkan observasi untuk mendapatkan insight yang lebih komprehensif.";

  return { overview, strengthsNarrative, developmentNarrative, recommendation };
}

function getScoreLevelLabel(score: number | null | undefined): string {
  if (score === null || score === undefined) return "Tidak Tersedia";
  if (score >= 4.5) return "Sangat Baik";
  if (score >= 3.5) return "Baik";
  if (score >= 2.5) return "Cukup";
  if (score >= 1.5) return "Perlu Perhatian";
  return "Kritis";
}

function getBatchInsight(
  dimCode: DimensionCode,
  batchComparisons: BatchComparison[]
): string {
  const bc = batchComparisons.find((b) => b.dimensionCode === dimCode);
  if (!bc || bc.batch1Avg === null || bc.batch2Avg === null) return "";
  const diff = bc.batch2Avg - bc.batch1Avg;
  if (Math.abs(diff) < 0.2) return "Tidak ada perbedaan signifikan antar batch. ";
  if (diff > 0) return `Batch 2 menunjukkan peningkatan (+${diff.toFixed(1)}) dibanding Batch 1. `;
  return `Batch 2 menunjukkan penurunan (${diff.toFixed(1)}) dibanding Batch 1. `;
}
