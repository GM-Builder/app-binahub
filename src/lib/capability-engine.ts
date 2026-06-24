import type { Evidence, ParticipantCapability, CapabilityTrend } from "./transformation-types";

const EVIDENCE_WEIGHTS: Record<string, number> = {
  assessment: 1.0,
  observation: 0.85,
  feedback: 0.8,
  action_completion: 0.75,
  coaching_note: 0.7,
  survey: 0.65,
  reflection: 0.55,
};

const SOURCE_RELIABILITY: Record<string, number> = {
  system: 0.95,
  facilitator: 0.9,
  manager: 0.85,
  participant: 0.7,
};

export function getTypeWeight(type: string): number {
  return EVIDENCE_WEIGHTS[type] || 0.5;
}

export function getSourceReliability(source: string): number {
  return SOURCE_RELIABILITY[source] || 0.7;
}

export function calculateEvidenceScore(evidence: Evidence): number {
  const confidence = evidence.confidence_score || 0.5;
  const weight = getTypeWeight(evidence.type);
  const reliability = getSourceReliability(evidence.source);
  return Math.round(confidence * weight * reliability * 100);
}

interface CapabilityAggregation {
  capabilityName: string;
  totalWeightedScore: number;
  totalWeight: number;
  evidenceCount: number;
  evidenceIds: string[];
}

export function recalculateCapabilities(
  evidence: Evidence[],
  existingCapabilities: ParticipantCapability[] = []
): ParticipantCapability[] {
  const aggregationMap = new Map<string, CapabilityAggregation>();

  evidence.forEach((ev) => {
    const tags = Array.isArray(ev.capability_tags) ? ev.capability_tags : [];
    tags.forEach((tag) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (!normalizedTag) return;

      const existing = aggregationMap.get(normalizedTag) || {
        capabilityName: tag,
        totalWeightedScore: 0,
        totalWeight: 0,
        evidenceCount: 0,
        evidenceIds: [],
      };

      const score = calculateEvidenceScore(ev);
      const weight = getTypeWeight(ev.type) * getSourceReliability(ev.source);

      existing.totalWeightedScore += score;
      existing.totalWeight += weight;
      existing.evidenceCount += 1;
      existing.evidenceIds.push(ev.id);

      aggregationMap.set(normalizedTag, existing);
    });
  });

  const recalculated: ParticipantCapability[] = [];
  const processedTags = new Set<string>();

  aggregationMap.forEach((agg, tagKey) => {
    processedTags.add(tagKey);
    const newScore = agg.totalWeight > 0
      ? Math.min(100, Math.round(agg.totalWeightedScore / agg.totalWeight))
      : 0;

    const existing = existingCapabilities.find(
      (c) => c.capability?.name?.toLowerCase() === tagKey
    );

    let trend: CapabilityTrend = "stable";
    if (existing) {
      if (newScore > existing.score + 2) trend = "up";
      else if (newScore < existing.score - 2) trend = "down";
    } else {
      trend = "up";
    }

    recalculated.push({
      id: existing?.id || `cap-${tagKey}`,
      participant_id: existing?.participant_id || "",
      capability_id: existing?.capability_id || tagKey,
      score: newScore,
      trend,
      evidence_count: agg.evidenceCount,
      last_event_id: null,
      last_updated: new Date().toISOString(),
      capability: {
        id: tagKey,
        name: agg.capabilityName,
        description: null,
      },
    });
  });

  existingCapabilities.forEach((existing) => {
    const tagKey = existing.capability?.name?.toLowerCase() || "";
    if (!processedTags.has(tagKey)) {
      recalculated.push({
        ...existing,
        score: Math.max(0, existing.score - 1),
        trend: "down",
        last_updated: new Date().toISOString(),
      });
    }
  });

  return recalculated.sort((a, b) => b.score - a.score);
}

function _inferCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("leadership") || lower.includes("kepemimpinan")) return "Kepemimpinan";
  if (lower.includes("communication") || lower.includes("komunikasi")) return "Komunikasi";
  if (lower.includes("collaboration") || lower.includes("kolaborasi")) return "Kolaborasi";
  if (lower.includes("execution") || lower.includes("eksekusi")) return "Eksekusi";
  if (lower.includes("strategic") || lower.includes("strategis")) return "Strategi";
  if (lower.includes("innovation") || lower.includes("inovasi")) return "Inovasi";
  if (lower.includes("problem") || lower.includes("masalah")) return "Pemecahan Masalah";
  if (lower.includes("emotional") || lower.includes("emosi")) return "Kecerdasan Emosional";
  return "Umum";
}

export function calculateEngagementProgress(evidence: Evidence[], participantCount: number): number {
  if (participantCount === 0) return 0;
  const evidencePerParticipant = evidence.length / participantCount;
  return Math.min(100, Math.round(evidencePerParticipant * 10));
}

export function calculateParticipantScore(capabilities: ParticipantCapability[]): number {
  if (capabilities.length === 0) return 0;
  return Math.round(
    capabilities.reduce((sum, c) => sum + c.score, 0) / capabilities.length
  );
}

export function getCapabilitySummary(capabilities: ParticipantCapability[]) {
  const total = capabilities.length;
  const avgScore = calculateParticipantScore(capabilities);
  const highCount = capabilities.filter((c) => c.score >= 80).length;
  const mediumCount = capabilities.filter((c) => c.score >= 50 && c.score < 80).length;
  const lowCount = capabilities.filter((c) => c.score < 50).length;
  const improving = capabilities.filter((c) => c.trend === "up").length;
  const declining = capabilities.filter((c) => c.trend === "down").length;

  return {
    total,
    avgScore,
    highCount,
    mediumCount,
    lowCount,
    improving,
    declining,
  };
}
