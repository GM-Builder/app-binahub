// T-BOS API Client — HTTP Fetch to binahub-api Backend via /api/tbos/*
// Sources: ARCHITECTURE.md, ADR-006, ApiFetchBridge

import type { MissionCode, DimensionCode, LevelValue } from "./config";
import { MISSIONS, getMissionDimensions, getDimensionLevels } from "./config";

export interface TbosDbMission {
  id: string;
  code: string;
  name: string;
  description: string;
  dimensions: {
    id: string;
    code: string;
    name: string;
    question: string;
    order_index: number;
    levels: {
      level_value: number;
      level_label: string;
      description: string;
    }[];
  }[];
}

export interface TbosDbTeam {
  id: string;
  name: string;
  batch: string;
  members: {
    profile_id: string | null;
    member_name: string;
    is_captain?: boolean;
  }[];
}

export interface TbosDbObservation {
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
  status: "draft" | "submitted" | "locked";
  notes: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  revisionDeadline: string | null;
  canEdit: boolean;
  scores: {
    dimensionId: string;
    dimensionCode: DimensionCode;
    dimensionName: string;
    levelValue: number;
  }[];
}

export interface TbosDbAuditEntry {
  id: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  changes: any;
  createdAt: string;
}

export interface TbosDbObservationDetail extends TbosDbObservation {
  auditLog: TbosDbAuditEntry[];
  dimensions: {
    id: string;
    code: string;
    name: string;
    levels: { level_value: number; level_label: string; description: string }[];
  }[];
}

export interface QueuedObservation {
  id: string;
  teamId: string;
  missionId: string;
  batch: string;
  notes: string;
  scores: { dimensionId: string; levelValue: number }[];
  createdAt: string;
}

// ============================================================
// 1. DATA ACCESS FUNCTIONS (HTTP fetch to /api/tbos/*)
// ============================================================

/**
 * Fetch assigned missions for facilitator from backend API.
 */
export async function fetchMissions(profileId?: string): Promise<TbosDbMission[]> {
  try {
    const res = await fetch("/api/tbos/missions");
    const data = await res.json();
    if (data.success && Array.isArray(data.missions)) {
      return data.missions;
    }
  } catch (err) {
    console.warn("[T-BOS API Client] Failed fetching /api/tbos/missions, fallback to local config:", err);
  }

  // Fallback to local config if offline or endpoint not reachable
  return Object.values(MISSIONS).map((m) => ({
    id: m.code,
    code: m.code,
    name: m.name,
    description: m.description,
    dimensions: getMissionDimensions(m.code).map((d) => ({
      id: d.code,
      code: d.code,
      name: d.name,
      question: d.question,
      order_index: d.orderIndex,
      levels: getDimensionLevels(d.code).map((l) => ({
        level_value: l.levelValue,
        level_label: l.levelLabel,
        description: l.description,
      })),
    })),
  }));
}

/**
 * Fetch active teams from backend API.
 */
export async function fetchTeams(): Promise<TbosDbTeam[]> {
  try {
    const res = await fetch("/api/tbos/teams");
    const data = await res.json();
    if (data.success && Array.isArray(data.teams)) {
      return data.teams;
    }
  } catch (err) {
    console.warn("[T-BOS API Client] Failed fetching /api/tbos/teams, fallback to default teams:", err);
  }

  return [
    { id: "team-alpha", name: "Alpha", batch: "Batch 1", members: [{ profile_id: null, member_name: "Anggota 1" }] },
    { id: "team-bravo", name: "Bravo", batch: "Batch 1", members: [{ profile_id: null, member_name: "Anggota 2" }] },
    { id: "team-charlie", name: "Charlie", batch: "Batch 2", members: [{ profile_id: null, member_name: "Anggota 3" }] },
    { id: "team-delta", name: "Delta", batch: "Batch 2", members: [{ profile_id: null, member_name: "Anggota 4" }] },
  ];
}

/**
 * Create a new team via POST /api/tbos/teams (admin only).
 */
export async function createTeam(input: {
  name: string;
  batch: "Batch 1" | "Batch 2";
  organizationId?: string;
}): Promise<{ success: boolean; team?: any; error?: string }> {
  try {
    const res = await fetch("/api/tbos/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (data.success) {
      return { success: true, team: data.team };
    }
    return { success: false, error: data.error || "Gagal membuat tim." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal terhubung ke backend API." };
  }
}

/**
 * Submit observation to backend API via POST /api/tbos/observations.
 */
export async function submitObservation(input: {
  teamId: string;
  missionId: string;
  profileId: string;
  batch: string;
  notes?: string;
  scores: { dimensionId: string; levelValue: number }[];
}): Promise<{ success: boolean; observationId?: string; error?: string }> {
  try {
    const res = await fetch("/api/tbos/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await res.json();

    if (data.success) {
      clearDraft(input.teamId, input.missionId);
      return { success: true, observationId: data.observationId || data.id };
    }

    return { success: false, error: data.error || "Gagal menyimpan observasi." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal terhubung ke backend API." };
  }
}

/**
 * Fetch observations list from GET /api/tbos/observations.
 */
export async function fetchObservations(
  profileId: string,
  isAdmin: boolean = false
): Promise<TbosDbObservation[]> {
  try {
    const res = await fetch("/api/tbos/observations");
    const data = await res.json();
    if (data.success && Array.isArray(data.observations)) {
      return data.observations;
    }
  } catch (err) {
    console.error("[T-BOS API Client] Error fetching observations:", err);
  }
  return [];
}

/**
 * Fetch single observation detail from GET /api/tbos/observations/[id].
 */
export async function fetchObservationDetail(
  observationId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<TbosDbObservationDetail | null> {
  try {
    const res = await fetch(`/api/tbos/observations/${observationId}`);
    const data = await res.json();
    if (data.success && data.observation) {
      return data.observation;
    }
  } catch (err) {
    console.error("[T-BOS API Client] Error fetching observation detail:", err);
  }
  return null;
}

/**
 * Edit observation via PATCH /api/tbos/observations/[id].
 */
export async function updateObservation(
  observationId: string,
  input: {
    notes?: string;
    scores?: { dimensionId: string; levelValue: number }[];
    actorId: string;
    actorRole: "facilitator" | "admin";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/tbos/observations/${observationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        notes: input.notes,
        scores: input.scores,
      }),
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || "Gagal mengupdate observasi." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal terhubung ke backend API." };
  }
}

/**
 * Lock or Unlock observation via PATCH /api/tbos/observations/[id].
 */
export async function toggleLockObservation(
  observationId: string,
  action: "lock" | "unlock",
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/tbos/observations/${observationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || "Gagal mengubah status lock." };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal terhubung ke backend API." };
  }
}

/**
 * Fetch raw data for Admin Dashboard calculations from GET /api/tbos/dashboard.
 */
export async function fetchDashboardRawData(): Promise<{
  teams: { id: string; name: string; batch: string }[];
  observations: any[];
}> {
  try {
    const res = await fetch("/api/tbos/dashboard");
    const data = await res.json();
    if (data.success) {
      return {
        teams: data.teams || [],
        observations: data.observations || [],
      };
    }
  } catch (err) {
    console.error("[T-BOS API Client] Error fetching dashboard data:", err);
  }

  const teams = await fetchTeams();
  return { teams, observations: [] };
}

/**
 * Fetch Participant Team Info from GET /api/tbos/participant/team-info.
 */
export async function fetchParticipantTeamInfo(userId: string): Promise<{
  teamName: string;
  batch: string;
  missionsCompleted: number;
  overallScore: number | null;
  strongestDimension: string | null;
  weakestDimension: string | null;
  rank: number | null;
} | null> {
  try {
    const res = await fetch("/api/tbos/participant/team-info");
    const data = await res.json();
    if (data.success && data.teamInfo) {
      return data.teamInfo;
    }
  } catch (err) {
    console.warn("[T-BOS API Client] Participant team info API not reachable, calculating locally:", err);
  }

  // Fallback local calculation
  const { teams, observations } = await fetchDashboardRawData();
  if (teams.length === 0) return null;

  const { calculateTeamScoreSummary, generateDashboardData } = await import("./scoring");
  const firstTeam = teams[0];
  const summary = calculateTeamScoreSummary(firstTeam.id, firstTeam.name, firstTeam.batch, observations);
  const dashboard = generateDashboardData(teams, observations);

  const sortedTeams = [...dashboard.teams].sort((a, b) => (b.overallTeamScore || 0) - (a.overallTeamScore || 0));
  const rankIndex = sortedTeams.findIndex((t) => t.teamId === firstTeam.id);

  return {
    teamName: firstTeam.name,
    batch: firstTeam.batch,
    missionsCompleted: summary.missionScores.length,
    overallScore: summary.overallTeamScore,
    strongestDimension: summary.strongestDimension?.dimensionName || null,
    weakestDimension: summary.weakestDimension?.dimensionName || null,
    rank: rankIndex !== -1 ? rankIndex + 1 : null,
  };
}

// ============================================================
// 2. OFFLINE-FIRST STORAGE ENGINE (ADR-006)
// ============================================================

const DRAFT_KEY_PREFIX = "tbos_draft_";
const QUEUE_KEY = "tbos_queued_observations";

export function saveDraft(teamId: string, missionId: string, scores: Record<string, LevelValue>, notes: string) {
  if (typeof window === "undefined") return;
  const key = `${DRAFT_KEY_PREFIX}${teamId}_${missionId}`;
  localStorage.setItem(key, JSON.stringify({ scores, notes, updatedAt: new Date().toISOString() }));
}

export function loadDraft(teamId: string, missionId: string): { scores: Record<string, LevelValue>; notes: string } | null {
  if (typeof window === "undefined") return null;
  const key = `${DRAFT_KEY_PREFIX}${teamId}_${missionId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(teamId: string, missionId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${teamId}_${missionId}`);
}

export function queueObservation(input: {
  teamId: string;
  missionId: string;
  batch: string;
  notes: string;
  scores: { dimensionId: string; levelValue: number }[];
}) {
  if (typeof window === "undefined") return;
  const queued = getQueuedObservations();
  const newItem: QueuedObservation = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ...input,
    createdAt: new Date().toISOString(),
  };
  queued.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queued));
}

export function getQueuedObservations(): QueuedObservation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function flushQueuedObservations(profileId: string): Promise<number> {
  const queued = getQueuedObservations();
  if (queued.length === 0) return 0;

  let successCount = 0;
  const remaining: QueuedObservation[] = [];

  for (const item of queued) {
    const res = await submitObservation({
      teamId: item.teamId,
      missionId: item.missionId,
      profileId,
      batch: item.batch,
      notes: item.notes,
      scores: item.scores,
    });

    if (res.success) {
      successCount++;
    } else {
      remaining.push(item);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  }

  return successCount;
}
