"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, FileText, ListChecks, Target } from "lucide-react";

type ParticipantFlowMode = "dashboard" | "engagement-detail" | "reflection" | "actions" | "capability" | "evidence";

type ApiRecord = Record<string, unknown>;

const capabilityOptions = ["Leadership", "Communication", "Collaboration", "Execution", "Strategic Thinking"];
const reflectionPrompts = [
  "Apa perubahan perilaku paling nyata yang Anda praktikkan minggu ini?",
  "Situasi apa yang menantang cara Anda berkomunikasi atau memimpin?",
  "Aksi kecil apa yang akan Anda lakukan sebelum sesi berikutnya?",
];

function normalizeStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function firstText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

async function fetchJson(path: string) {
  const response = await fetch(path, { credentials: "include" });
  if (!response.ok) throw new Error(path);
  return response.json();
}

export function ParticipantFlow({ mode, engagementId }: { mode: ParticipantFlowMode; engagementId?: string }) {
  const [engagements, setEngagements] = useState<ApiRecord[]>([]);
  const [participants, setParticipants] = useState<ApiRecord[]>([]);
  const [evidence, setEvidence] = useState<ApiRecord[]>([]);
  const [actions, setActions] = useState<ApiRecord[]>([]);
  const [capabilities, setCapabilities] = useState<ApiRecord[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedEngagementId, setSelectedEngagementId] = useState(engagementId || "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      const [engagementsResult, participantsResult, evidenceResult, actionsResult] = await Promise.allSettled([
        fetchJson("/api/engagements"),
        fetchJson("/api/participants"),
        fetchJson("/api/evidence"),
        fetchJson("/api/actions"),
      ]);

      if (!alive) return;

      const nextEngagements =
        engagementsResult.status === "fulfilled" && engagementsResult.value.engagements?.length
          ? engagementsResult.value.engagements
          : [];
      const nextParticipants =
        participantsResult.status === "fulfilled" && participantsResult.value.participants?.length
          ? participantsResult.value.participants.map((item: ApiRecord) => item.participant || item)
          : [];

      setEngagements(nextEngagements);
      setParticipants(nextParticipants);
      setEvidence(
        evidenceResult.status === "fulfilled" && evidenceResult.value.evidence?.length
          ? evidenceResult.value.evidence
          : [],
      );
      setActions(
        actionsResult.status === "fulfilled" && actionsResult.value.actions?.length
          ? actionsResult.value.actions
          : [],
      );

      const participantId = String(nextParticipants[0]?.id || "");
      const currentEngagementId = engagementId || String(nextEngagements[0]?.id || "");
      setSelectedParticipantId((current) => current || participantId);
      setSelectedEngagementId((current) => current || currentEngagementId);

      if (participantId) {
        const capabilityResult = await Promise.allSettled([fetchJson(`/api/capabilities/participant/${participantId}`)]);
        if (alive && capabilityResult[0].status === "fulfilled" && capabilityResult[0].value.capabilities?.length) {
          setCapabilities(capabilityResult[0].value.capabilities);
        }
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [engagementId]);

  const selectedEngagement = useMemo(
    () => engagements.find((item) => String(item.id) === selectedEngagementId) || engagements[0],
    [engagements, selectedEngagementId],
  );

  const selectedParticipant = useMemo(
    () => participants.find((item) => String(item.id) === selectedParticipantId) || participants[0],
    [participants, selectedParticipantId],
  );

  async function refreshParticipantCapability(participantId: string) {
    const response = await fetchJson(`/api/capabilities/participant/${participantId}`);
    if (response.capabilities?.length) setCapabilities(response.capabilities);
  }

  async function submitReflection(formData: FormData) {
    setMessage("");
    const tags = capabilityOptions.filter((name) => formData.get(`capability-${name}`));
    const payload = {
      engagementId: String(formData.get("engagementId")),
      participantId: String(formData.get("participantId")),
      prompt: String(formData.get("prompt")),
      situation: String(formData.get("situation")),
      learning: String(formData.get("learning")),
      nextAction: String(formData.get("nextAction")),
      capabilityTags: tags,
      confidenceScore: 0.68,
    };

    const response = await fetch("/api/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      setMessage(json.error || "Reflection gagal disimpan.");
      return;
    }

    setMessage("Reflection tersimpan sebagai Evidence dan event recalculation sudah masuk queue.");
    const evidenceResult = await fetchJson(`/api/evidence?participant_id=${payload.participantId}`);
    setEvidence(evidenceResult.evidence || evidence);
  }

  async function updateAction(actionId: string, status: string, progress: number) {
    setMessage("");
    const response = await fetch(`/api/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, progress }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      setMessage(json.error || "Action gagal diperbarui.");
      return;
    }
    setMessage("Action diperbarui dan Evidence action_completion dibuat.");
    const actionsResult = await fetchJson(`/api/actions?participant_id=${selectedParticipantId}`);
    setActions(actionsResult.actions || actions);
  }

  const shellContext = (
    <section className="mb-5 grid gap-3 rounded-[8px] border border-[#0B2C6B]/10 bg-white p-4 md:grid-cols-2">
      <label className="text-sm font-semibold text-[#0B2C6B]">
        Participant
        <select
          value={selectedParticipantId}
          onChange={(event) => setSelectedParticipantId(event.target.value)}
          className="mt-2 w-full rounded-[8px] border border-[#0B2C6B]/10 bg-white px-3 py-2 text-sm"
        >
          {participants.map((participant) => (
            <option key={String(participant.id)} value={String(participant.id)}>
              {firstText(participant.name, "Participant")}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-[#0B2C6B]">
        Engagement
        <select
          value={selectedEngagementId}
          onChange={(event) => setSelectedEngagementId(event.target.value)}
          className="mt-2 w-full rounded-[8px] border border-[#0B2C6B]/10 bg-white px-3 py-2 text-sm"
        >
          {engagements.map((engagement) => (
            <option key={String(engagement.id)} value={String(engagement.id)}>
              {firstText(engagement.title, "Engagement")}
            </option>
          ))}
        </select>
      </label>
    </section>
  );

  if (mode === "reflection") {
    return (
      <>
        {shellContext}
        <form action={submitReflection} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <input type="hidden" name="participantId" value={selectedParticipantId} />
          <input type="hidden" name="engagementId" value={selectedEngagementId} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Guided Reflection</p>
          <h2 className="mt-1 text-xl font-semibold text-[#0B2C6B]">Capture what changed</h2>
          <label className="mt-5 block text-sm font-semibold text-[#0B2C6B]">
            Prompt
            <select name="prompt" className="mt-2 w-full rounded-[8px] border border-[#0B2C6B]/10 px-3 py-2">
              {reflectionPrompts.map((prompt) => <option key={prompt}>{prompt}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-[#0B2C6B]">
            Situation
            <textarea name="situation" required rows={4} className="mt-2 w-full rounded-[8px] border border-[#0B2C6B]/10 px-3 py-2" />
          </label>
          <label className="mt-4 block text-sm font-semibold text-[#0B2C6B]">
            Learning
            <textarea name="learning" required rows={4} className="mt-2 w-full rounded-[8px] border border-[#0B2C6B]/10 px-3 py-2" />
          </label>
          <label className="mt-4 block text-sm font-semibold text-[#0B2C6B]">
            Next Action
            <input name="nextAction" required className="mt-2 w-full rounded-[8px] border border-[#0B2C6B]/10 px-3 py-2" />
          </label>
          <div className="mt-4">
            <p className="text-sm font-semibold text-[#0B2C6B]">Capability tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {capabilityOptions.map((name) => (
                <label key={name} className="flex items-center gap-2 rounded-[8px] border border-[#0B2C6B]/10 px-3 py-2 text-sm">
                  <input type="checkbox" name={`capability-${name}`} defaultChecked={name === "Communication"} />
                  {name}
                </label>
              ))}
            </div>
          </div>
          <button className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white">
            Submit reflection <FileText size={16} />
          </button>
          {message && <p className="mt-4 text-sm font-semibold text-[#0B2C6B]">{message}</p>}
        </form>
      </>
    );
  }

  if (mode === "actions") {
    return (
      <>
        {shellContext}
        <div className="grid gap-4">
          {actions.map((action) => (
            <article key={String(action.id)} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{normalizeStatus(String(action.status || "todo"))}</p>
                  <h2 className="mt-2 text-lg font-semibold text-[#0B2C6B]">{firstText(action.title, "Action")}</h2>
                  <p className="mt-1 text-sm text-[#4A4C54]/70">Progress {Number(action.progress || 0)}%</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateAction(String(action.id), "in_progress", Math.max(Number(action.progress || 0), 25))} className="rounded-[8px] border border-[#0B2C6B]/10 px-3 py-2 text-sm font-semibold text-[#0B2C6B]">
                    Start
                  </button>
                  <button onClick={() => updateAction(String(action.id), "done", 100)} className="rounded-[8px] bg-[#0B2C6B] px-3 py-2 text-sm font-semibold text-white">
                    Complete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {message && <p className="mt-4 rounded-[8px] bg-white p-4 text-sm font-semibold text-[#0B2C6B]">{message}</p>}
      </>
    );
  }

  if (mode === "capability") {
    return (
      <>
        {shellContext}
        <button onClick={() => refreshParticipantCapability(selectedParticipantId)} className="mb-5 rounded-[8px] bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white">
          Refresh derived capability
        </button>
        <div className="grid gap-4 md:grid-cols-2">
          {capabilities.map((capability) => {
            const capabilityName = firstText((capability.capability as ApiRecord | undefined)?.name || capability.name, "Capability");
            const score = Number(capability.score || 0);
            return (
              <article key={`${capabilityName}-${String(capability.id)}`} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#0B2C6B]">{capabilityName}</h2>
                  <Target className="text-[#D9A441]" size={18} />
                </div>
                <p className="mt-3 text-3xl font-semibold text-[#0B2C6B]">{score}</p>
                <p className="mt-1 text-sm text-[#4A4C54]/70">Derived from {Number(capability.evidence_count || capability.evidenceCount || 0)} evidence item(s)</p>
              </article>
            );
          })}
        </div>
      </>
    );
  }

  if (mode === "evidence") {
    return (
      <>
        {shellContext}
        <div className="grid gap-4">
          {evidence.map((item) => {
            const content = item.content && typeof item.content === "object" ? item.content as ApiRecord : {};
            return (
              <article key={String(item.id)} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{normalizeStatus(String(item.type || "evidence"))}</p>
                <h2 className="mt-2 text-lg font-semibold text-[#0B2C6B]">{firstText(String(content.prompt || item.capability || "Evidence"), "Evidence")}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4A4C54]/70">{firstText(String(content.text || content.summary || item.preview || "Evidence captured."), "Evidence captured.")}</p>
              </article>
            );
          })}
        </div>
      </>
    );
  }

  if (mode === "engagement-detail") {
    return (
      <>
        {shellContext}
        <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">{firstText(selectedEngagement?.type, "Transformation")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#0B2C6B]">{firstText(selectedEngagement?.title, "Engagement")}</h2>
          <p className="mt-2 text-sm text-[#4A4C54]/70">Status: {normalizeStatus(String(selectedEngagement?.status || "active"))}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link href="/client/reflection" className="rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Submit Reflection</Link>
            <Link href="/client/actions" className="rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Track Actions</Link>
            <Link href="/client/evidence" className="rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Evidence History</Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Participant Journey</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#0B2C6B]">Your active transformation work</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/client/reflection" className="flex items-center justify-between rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Reflection <ArrowUpRight size={16} /></Link>
          <Link href="/client/actions" className="flex items-center justify-between rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Actions <ListChecks size={16} /></Link>
          <Link href="/client/capability" className="flex items-center justify-between rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Capability <Target size={16} /></Link>
          <Link href="/client/evidence" className="flex items-center justify-between rounded-[8px] border border-[#0B2C6B]/10 p-4 font-semibold text-[#0B2C6B]">Evidence <CheckCircle2 size={16} /></Link>
        </div>
      </section>
      <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Current Context</p>
        <h2 className="mt-2 text-xl font-semibold text-[#0B2C6B]">{firstText(selectedParticipant?.name, "Participant")}</h2>
        <p className="mt-1 text-sm text-[#4A4C54]/70">{firstText(selectedEngagement?.title, "Engagement")}</p>
      </section>
    </div>
  );
}
