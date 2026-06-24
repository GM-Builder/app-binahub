"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionBoard,
  CapabilityProgress,
  EngagementOverview,
  EventQueuePanel,
  EvidenceTimeline,
  FacilitatorQueue,
  InsightPreview,
  WorkOsSummary,
  type TransformationAction,
  type TransformationEngagement,
  type TransformationEvent,
  type TransformationEvidence,
  type TransformationParticipant,
  type TransformationWorkspaceData,
} from "@/components/transformation-os";

type WorkspaceMode =
  | "client-dashboard"
  | "client-engagements"
  | "client-evidence"
  | "client-actions"
  | "client-capability"
  | "facilitator-dashboard"
  | "facilitator-engagements"
  | "facilitator-evidence"
  | "facilitator-events"
  | "facilitator-queue";

const fallbackData: Required<TransformationWorkspaceData> = {
  engagements: [],
  evidence: [],
  capabilities: [],
  actions: [],
  participants: [],
  events: [],
};

function normalizeStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapEngagement(item: Record<string, unknown>): TransformationEngagement {
  return {
    id: String(item.id),
    organization_id: String(item.organization_id || ""),
    title: String(item.title || "Untitled Engagement"),
    type: String(item.type || "transformation") as TransformationEngagement["type"],
    status: String(item.status || "draft") as TransformationEngagement["status"],
    start_date: item.start_date ? String(item.start_date) : null,
    end_date: item.end_date ? String(item.end_date) : null,
    created_at: String(item.created_at || new Date().toISOString()),
    created_by: item.created_by ? String(item.created_by) : null,
    progress: Number(item.progress || 0),
    participants: Number(item.participants || 0),
  };
}

function mapEvidence(item: Record<string, unknown>): TransformationEvidence {
  const tags = Array.isArray(item.capability_tags) ? item.capability_tags.map(String) : [];
  const content = item.content && typeof item.content === "object" ? (item.content as Record<string, unknown>) : {};
  return {
    id: String(item.id),
    engagement_id: String(item.engagement_id || ""),
    participant_id: item.participant_id ? String(item.participant_id) : null,
    type: String(item.type || "observation") as TransformationEvidence["type"],
    source: String(item.source || "system") as TransformationEvidence["source"],
    content,
    capability_tags: tags,
    confidence_score: Number(item.confidence_score || 0.5),
    created_at: String(item.created_at || new Date().toISOString()),
    created_by: item.created_by ? String(item.created_by) : null,
  };
}

function mapAction(item: Record<string, unknown>): TransformationAction {
  return {
    id: String(item.id),
    engagement_id: String(item.engagement_id || ""),
    participant_id: item.participant_id ? String(item.participant_id) : null,
    title: String(item.title || "Untitled action"),
    description: item.description ? String(item.description) : null,
    status: String(item.status || "todo") as TransformationAction["status"],
    due_date: item.due_date ? String(item.due_date) : null,
    progress: Number(item.progress || 0),
    created_at: String(item.created_at || new Date().toISOString()),
    created_by: item.created_by ? String(item.created_by) : null,
    assigned_to: item.assigned_to ? String(item.assigned_to) : null,
    completed_at: item.completed_at ? String(item.completed_at) : null,
    verified_at: item.verified_at ? String(item.verified_at) : null,
    cancelled_reason: item.cancelled_reason ? String(item.cancelled_reason) : null,
    priority: item.priority ? String(item.priority) as TransformationAction["priority"] : null,
  };
}

function mapParticipant(item: Record<string, unknown>): TransformationParticipant {
  const participant = item.participant && typeof item.participant === "object" ? item.participant as Record<string, unknown> : item;
  return {
    id: String(participant.id),
    organization_id: String(participant.organization_id || ""),
    name: String(participant.name || "Participant"),
    email: participant.email ? String(participant.email) : null,
    role_title: participant.role_title ? String(participant.role_title) : null,
    department: participant.department ? String(participant.department) : null,
    created_at: String(participant.created_at || new Date().toISOString()),
  };
}

function mapEvent(item: Record<string, unknown>): TransformationEvent {
  return {
    id: String(item.id),
    type: String(item.type || "Event"),
    aggregate_type: item.aggregate_type ? String(item.aggregate_type) : null,
    aggregate_id: item.aggregate_id ? String(item.aggregate_id) : null,
    engagement_id: item.engagement_id ? String(item.engagement_id) : null,
    participant_id: item.participant_id ? String(item.participant_id) : null,
    payload: (item.payload && typeof item.payload === "object" ? item.payload : {}) as Record<string, unknown>,
    status: String(item.status || "pending") as TransformationEvent["status"],
    attempts: Number(item.attempts || 0),
    error_message: item.error_message ? String(item.error_message) : null,
    created_at: String(item.created_at || new Date().toISOString()),
    processed_at: item.processed_at ? String(item.processed_at) : null,
  };
}

async function fetchJson(path: string) {
  const response = await fetch(path, { credentials: "include" });
  if (!response.ok) throw new Error(path);
  return response.json();
}

export function TransformationWorkspace({ mode, audience }: { mode: WorkspaceMode; audience: "client" | "facilitator" }) {
  const [data, setData] = useState<Required<TransformationWorkspaceData>>(fallbackData);
  const [source, setSource] = useState<"api" | "demo">("demo");

  useEffect(() => {
    let alive = true;

    async function loadWorkspace() {
      try {
        const [engagementsResult, evidenceResult, actionsResult, participantsResult, eventsResult] = await Promise.allSettled([
          fetchJson("/api/engagements"),
          fetchJson("/api/evidence"),
          fetchJson("/api/actions"),
          fetchJson("/api/participants"),
          fetchJson("/api/events"),
        ]);

        if (!alive) return;

        const nextData = {
          engagements:
            engagementsResult.status === "fulfilled"
              ? (engagementsResult.value.engagements || []).map(mapEngagement)
              : fallbackData.engagements,
          evidence:
            evidenceResult.status === "fulfilled"
              ? (evidenceResult.value.evidence || []).map(mapEvidence)
              : fallbackData.evidence,
          actions:
            actionsResult.status === "fulfilled"
              ? (actionsResult.value.actions || []).map(mapAction)
              : fallbackData.actions,
          participants:
            participantsResult.status === "fulfilled"
              ? (participantsResult.value.participants || []).map(mapParticipant)
              : fallbackData.participants,
          capabilities: fallbackData.capabilities,
          events:
            eventsResult.status === "fulfilled"
              ? (eventsResult.value.events || []).map(mapEvent)
              : fallbackData.events,
        };

        setData(nextData);
        setSource(
          [engagementsResult, evidenceResult, actionsResult, participantsResult, eventsResult].some((result) => result.status === "fulfilled")
            ? "api"
            : "demo",
        );
      } catch {
        if (alive) {
          setData(fallbackData);
          setSource("demo");
        }
      }
    }

    void loadWorkspace();
    return () => {
      alive = false;
    };
  }, []);

  const sourceLabel = useMemo(
    () => source === "api" ? "Live API data from api.binahub.id" : "Demo fallback until Supabase migration is applied",
    [source],
  );

  const sourceBadge = (
    <div className="mb-5 rounded-[8px] border border-[#0B2C6B]/10 bg-white px-4 py-3 text-sm font-semibold text-[#0B2C6B]/70">
      {sourceLabel}
    </div>
  );

  if (mode === "client-engagements") return <>{sourceBadge}<EngagementOverview engagements={data.engagements} /></>;
  if (mode === "client-evidence") return <>{sourceBadge}<EvidenceTimeline evidence={data.evidence} /></>;
  if (mode === "client-actions") return <>{sourceBadge}<ActionBoard actions={data.actions} /></>;
  if (mode === "client-capability") return <>{sourceBadge}<CapabilityProgress capabilities={data.capabilities} /></>;
  if (mode === "facilitator-events") return <>{sourceBadge}<EventQueuePanel events={data.events} /></>;
  if (mode === "facilitator-queue") return <>{sourceBadge}<FacilitatorQueue participants={data.participants} /></>;
  if (mode === "facilitator-engagements") {
    return (
      <>
        {sourceBadge}
        <div className="grid gap-6 2xl:grid-cols-[1.25fr_0.85fr]">
          <EngagementOverview engagements={data.engagements} />
          <FacilitatorQueue participants={data.participants} />
        </div>
      </>
    );
  }
  if (mode === "facilitator-evidence") {
    return (
      <>
        {sourceBadge}
        <div className="grid gap-6 xl:grid-cols-2">
          <EvidenceTimeline evidence={data.evidence} />
          <EventQueuePanel events={data.events} />
        </div>
      </>
    );
  }

  if (mode === "facilitator-dashboard") {
    return (
      <>
        {sourceBadge}
        <WorkOsSummary audience={audience} data={data} />
        <div className="mt-8 grid gap-6 2xl:grid-cols-[1.25fr_0.85fr]">
          <EngagementOverview engagements={data.engagements} />
          <FacilitatorQueue participants={data.participants} />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <EvidenceTimeline evidence={data.evidence} />
          <EventQueuePanel events={data.events} />
        </div>
      </>
    );
  }

  return (
    <>
      {sourceBadge}
      <WorkOsSummary audience={audience} data={data} />
      <div className="mt-8 grid gap-6 2xl:grid-cols-[1.35fr_0.9fr]">
        <EngagementOverview engagements={data.engagements} />
        <CapabilityProgress capabilities={data.capabilities} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <EvidenceTimeline evidence={data.evidence} />
        <ActionBoard actions={data.actions} />
      </div>
      <div className="mt-6">
        <InsightPreview />
      </div>
    </>
  );
}
