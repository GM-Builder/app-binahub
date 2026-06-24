import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Gauge,
  ListChecks,
  RadioTower,
  Target,
  UsersRound,
} from "lucide-react";

import type {
  Engagement,
  Evidence,
  ParticipantCapability,
  Action,
  Participant,
  EventQueue,
} from "@/lib/transformation-types";

export type TransformationEngagement = Engagement;
export type TransformationEvidence = Evidence;
export type TransformationCapability = ParticipantCapability;
export type TransformationAction = Action;
export type TransformationParticipant = Participant;
export type TransformationEvent = EventQueue;

export type TransformationWorkspaceData = {
  engagements?: TransformationEngagement[];
  evidence?: TransformationEvidence[];
  capabilities?: TransformationCapability[];
  actions?: TransformationAction[];
  participants?: TransformationParticipant[];
  events?: TransformationEvent[];
};

const statusTone: Record<string, string> = {
  "In Progress": "bg-blue-50 text-blue-700",
  Review: "bg-amber-50 text-amber-700",
  Active: "bg-emerald-50 text-emerald-700",
  "To Do": "bg-slate-100 text-slate-700",
  Blocked: "bg-red-50 text-red-700",
  done: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
};

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold ${statusTone[value] || "bg-[#F5F7FA] text-[#0B2C6B]"}`}>
      {value}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-[#E6EAF0]">
      <div className="h-2 rounded-full bg-[#0B2C6B]" style={{ width: `${value}%` }} />
    </div>
  );
}

export function WorkOsSummary({ audience, data }: { audience: "client" | "facilitator"; data?: TransformationWorkspaceData }) {
  const engagements = data?.engagements || [];
  const evidence = data?.evidence || [];
  const actions = data?.actions || [];
  const capabilities = data?.capabilities || [];
  const activeEngagements = engagements.filter((item) => item.status !== "archived").length;
  const evidenceCount = evidence.length;
  const actionCount = actions.filter((item) => item.status !== "done").length;
  const averageCapability = Math.round(
    capabilities.reduce((total, item) => total + item.score, 0) / capabilities.length,
  );

  const stats = [
    {
      label: audience === "facilitator" ? "Active Engagements" : "Transformation Health",
      value: audience === "facilitator" ? String(activeEngagements) : `${averageCapability}`,
      detail: audience === "facilitator" ? "Program kerja yang butuh observasi." : "Derived from capability evidence.",
      icon: audience === "facilitator" ? <UsersRound size={18} /> : <Gauge size={18} />,
    },
    {
      label: "Evidence Captured",
      value: String(evidenceCount),
      detail: "Assessment, reflection, observation, and system signals.",
      icon: <FileText size={18} />,
    },
    {
      label: "Open Actions",
      value: String(actionCount),
      detail: "Work items that bridge insight to behavior change.",
      icon: <ListChecks size={18} />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <section key={stat.label} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{stat.label}</p>
            <span className="text-[#0B2C6B]/70">{stat.icon}</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">{stat.value}</p>
          <p className="mt-2 text-sm leading-6 text-[#4A4C54]/70">{stat.detail}</p>
        </section>
      ))}
    </div>
  );
}

export function EngagementOverview({ engagements = [] }: { engagements?: TransformationEngagement[] }) {
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Engagements</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Work units in motion</h2>
        </div>
        <p className="text-sm text-[#4A4C54]/64">Status follows {"Draft -> Active -> In Progress -> Review"}.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {engagements.map((engagement) => (
          <article key={engagement.id} className="rounded-[8px] border border-[#0B2C6B]/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#D9A441]">{engagement.type}</p>
                <h3 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[#0B2C6B]">{engagement.title}</h3>
              </div>
              <StatusPill value={engagement.status} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs font-semibold text-[#0B2C6B]/70">
                <span>{engagement.progress ?? 0}%</span>
              </div>
              <ProgressBar value={engagement.progress ?? 0} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#4A4C54]/58">Participants</dt>
                <dd className="font-semibold text-[#0B2C6B]">{engagement.participants ?? 0}</dd>
              </div>
              <div>
                <dt className="text-[#4A4C54]/58">Status</dt>
                <dd className="font-semibold text-[#0B2C6B]">{engagement.status}</dd>
              </div>
            </dl>
            {engagement.start_date && (
              <p className="mt-4 text-sm leading-6 text-[#4A4C54]/72">Mulai: {new Date(engagement.start_date).toLocaleDateString("id-ID")}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function EvidenceTimeline({ evidence = [] }: { evidence?: TransformationEvidence[] }) {
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Evidence Engine</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Traceable evidence timeline</h2>
        </div>
        <FileText className="text-[#0B2C6B]/50" size={22} />
      </div>
      <div className="space-y-3">
        {evidence.map((item) => (
          <article key={item.id} className="rounded-[8px] border border-[#0B2C6B]/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#D9A441]">{item.type} - {item.source}</p>
                <h3 className="mt-1 text-base font-semibold text-[#0B2C6B]">{item.participant_id || "Peserta"}</h3>
              </div>
              <span className="text-xs font-semibold text-[#0B2C6B]/58">{new Date(item.created_at).toLocaleDateString("id-ID")}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#4A4C54]/74">
              {String(item.content?.text || item.content?.answer || item.content?.note || "Catatan tercatat")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {item.capability_tags.map((tag) => (
                <span key={tag} className="rounded-[8px] bg-[#F5F7FA] px-2.5 py-1 text-[#0B2C6B]">{tag}</span>
              ))}
              <span className="rounded-[8px] bg-[#F5F7FA] px-2.5 py-1 text-[#0B2C6B]">
                Confidence {Math.round(item.confidence_score * 100)}%
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CapabilityProgress({ capabilities = [] }: { capabilities?: TransformationCapability[] }) {
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Capability System</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Derived from evidence</h2>
        </div>
        <Target className="text-[#0B2C6B]/50" size={22} />
      </div>
      <div className="space-y-4">
        {capabilities.map((capability) => (
          <div key={capability.id}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-[#0B2C6B]">{capability.capability?.name || "Unknown"}</span>
              <span className="text-[#4A4C54]/68">{capability.score} / {capability.evidence_count} evidence</span>
            </div>
            <ProgressBar value={capability.score} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActionBoard({ actions = [] }: { actions?: TransformationAction[] }) {
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Actions</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Insight to work</h2>
        </div>
        <ListChecks className="text-[#0B2C6B]/50" size={22} />
      </div>
      <div className="space-y-3">
        {actions.map((action) => (
          <article key={action.id} className="rounded-[8px] border border-[#0B2C6B]/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#0B2C6B]">{action.title}</h3>
                <p className="mt-1 text-sm text-[#4A4C54]/64">{action.assigned_to || "Belum ditugaskan"} - due {action.due_date ? new Date(action.due_date).toLocaleDateString("id-ID") : "Tidak ada deadline"}</p>
              </div>
              <StatusPill value={action.status} />
            </div>
            <div className="mt-4">
              <ProgressBar value={action.progress} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FacilitatorQueue({ participants = [] }: { participants?: TransformationParticipant[] }) {
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Observation Queue</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Participants needing human review</h2>
        </div>
        <AlertTriangle className="text-[#0B2C6B]/50" size={22} />
      </div>
      <div className="space-y-3">
        {participants.map((participant) => (
          <article key={participant.id} className="rounded-[8px] border border-[#0B2C6B]/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#0B2C6B]">{participant.name}</h3>
                <p className="mt-1 text-sm text-[#4A4C54]/64">{participant.role_title || participant.email}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#4A4C54]/58">Department</dt>
                <dd className="font-semibold text-[#0B2C6B]">{participant.department || "-"}</dd>
              </div>
              <div>
                <dt className="text-[#4A4C54]/58">Email</dt>
                <dd className="font-semibold text-[#0B2C6B]">{participant.email || "-"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export function EventQueuePanel({ events = [] }: { events?: TransformationEvent[] }) {
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Event-Driven Core</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Latest system events</h2>
        </div>
        <RadioTower className="text-[#0B2C6B]/50" size={22} />
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-3 rounded-[8px] border border-[#0B2C6B]/10 p-4">
            <span className="mt-0.5 text-[#0B2C6B]/70">
              {event.status === "done" ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#0B2C6B]">{event.type}</h3>
                <StatusPill value={event.status} />
              </div>
              <p className="mt-1 text-sm text-[#4A4C54]/70">
                {String(event.payload?.message || event.aggregate_type || "Queued")}
              </p>
              <span className="text-xs text-[#4A4C54]/50">{new Date(event.created_at).toLocaleTimeString("id-ID")}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InsightPreview({ insights = [] }: { insights?: Array<{ id: string; title: string; summary: string; type: string; confidence_score: number; evidence_links: string[] }> }) {
  if (insights.length === 0) {
    return (
      <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Bima AI</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Interpreter, not source of truth</h2>
          </div>
          <Activity className="text-white/62" size={22} />
        </div>
        <p className="mt-4 text-sm leading-6 text-white/72">
          Draft insight dihasilkan setelah catatan terkumpul dan kemampuan dihitung ulang.
          Setiap rekomendasi harus dilampirkan dengan tautan ke catatan sumber.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-[8px] bg-white/10 px-2.5 py-1 text-white">Menunggu data</span>
        </div>
      </section>
    );
  }

  const latest = insights[0];
  return (
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Bima AI</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{latest.title}</h2>
        </div>
        <Activity className="text-white/62" size={22} />
      </div>
      <p className="mt-4 text-sm leading-6 text-white/72">{latest.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-[8px] bg-white/10 px-2.5 py-1 text-white">{latest.evidence_links.length} tautan bukti</span>
        <span className="rounded-[8px] bg-white/10 px-2.5 py-1 text-white">{Math.round(latest.confidence_score * 100)}% keyakinan</span>
        <span className="rounded-[8px] bg-white/10 px-2.5 py-1 text-white capitalize">{latest.type}</span>
      </div>
    </section>
  );
}

export function WorkspaceCta() {
  return (
    <a
      href="/facilitator/evidence"
      className="inline-flex items-center gap-2 rounded-[8px] bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0A255A]"
    >
      Add evidence <ArrowUpRight size={16} />
    </a>
  );
}
