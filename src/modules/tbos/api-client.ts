// T-BOS API Client — HTTP Fetch to binahub-api Backend via /api/tbos/*
// Sources: ARCHITECTURE.md, ADR-006, ApiFetchBridge

import type { MissionCode, DimensionCode, LevelValue } from "./config";

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
    id: string;
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
  members: TbosObservationMemberSnapshot[];
  scores: {
    dimensionId: string;
    dimensionCode: DimensionCode;
    dimensionName: string;
    levelValue: number;
  }[];
}

export interface TbosObservationMemberSnapshot {
  id: string;
  teamMemberId: string | null;
  memberName: string;
  isPresent: boolean;
  isCaptain: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TbosObservationMemberInput {
  teamMemberId?: string | null;
  memberName: string;
  isPresent: boolean;
  isCaptain: boolean;
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
  profileId: string;
  clientSubmissionId?: string;
  teamId: string;
  missionId: string;
  batch: string;
  notes: string;
  scores: { dimensionId: string; levelValue: number }[];
  members?: TbosObservationMemberInput[];
  createdAt: string;
}

// ============================================================
// 1. DATA ACCESS FUNCTIONS (HTTP fetch to /api/tbos/*)
// ============================================================

/**
 * Fetch assigned missions for facilitator from backend API.
 */
export async function fetchMissions(): Promise<TbosDbMission[]> {
  const res = await fetch("/api/tbos/missions");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !Array.isArray(data.missions)) {
    throw new Error(data.error || "Gagal memuat daftar misi.");
  }
  return data.missions;
}

/**
 * Fetch active teams from backend API.
 */
export async function fetchTeams(): Promise<TbosDbTeam[]> {
  const res = await fetch("/api/tbos/teams");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !Array.isArray(data.teams)) {
    throw new Error(data.error || "Gagal memuat daftar tim.");
  }
  return data.teams;
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
  clientSubmissionId?: string;
  profileId: string;
  batch: string;
  notes?: string;
  scores: { dimensionId: string; levelValue: number }[];
  members?: TbosObservationMemberInput[];
}): Promise<{ success: boolean; observationId?: string; error?: string; retryable?: boolean }> {
  try {
    let members = input.members;
    if (!members) {
      const team = (await fetchTeams()).find((candidate) => candidate.id === input.teamId);
      if (!team) throw new Error("Tim untuk snapshot anggota tidak ditemukan.");
      members = team.members.map((member) => ({
        teamMemberId: member.id,
        memberName: member.member_name,
        isPresent: true,
        isCaptain: Boolean(member.is_captain),
      }));
    }

    const res = await fetch("/api/tbos/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        members,
        clientSubmissionId: input.clientSubmissionId || crypto.randomUUID(),
      }),
    });

    const data = await res.json();

    if (data.success) {
      clearDraft(input.teamId, input.missionId);
      return { success: true, observationId: data.observationId || data.id };
    }

    return {
      success: false,
      error: data.error || "Gagal menyimpan observasi.",
      retryable: res.status >= 500,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal terhubung ke backend API.", retryable: true };
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
    const data = await res.json().catch(() => ({}));
    if (data.success && Array.isArray(data.observations)) {
      return data.observations;
    }
    throw new Error(data.error || `Gagal memuat observasi (HTTP ${res.status}).`);
  } catch (err) {
    console.error("[T-BOS API Client] Error fetching observations:", err);
    throw err instanceof Error ? err : new Error("Gagal memuat observasi.");
  }
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
export interface TbosViewerStats {
  role: "admin" | "facilitator";
  assignedTeamCount: number | null;
  organizationCount: number | null;
  scopedTeamCount: number;
  ownObservationCount: number;
  ownTeamsObserved: number;
  ownAverageScore: number | null;
}

export async function fetchDashboardRawData(): Promise<{
  teams: { id: string; name: string; batch: string }[];
  observations: any[];
  viewerStats: TbosViewerStats | null;
}> {
  const res = await fetch("/api/tbos/dashboard");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const detail = data.detail || data.hint || data.code;
    throw new Error(detail ? `${data.error || "Gagal memuat dashboard T-BOS."} (${detail})` : data.error || "Gagal memuat dashboard T-BOS.");
  }
  return {
    teams: data.teams || [],
    observations: data.observations || [],
    viewerStats: data.viewerStats || null,
  };
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
  const res = await fetch("/api/tbos/participant/team-info");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Gagal memuat data tim peserta.");
  }
  return data.teamInfo || null;
}

// ============================================================
// 2. OFFLINE-FIRST STORAGE ENGINE (ADR-006)
// ============================================================

const DRAFT_KEY_PREFIX = "tbos_draft_";
const QUEUE_KEY_PREFIX = "tbos_queued_observations_";

function queueKey(profileId: string) {
  return `${QUEUE_KEY_PREFIX}${profileId}`;
}

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

export function queueObservation(profileId: string, input: {
  teamId: string;
  missionId: string;
  clientSubmissionId?: string;
  batch: string;
  notes: string;
  scores: { dimensionId: string; levelValue: number }[];
  members?: TbosObservationMemberInput[];
}) {
  if (typeof window === "undefined") return;
  const queued = getQueuedObservations(profileId);
  const newItem: QueuedObservation = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    profileId,
    ...input,
    clientSubmissionId: input.clientSubmissionId || crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  queued.push(newItem);
  localStorage.setItem(queueKey(profileId), JSON.stringify(queued));
}

export function getQueuedObservations(profileId: string): QueuedObservation[] {
  if (typeof window === "undefined") return [];
  if (!profileId) return [];
  const raw = localStorage.getItem(queueKey(profileId));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function flushQueuedObservations(profileId: string): Promise<number> {
  const queued = getQueuedObservations(profileId).filter((item) => item.profileId === profileId);
  if (queued.length === 0) return 0;

  let successCount = 0;
  const remaining: QueuedObservation[] = [];
  let teams: TbosDbTeam[] | undefined;

  for (const item of queued) {
    if (!item.members) {
      try {
        teams ||= await fetchTeams();
        const team = teams.find((candidate) => candidate.id === item.teamId);
        if (!team) throw new Error("Tim untuk snapshot anggota tidak ditemukan.");
        item.members = team.members.map((member) => ({
          teamMemberId: member.id,
          memberName: member.member_name,
          isPresent: true,
          isCaptain: Boolean(member.is_captain),
        }));
        localStorage.setItem(queueKey(profileId), JSON.stringify(queued));
      } catch {
        remaining.push(item);
        continue;
      }
    }

    const res = await submitObservation({
      teamId: item.teamId,
      missionId: item.missionId,
      clientSubmissionId: item.clientSubmissionId || item.id,
      profileId,
      batch: item.batch,
      notes: item.notes,
      scores: item.scores,
      members: item.members,
    });

    if (res.success) {
      successCount++;
    } else {
      remaining.push(item);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(queueKey(profileId), JSON.stringify(remaining));
  }

  return successCount;
}
