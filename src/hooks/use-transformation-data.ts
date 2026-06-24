"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Action,
  Engagement,
  Evidence,
  EventQueue,
  Insight,
  ParticipantCapability,
  ParticipantTimeline,
} from "@/lib/transformation-types";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

export function useEngagements() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<{ success: boolean; engagements: Engagement[] }>("/api/engagements")
      .then((res) => {
        if (alive) {
          setEngagements(res.engagements || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load engagements");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, []);

  return { engagements, loading, error };
}

export function useEngagement(id: string | null) {
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let alive = true;
    apiFetch<{ success: boolean; engagement: Engagement }>(`/api/engagements/${id}`)
      .then((res) => {
        if (alive) {
          setEngagement(res.engagement || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load engagement");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [id]);

  return { engagement, loading, error };
}

export function useEvidence(params?: { engagement_id?: string; participant_id?: string; key?: number }) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParts: string[] = [];
  if (params?.engagement_id) queryParts.push(`engagement_id=${params.engagement_id}`);
  if (params?.participant_id) queryParts.push(`participant_id=${params.participant_id}`);
  const query = queryParts.length ? `?${queryParts.join("&")}` : "";
  const deps = [query, params?.key];

  useEffect(() => {
    let alive = true;
    apiFetch<{ success: boolean; evidence: Evidence[] }>(`/api/evidence${query}`)
      .then((res) => {
        if (alive) {
          setEvidence(res.evidence || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load evidence");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, deps);

  return { evidence, loading, error };
}

export function useActions(params?: { participant_id?: string; engagement_id?: string }) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParts: string[] = [];
  if (params?.participant_id) queryParts.push(`participant_id=${params.participant_id}`);
  if (params?.engagement_id) queryParts.push(`engagement_id=${params.engagement_id}`);
  const query = queryParts.length ? `?${queryParts.join("&")}` : "";

  useEffect(() => {
    let alive = true;
    apiFetch<{ success: boolean; actions: Action[] }>(`/api/actions${query}`)
      .then((res) => {
        if (alive) {
          setActions(res.actions || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load actions");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [query]);

  const refetch = useCallback(() => {
    setLoading(true);
    apiFetch<{ success: boolean; actions: Action[] }>(`/api/actions${query}`)
      .then((res) => { setActions(res.actions || []); setLoading(false); })
      .catch((err) => { setError(err instanceof Error ? err.message : "Failed to load actions"); setLoading(false); });
  }, [query]);

  return { actions, loading, error, refetch };
}

export function useCapabilities(participantId: string | null) {
  const [capabilities, setCapabilities] = useState<ParticipantCapability[]>([]);
  const [loading, setLoading] = useState(() => !participantId ? false : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participantId) return;
    let alive = true;
    apiFetch<{ success: boolean; capabilities: ParticipantCapability[] }>(`/api/capabilities/participant/${participantId}`)
      .then((res) => {
        if (alive) {
          setCapabilities(res.capabilities || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load capabilities");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [participantId]);

  return { capabilities, loading, error };
}

export function useUsers() {
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: string; name?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<{ success: boolean; users: Array<{ id: string; email: string; role: string; data?: Record<string, unknown> }> }>("/api/users")
      .then((res) => {
        if (alive) {
          setUsers(
            (res.users || []).map((u) => ({
              id: u.id,
              email: u.email,
              role: u.role,
              name: (u.data?.name as string) || u.email?.split("@")[0] || "User",
            }))
          );
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load users");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, []);

  return { users, loading, error };
}

export function useEvents(params?: { engagement_id?: string; status?: string }) {
  const [events, setEvents] = useState<EventQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParts: string[] = [];
  if (params?.engagement_id) queryParts.push(`engagement_id=${params.engagement_id}`);
  if (params?.status) queryParts.push(`status=${params.status}`);
  const query = queryParts.length ? `?${queryParts.join("&")}` : "";

  useEffect(() => {
    let alive = true;
    apiFetch<{ success: boolean; events: EventQueue[] }>(`/api/events${query}`)
      .then((res) => {
        if (alive) {
          setEvents(res.events || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load events");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [query]);

  const refetch = useCallback(() => {
    setLoading(true);
    apiFetch<{ success: boolean; events: EventQueue[] }>(`/api/events${query}`)
      .then((res) => { setEvents(res.events || []); setLoading(false); })
      .catch((err) => { setError(err instanceof Error ? err.message : "Failed to load events"); setLoading(false); });
  }, [query]);

  return { events, loading, error, refetch };
}

export function useInsights(params?: { engagement_id?: string; type?: string }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryParts: string[] = [];
  if (params?.engagement_id) queryParts.push(`engagement_id=${params.engagement_id}`);
  if (params?.type) queryParts.push(`type=${params.type}`);
  const query = queryParts.length ? `?${queryParts.join("&")}` : "";

  useEffect(() => {
    let alive = true;
    apiFetch<{ success: boolean; insights: Insight[] }>(`/api/insights${query}`)
      .then((res) => {
        if (alive) {
          setInsights(res.insights || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load insights");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [query]);

  const refetch = useCallback(() => {
    setLoading(true);
    apiFetch<{ success: boolean; insights: Insight[] }>(`/api/insights${query}`)
      .then((res) => { setInsights(res.insights || []); setLoading(false); })
      .catch((err) => { setError(err instanceof Error ? err.message : "Failed to load insights"); setLoading(false); });
  }, [query]);

  return { insights, loading, error, refetch };
}

export async function generateInsight(payload: {
  engagement_id: string;
  participant_id?: string;
}) {
  return apiFetch<{ success: boolean; insight: Insight }>("/api/insights/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function useTimeline(participantId: string | null, engagementId?: string) {
  const [timeline, setTimeline] = useState<ParticipantTimeline | null>(null);
  const [loading, setLoading] = useState(() => !participantId ? false : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participantId) return;
    let alive = true;
    const query = engagementId ? `?engagement_id=${engagementId}` : "";
    apiFetch<{ success: boolean; timeline: ParticipantTimeline }>(`/api/participants/${participantId}/timeline${query}`)
      .then((res) => {
        if (alive) {
          setTimeline(res.timeline || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load timeline");
          setLoading(false);
        }
      });
    return () => { alive = false; };
  }, [participantId, engagementId]);

  return { timeline, loading, error };
}

export async function submitReflection(payload: {
  engagementId: string;
  participantId: string;
  prompt: string;
  situation: string;
  learning: string;
  nextAction: string;
  capabilityTags: string[];
  confidenceScore?: number;
}) {
  const result = await apiFetch<{ success: boolean; reflection: unknown; evidence: Evidence }>("/api/reflection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      engagementId: payload.engagementId,
      participantId: payload.participantId,
      prompt: payload.prompt,
      situation: payload.situation,
      learning: payload.learning,
      nextAction: payload.nextAction,
      capabilityTags: payload.capabilityTags,
      confidenceScore: payload.confidenceScore ?? 0.65,
    }),
  });

  if (result.success && result.evidence) {
    try {
      await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ReflectionSubmitted",
          aggregateType: "Reflection",
          aggregateId: result.reflection && typeof result.reflection === "object" && "id" in result.reflection ? String((result.reflection as Record<string, unknown>).id) : "",
          engagementId: payload.engagementId,
          participantId: payload.participantId,
          payload: {
            prompt: payload.prompt,
            capabilityTags: payload.capabilityTags,
          },
        }),
      });
    } catch {
      // Event queue push is best-effort
    }
  }

  return result;
}

export async function updateAction(actionId: string, payload: {
  status?: string;
  progress?: number;
  assigned_to?: string;
  cancelled_reason?: string;
  priority?: string;
}) {
  const result = await apiFetch<{ success: boolean; action: Action }>(`/api/actions/${actionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (result.success && result.action) {
    try {
      const eventType = payload.status === "done"
        ? "ActionCompleted"
        : payload.status === "verified"
          ? "ActionVerified"
          : "ActionUpdated";

      await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: eventType,
          aggregateType: "Action",
          aggregateId: actionId,
          engagementId: result.action.engagement_id,
          participantId: result.action.participant_id,
          payload: {
            status: payload.status,
            progress: payload.progress,
            title: result.action.title,
          },
        }),
      });
    } catch {
      // Event queue push is best-effort
    }
  }

  return result;
}

export async function updateEvidenceTags(evidenceId: string, capabilityTags: string[]) {
  return apiFetch<{ success: boolean; evidence: Evidence }>(`/api/evidence/${evidenceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capabilityTags }),
  });
}

export async function createEvidence(payload: {
  engagementId: string;
  participantId?: string;
  type: string;
  source: string;
  content: Record<string, unknown>;
  capabilityTags: string[];
  confidenceScore?: number;
}) {
  const result = await apiFetch<{ success: boolean; evidence: Evidence }>("/api/evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      engagementId: payload.engagementId,
      participantId: payload.participantId,
      type: payload.type,
      source: payload.source,
      content: payload.content,
      capabilityTags: payload.capabilityTags,
      confidenceScore: payload.confidenceScore ?? 0.5,
    }),
  });

  if (result.success && result.evidence) {
    try {
      await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EvidenceCreated",
          aggregateType: "Evidence",
          aggregateId: result.evidence.id,
          engagementId: payload.engagementId,
          participantId: payload.participantId,
          payload: {
            evidenceType: payload.type,
            source: payload.source,
            capabilityTags: payload.capabilityTags,
            confidenceScore: payload.confidenceScore ?? 0.5,
          },
        }),
      });
    } catch {
      // Event queue push is best-effort
    }
  }

  return result;
}
