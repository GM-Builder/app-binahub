"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { AdminToastFeedback } from "@/components/admin-toast-feedback";
import { AdminInput, AdminSelect, AdminTextarea, Badge, Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type RehearsalStatus = "planned" | "in_progress" | "passed" | "failed" | "aborted";
type StepStatus = "pending" | "running" | "passed" | "failed" | "blocked";
type CertificationDecision = "accepted" | "accepted_with_conditions" | "rejected";

type Release = {
  id: string;
  releaseKey: string;
  title: string;
  status: string;
  isMock: boolean;
};

type Snapshot = {
  id: string;
  pilotReleaseId: string | null;
  overallStatus: string;
  blockers: unknown[];
  dryRun: boolean;
  isMock: boolean;
  evaluatedAt: string;
};

type Rehearsal = {
  id: string;
  rehearsalKey: string;
  pilotReleaseId: string;
  monitoringSnapshotId: string | null;
  title: string;
  environment: string;
  status: RehearsalStatus;
  owner: string | null;
  approver: string | null;
  summary: string | null;
  rollbackResult: string | null;
  failureReason: string | null;
  dryRun: boolean;
  isMock: boolean;
  startedAt: string | null;
  finishedAt: string | null;
};

type RehearsalStep = {
  id: string;
  rehearsalId: string;
  stepKey: string;
  title: string;
  description: string;
  expectedResult: string;
  sortOrder: number;
  required: boolean;
  status: StepStatus;
  owner: string | null;
  evidenceNote: string | null;
  evidenceUrl: string | null;
  actualResult: string | null;
  blockerReason: string | null;
  lastTestedAt: string | null;
};

type Certification = {
  id: string;
  pilotReleaseId: string;
  rehearsalId: string;
  monitoringSnapshotId: string;
  decision: CertificationDecision;
  conditions: string[];
  decisionNote: string;
  decidedBy: string;
  decidedAt: string;
  isMock: boolean;
  version: number;
};

type CertificationPayload = {
  success: true;
  phase12Ready: boolean;
  activationLocked: boolean;
  outboundTriggered: boolean;
  state: string;
  summary: {
    activeReleaseId: string | null;
    requiredUatCount: number;
    passedUatCount: number;
    policiesReady: boolean;
    openCriticalCount: number;
    activeRehearsalId: string | null;
    activeRehearsalStatus: RehearsalStatus | null;
    activeCertificationDecision: CertificationDecision | null;
  };
  rehearsals: Rehearsal[];
  steps: RehearsalStep[];
  certifications: Certification[];
  releases: Release[];
  snapshots: Snapshot[];
};

const STATE_LABELS: Record<string, string> = {
  migration_required: "Migration diperlukan",
  release_required: "Release approved diperlukan",
  uat_incomplete: "UAT belum lengkap",
  monitoring_policy_incomplete: "Policy monitoring belum lengkap",
  rehearsal_required: "Rehearsal perlu dibuat",
  rehearsal_incomplete: "Rehearsal belum lulus",
  incident_blocked: "Terblokir critical incident",
  eligible_for_certification: "Siap sertifikasi manusia",
  certification_rejected: "Sertifikasi ditolak",
  certified_for_go_no_go: "Siap keputusan go/no-go",
};

const STATUS_TONE: Record<StepStatus | RehearsalStatus, "navy" | "gold" | "green" | "red"> = {
  planned: "navy",
  pending: "navy",
  in_progress: "gold",
  running: "gold",
  passed: "green",
  failed: "red",
  blocked: "red",
  aborted: "red",
};

function displayDate(value: string | null) {
  if (!value) return "Belum ada";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function PilotCertificationPanel({ onAction }: { onAction: AdminAction }) {
  const [payload, setPayload] = useState<CertificationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [releaseId, setReleaseId] = useState("");
  const [rehearsalKey, setRehearsalKey] = useState(`pilot-rehearsal-${new Date().toISOString().slice(0, 10)}`);
  const [rehearsalTitle, setRehearsalTitle] = useState("Rehearsal dry-run produksi BinaHub");
  const [owner, setOwner] = useState("");
  const [approver, setApprover] = useState("");
  const [selectedStepId, setSelectedStepId] = useState("");
  const [stepStatus, setStepStatus] = useState<StepStatus>("running");
  const [stepOwner, setStepOwner] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [actualResult, setActualResult] = useState("");
  const [blockerReason, setBlockerReason] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [summary, setSummary] = useState("");
  const [rollbackResult, setRollbackResult] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [decision, setDecision] = useState<CertificationDecision>("accepted");
  const [conditions, setConditions] = useState("");
  const [decisionNote, setDecisionNote] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onAction("/api/admin/pilot-certification") as CertificationPayload;
      setPayload(response);
      setReleaseId((current) => current || response.summary?.activeReleaseId || "");
      const currentRehearsal = response.rehearsals.find((item) => item.id === response.summary?.activeRehearsalId);
      if (currentRehearsal) {
        setRehearsalKey(currentRehearsal.rehearsalKey);
        setRehearsalTitle(currentRehearsal.title);
        setOwner(currentRehearsal.owner || "");
        setApprover(currentRehearsal.approver || "");
        setSnapshotId(currentRehearsal.monitoringSnapshotId || "");
        setSummary(currentRehearsal.summary || "");
        setRollbackResult(currentRehearsal.rollbackResult || "");
        setFailureReason(currentRehearsal.failureReason || "");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Pilot Certification gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRehearsal = useMemo(() => payload?.rehearsals.find((item) => (
    item.id === payload.summary.activeRehearsalId
  )) || null, [payload]);
  const rehearsalSteps = useMemo(() => payload?.steps.filter((item) => (
    item.rehearsalId === activeRehearsal?.id
  )) || [], [activeRehearsal, payload]);
  const selectedStep = rehearsalSteps.find((item) => item.id === selectedStepId) || null;
  const releaseSnapshots = useMemo(() => payload?.snapshots.filter((item) => (
    item.pilotReleaseId === releaseId && !item.isMock
  )) || [], [payload, releaseId]);
  const passedStepCount = rehearsalSteps.filter((item) => item.status === "passed").length;

  const runMutation = async (body: object, successMessage: string) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/pilot-certification", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setNotice(successMessage);
      await load();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Aksi Pilot Certification gagal.");
    } finally {
      setSaving(false);
    }
  };

  const saveRehearsal = () => runMutation({
    action: "save_rehearsal",
    rehearsalId: activeRehearsal?.status === "planned" ? activeRehearsal.id : null,
    releaseId,
    rehearsalKey,
    title: rehearsalTitle,
    environment: "production",
    owner: owner.trim() || null,
    approver: approver.trim() || null,
    isMock: false,
  }, activeRehearsal ? "Rencana rehearsal diperbarui." : "Rehearsal production dry-run dibuat dengan delapan langkah wajib.");

  const startRehearsal = () => activeRehearsal && runMutation({
    action: "transition_rehearsal",
    rehearsalId: activeRehearsal.id,
    nextStatus: "in_progress",
  }, "Rehearsal dimulai. Semua worker tetap dry-run.");

  const chooseStep = (step: RehearsalStep) => {
    setSelectedStepId(step.id);
    setStepStatus(step.status === "pending" ? "running" : step.status);
    setStepOwner(step.owner || activeRehearsal?.owner || "");
    setEvidenceNote(step.evidenceNote || "");
    setEvidenceUrl(step.evidenceUrl || "");
    setActualResult(step.actualResult || "");
    setBlockerReason(step.blockerReason || "");
  };

  const saveStep = () => selectedStep && runMutation({
    action: "update_step",
    stepId: selectedStep.id,
    status: stepStatus,
    owner: stepOwner.trim() || null,
    evidenceNote: evidenceNote.trim() || null,
    evidenceUrl: evidenceUrl.trim() || null,
    actualResult: actualResult.trim() || null,
    blockerReason: blockerReason.trim() || null,
  }, "Evidence langkah rehearsal tersimpan.");

  const finishRehearsal = (nextStatus: "passed" | "failed" | "aborted") => activeRehearsal && runMutation({
    action: "transition_rehearsal",
    rehearsalId: activeRehearsal.id,
    nextStatus,
    snapshotId: nextStatus === "passed" ? snapshotId : null,
    summary: nextStatus === "passed" ? summary : null,
    rollbackResult: nextStatus === "passed" ? rollbackResult : null,
    failureReason: nextStatus === "passed" ? null : failureReason,
  }, nextStatus === "passed" ? "Rehearsal lulus dan evidence dikunci." : "Rehearsal ditutup tanpa kelulusan.");

  const certify = () => activeRehearsal && runMutation({
    action: "record_certification",
    releaseId,
    rehearsalId: activeRehearsal.id,
    snapshotId: activeRehearsal.monitoringSnapshotId || snapshotId,
    decision,
    conditions: conditions.split("\n").map((item) => item.trim()).filter(Boolean),
    decisionNote,
    isMock: decision === "rejected",
  }, "Keputusan acceptance tersimpan. Activation tetap terkunci sampai keputusan go/no-go dan deployment terpisah.");

  if (payload && !payload.phase12Ready) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Pilot Certification belum tersedia. Jalankan migration 0037.</div>;
  }

  return (
    <div className="space-y-6">
      <AdminToastFeedback error={error} notice={notice} scope="pilot-certification" />
      <section className="rounded-2xl border border-[#0B2C6B]/10 bg-[linear-gradient(135deg,#071B3D,#0B2C6B)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E9BD65]">Fase 12 · Pilot Rehearsal &amp; Acceptance</p>
            <h2 className="mt-2 text-2xl font-bold">Buktikan kesiapan end-to-end sebelum keputusan go/no-go</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Rehearsal menggunakan konfigurasi produksi dalam mode dry-run. Evidence, snapshot, UAT, dan keputusan manusia dikunci sebagai satu paket audit.</p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui data
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">{STATE_LABELS[payload?.state || "release_required"] || payload?.state}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">Activation terkunci</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">Outbound tidak dijalankan</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="UAT evidence" value={`${payload?.summary.passedUatCount || 0}/${payload?.summary.requiredUatCount || 0}`} icon={ClipboardCheck} tone={payload?.summary.passedUatCount === payload?.summary.requiredUatCount ? "success" : "gold"} />
        <StatCard label="Policy monitoring" value={payload?.summary.policiesReady ? "4 real & owned" : "Belum lengkap"} icon={ShieldCheck} tone={payload?.summary.policiesReady ? "success" : "gold"} />
        <StatCard label="Langkah rehearsal" value={`${passedStepCount}/${rehearsalSteps.length || 8}`} icon={FlaskConical} tone={passedStepCount === 8 ? "success" : "gold"} />
        <StatCard label="Acceptance" value={(payload?.summary.activeCertificationDecision || "Belum ada").replaceAll("_", " ")} icon={CheckCircle2} tone={payload?.summary.activeCertificationDecision?.startsWith("accepted") ? "success" : "gold"} />
      </div>

      <Panel title="1. Rencana rehearsal produksi" action="Wajib dry-run">
        <div className="grid gap-4 lg:grid-cols-2">
          <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Release approved</span><AdminSelect value={releaseId} onChange={setReleaseId} options={[["", "Pilih release approved"], ...(payload?.releases.filter((item) => ["approved", "scheduled"].includes(item.status) && !item.isMock).map((item) => [item.id, item.title] as [string, string]) || [])]} /></label>
          <AdminInput label="Rehearsal key" value={rehearsalKey} onChange={setRehearsalKey} placeholder="pilot-rehearsal-2026-08-30" />
          <AdminInput label="Judul" value={rehearsalTitle} onChange={setRehearsalTitle} />
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-800"><strong>Environment: production · dry-run: true</strong><br />Mode ini menguji integrasi produksi tanpa mengizinkan side effect outbound.</div>
          <AdminInput label="Rehearsal owner" type="email" value={owner} onChange={setOwner} placeholder="operations@binahub.id" />
          <AdminInput label="Approver" type="email" value={approver} onChange={setApprover} placeholder="approver@binahub.id" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={saveRehearsal} disabled={saving || !releaseId || Boolean(activeRehearsal && activeRehearsal.status !== "planned")} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save size={14} /> {activeRehearsal?.status === "planned" ? "Perbarui rencana" : "Buat rehearsal"}</button>
          {activeRehearsal?.status === "planned" && <button type="button" onClick={startRehearsal} disabled={saving} className="rounded-xl border border-[#D9A441] bg-[#FFF8EA] px-4 py-2.5 text-xs font-bold text-[#8B6218] disabled:opacity-50">Mulai rehearsal</button>}
          {activeRehearsal && ["failed", "aborted"].includes(activeRehearsal.status) && <button type="button" onClick={startRehearsal} disabled={saving} className="rounded-xl border border-[#D9A441] bg-[#FFF8EA] px-4 py-2.5 text-xs font-bold text-[#8B6218] disabled:opacity-50">Ulangi rehearsal</button>}
          {activeRehearsal && <Badge tone={STATUS_TONE[activeRehearsal.status]}>{activeRehearsal.status.replaceAll("_", " ")}</Badge>}
        </div>
      </Panel>

      <Panel title="2. Delapan bukti eksekusi" action={`${passedStepCount} lulus`}>
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            {rehearsalSteps.map((step) => (
              <button key={step.id} type="button" onClick={() => chooseStep(step)} className={`w-full rounded-xl border p-4 text-left ${selectedStepId === step.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-[#0B2C6B]">{step.sortOrder / 10}. {step.title}</p><Badge tone={STATUS_TONE[step.status]}>{step.status}</Badge></div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.expectedResult}</p>
              </button>
            ))}
            {!rehearsalSteps.length && <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Buat rehearsal untuk menghasilkan delapan langkah wajib.</p>}
          </div>
          {selectedStep ? <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div><p className="text-sm font-bold text-[#0B2C6B]">{selectedStep.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{selectedStep.description}</p></div>
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span><AdminSelect value={stepStatus} onChange={(value) => setStepStatus(value as StepStatus)} options={[["running", "Running"], ["passed", "Passed"], ["failed", "Failed"], ["blocked", "Blocked"], ["pending", "Pending"]]} /></label>
            <AdminInput label="Owner langkah" type="email" value={stepOwner} onChange={setStepOwner} />
            <AdminTextarea label="Catatan evidence" value={evidenceNote} onChange={setEvidenceNote} placeholder="Apa yang dijalankan dan bukti yang diperiksa" />
            <AdminInput label="URL evidence (opsional)" type="url" value={evidenceUrl} onChange={setEvidenceUrl} placeholder="https://..." />
            <AdminTextarea label="Hasil aktual" value={actualResult} onChange={setActualResult} placeholder="Hasil observasi aktual" />
            {stepStatus === "blocked" && <AdminTextarea label="Alasan blocker" value={blockerReason} onChange={setBlockerReason} />}
            <button type="button" onClick={saveStep} disabled={saving || activeRehearsal?.status !== "in_progress"} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save size={14} /> Simpan evidence</button>
          </div> : <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Pilih satu langkah untuk mencatat owner, evidence, dan hasil aktual.</div>}
        </div>
      </Panel>

      <Panel title="3. Tutup rehearsal" action="Human verification">
        <div className="grid gap-4 lg:grid-cols-2">
          <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Snapshot monitoring real</span><AdminSelect value={snapshotId} onChange={setSnapshotId} options={[["", "Pilih snapshot kurang dari 24 jam"], ...releaseSnapshots.map((item) => [item.id, `${item.overallStatus} · ${displayDate(item.evaluatedAt)}`] as [string, string])]} /></label>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">Rehearsal hanya dapat lulus bila delapan langkah passed, snapshot non-mock tidak critical, serta ringkasan dan rollback drill tersedia.</div>
          <AdminTextarea label="Ringkasan rehearsal" value={summary} onChange={setSummary} placeholder="Ringkasan hasil seluruh alur end-to-end" />
          <AdminTextarea label="Hasil rollback drill" value={rollbackResult} onChange={setRollbackResult} placeholder="Bukti kill switch, pemulihan, dan rekonsiliasi" />
          <div className="lg:col-span-2"><AdminTextarea label="Alasan gagal / abort" value={failureReason} onChange={setFailureReason} placeholder="Wajib hanya bila rehearsal gagal atau dihentikan" /></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => finishRehearsal("passed")} disabled={saving || activeRehearsal?.status !== "in_progress" || passedStepCount !== 8 || !snapshotId} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Nyatakan lulus</button>
          <button type="button" onClick={() => finishRehearsal("failed")} disabled={saving || activeRehearsal?.status !== "in_progress" || failureReason.trim().length < 10} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 disabled:opacity-50">Nyatakan gagal</button>
          <button type="button" onClick={() => finishRehearsal("aborted")} disabled={saving || activeRehearsal?.status !== "in_progress" || failureReason.trim().length < 10} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 disabled:opacity-50">Hentikan rehearsal</button>
        </div>
      </Panel>

      <Panel title="4. Final acceptance certification" action="Human decision">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            <p className="font-bold">Acceptance bukan aktivasi.</p>
            <p className="mt-2">Keputusan mengesahkan paket evidence untuk masuk ke go/no-go. Aktivasi n8n dan perubahan environment tetap merupakan deployment terpisah setelah seluruh gate lulus.</p>
            <dl className="mt-4 space-y-2"><div className="flex justify-between gap-3"><dt>Rehearsal</dt><dd className="font-semibold">{activeRehearsal?.status || "belum ada"}</dd></div><div className="flex justify-between gap-3"><dt>Critical incident</dt><dd className="font-semibold">{payload?.summary.openCriticalCount || 0}</dd></div><div className="flex justify-between gap-3"><dt>Snapshot</dt><dd className="text-right font-semibold">{displayDate(activeRehearsal?.finishedAt || null)}</dd></div></dl>
          </div>
          <div className="space-y-4">
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Keputusan</span><AdminSelect value={decision} onChange={(value) => setDecision(value as CertificationDecision)} options={[["accepted", "Accepted"], ["accepted_with_conditions", "Accepted with conditions"], ["rejected", "Rejected"]]} /></label>
            {decision === "accepted_with_conditions" && <AdminTextarea label="Kondisi (satu per baris)" value={conditions} onChange={setConditions} placeholder="Owner memantau setiap run selama masa pilot" />}
            <AdminTextarea label="Dasar keputusan" value={decisionNote} onChange={setDecisionNote} placeholder="Ringkas evidence, risiko, dan alasan keputusan" />
            <button type="button" onClick={certify} disabled={saving || !activeRehearsal || !(activeRehearsal.monitoringSnapshotId || snapshotId) || decisionNote.trim().length < 10 || (decision !== "rejected" && activeRehearsal.status !== "passed") || (decision === "accepted_with_conditions" && conditions.split("\n").every((item) => item.trim().length < 5))} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={14} /> Simpan acceptance</button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
