export type EngagementType = "assessment" | "coaching" | "training" | "transformation";
export type EngagementStatus = "draft" | "active" | "in_progress" | "review" | "completed" | "archived";
export type EvidenceType = "assessment" | "reflection" | "observation" | "feedback" | "coaching_note" | "action_completion" | "survey";
export type EvidenceSource = "participant" | "facilitator" | "manager" | "system";
export type ActionStatus = "todo" | "in_progress" | "blocked" | "done" | "verified" | "cancelled";
export type CapabilityTrend = "up" | "down" | "stable";

export interface Engagement {
  id: string;
  organization_id: string;
  title: string;
  type: EngagementType;
  status: EngagementStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by: string | null;
  progress?: number;
  participants?: number;
}

export interface Participant {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  role_title: string | null;
  department: string | null;
  created_at: string;
}

export interface EngagementParticipant {
  id: string;
  engagement_id: string;
  participant_id: string;
  role: "participant" | "leader" | "observer";
  participant?: Participant;
  evidence_count?: number;
  capability_score?: number;
  action_progress?: number;
  review_status?: string;
}

export interface Evidence {
  id: string;
  engagement_id: string;
  participant_id: string | null;
  type: EvidenceType;
  source: EvidenceSource;
  content: Record<string, unknown>;
  capability_tags: string[];
  confidence_score: number;
  created_at: string;
  created_by: string | null;
}

export interface Action {
  id: string;
  engagement_id: string;
  participant_id: string | null;
  title: string;
  description: string | null;
  status: ActionStatus;
  due_date: string | null;
  progress: number;
  created_at: string;
  created_by: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  verified_at: string | null;
  cancelled_reason: string | null;
  priority: "low" | "medium" | "high" | "critical" | null;
}

export interface Reflection {
  id: string;
  participant_id: string;
  engagement_id: string;
  question: string;
  answer: string;
  evidence_id: string;
  created_at: string;
}

export interface Capability {
  id: string;
  name: string;
  description: string | null;
}

export interface ParticipantCapability {
  id: string;
  participant_id: string;
  capability_id: string;
  score: number;
  trend: CapabilityTrend;
  evidence_count: number;
  last_event_id: string | null;
  last_updated: string;
  capability?: Capability;
  evidence?: CapabilityEvidenceLink[];
}

export interface CapabilityEvidenceLink {
  id: string;
  capability_id: string;
  evidence_id: string;
  weight: number;
  evidence?: Evidence;
}

export interface EventQueue {
  id: string;
  type: string;
  aggregate_type: string | null;
  aggregate_id: string | null;
  engagement_id: string | null;
  participant_id: string | null;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "done" | "failed";
  attempts: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface ParticipantTimeline {
  evidence: Evidence[];
  actions: Action[];
  reflections: Reflection[];
  capabilities: ParticipantCapability[];
}

export interface Insight {
  id: string;
  organization_id: string;
  engagement_id: string;
  title: string;
  summary: string;
  type: "risk" | "improvement" | "recommendation";
  evidence_links: string[];
  confidence_score: number;
  created_at: string;
}

export const CAPABILITY_NAMES = ["Leadership", "Communication", "Collaboration", "Execution", "Strategic Thinking"] as const;

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  assessment: "Assessment Result",
  reflection: "Reflection Entry",
  observation: "Facilitator Observation",
  feedback: "Feedback",
  coaching_note: "Coaching Note",
  action_completion: "Action Completion",
  survey: "Survey Response",
};

export const EVIDENCE_SOURCE_LABELS: Record<EvidenceSource, string> = {
  participant: "Participant",
  facilitator: "Facilitator",
  manager: "Manager",
  system: "System",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
  verified: "Verified",
  cancelled: "Cancelled",
};

export const ACTION_LIFECYCLE: Record<ActionStatus, { next: ActionStatus[]; label: string; icon: string }> = {
  todo: { next: ["in_progress", "cancelled"], label: "Open", icon: "Clock" },
  in_progress: { next: ["done", "blocked", "cancelled"], label: "In Progress", icon: "RefreshCw" },
  blocked: { next: ["in_progress", "cancelled"], label: "Blocked", icon: "AlertTriangle" },
  done: { next: ["verified", "in_progress"], label: "Done", icon: "CheckCircle2" },
  verified: { next: [], label: "Verified", icon: "CheckCircle2" },
  cancelled: { next: ["todo"], label: "Cancelled", icon: "X" },
};

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  draft: "Draft",
  active: "Active",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  archived: "Archived",
};
