"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { AdminToastFeedback } from "@/components/admin-toast-feedback";
import { AdminInput, AdminSelect, AdminTextarea, Badge, Panel, StatCard } from "./shared";

type HealthStatus = "healthy" | "warning" | "critical" | "insufficient_data";
type IncidentStatus = "open" | "investigating" | "monitoring" | "resolved" | "dismissed";
type IncidentSeverity = "low" | "medium" | "high" | "critical";

type Policy = {
  workflowKey: string;
  lookbackHours: number;
  minimumRuns: number;
  maximumFailureRatePercent: number;
  staleRunningMinutes: number;
  maximumConsecutiveFailures: number;
  enabled: boolean;
  owner: string | null;
  isMock: boolean;
  version: number;
  environmentDryRun: boolean;
};

type WorkflowHealth = {
  workflowKey: string;
  status: HealthStatus;
  runCount: number;
  succeededRunCount: number;
  failedRunCount: number;
  partialRunCount: number;
  failureRatePercent: number;
  consecutiveFailures: number;
  latestRunAt: string | null;
  latestRunStatus: string | null;
  findings: Array<{ findingKey: string; title: string; summary: string; severity: IncidentSeverity; blocksPilot: boolean }>;
};

type Snapshot = {
  id: string;
  pilotReleaseId: string | null;
  evaluatedAt: string;
  overallStatus: HealthStatus;
  metrics: { workflows?: WorkflowHealth[] };
  findings: Array<{ findingKey: string; title: string; summary: string; severity: IncidentSeverity; blocksPilot: boolean }>;
  blockers: unknown[];
  dryRun: boolean;
  isMock: boolean;
};

type Incident = {
  id: string;
  workflowKey: string | null;
  pilotReleaseId: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  summary: string;
  owner: string | null;
  resolutionNote: string | null;
  occurrenceCount: number;
  lastDetectedAt: string;
  resolvedAt: string | null;
};

type Release = {
  id: string;
  releaseKey: string;
  title: string;
  status: string;
  monitoringOwner: string | null;
  isMock: boolean;
};

type Review = {
  id: string;
  pilotReleaseId: string;
  monitoringSnapshotId: string;
  decision: "go" | "conditional_go" | "no_go";
  conditions: string[];
  decisionNote: string;
  decidedBy: string;
  decidedAt: string;
};

type AssurancePayload = {
  success: true;
  phase11Ready: boolean;
  activationLocked: boolean;
  state: string;
  summary: {
    activeReleaseId: string | null;
    policiesReady: boolean;
    policyCount: number;
    mockPolicyCount: number;
    openIncidentCount: number;
    criticalIncidentCount: number;
    latestSnapshotStatus: HealthStatus | null;
    latestSnapshotAt: string | null;
    activeDecision: string | null;
  };
  policies: Policy[];
  snapshots: Snapshot[];
  incidents: Incident[];
  reviews: Review[];
  releases: Release[];
};

type PolicyForm = {
  lookbackHours: string;
  minimumRuns: string;
  maximumFailureRatePercent: string;
  staleRunningMinutes: string;
  maximumConsecutiveFailures: string;
  owner: string;
  enabled: boolean;
  isMock: boolean;
};

const WORKFLOW_LABELS: Record<string, string> = {
  follow_up_scheduler: "Follow-up Scheduler",
  transformation_event_worker: "Transformation Event Worker",
  client_operations_daily: "Client Operations",
  acquisition_batch_processor: "Acquisition Processor",
};

const HEALTH_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  insufficient_data: "Bukti belum cukup",
};

const STATE_LABELS: Record<string, string> = {
  migration_required: "Migration diperlukan",
  release_required: "Release approved diperlukan",
  policy_configuration_required: "Policy real belum lengkap",
  snapshot_required: "Snapshot diperlukan",
  real_snapshot_required: "Snapshot masih mock",
  incident_blocked: "Terblokir critical incident",
  monitoring_blocked: "Bukti monitoring belum memenuhi gate",
  eligible_for_human_review: "Siap keputusan manusia",
  operationally_approved: "Go/no-go sudah tercatat",
};

const HEALTH_STYLE: Record<HealthStatus, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
  insufficient_data: "border-slate-200 bg-slate-50 text-slate-600",
};

function displayDate(value: string | null) {
  if (!value) return "Belum ada";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

function policyForm(policy: Policy): PolicyForm {
  return {
    lookbackHours: String(policy.lookbackHours),
    minimumRuns: String(policy.minimumRuns),
    maximumFailureRatePercent: String(policy.maximumFailureRatePercent),
    staleRunningMinutes: String(policy.staleRunningMinutes),
    maximumConsecutiveFailures: String(policy.maximumConsecutiveFailures),
    owner: policy.owner || "",
    enabled: policy.enabled,
    isMock: policy.isMock,
  };
}

export function OperationalAssurancePanel({ onAction }: { onAction: (url: string, init?: RequestInit) => Promise<unknown> }) {
  const [payload, setPayload] = useState<AssurancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedPolicyKey, setSelectedPolicyKey] = useState("follow_up_scheduler");
  const [policy, setPolicy] = useState<PolicyForm | null>(null);
  const [registerIncidents, setRegisterIncidents] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>("open");
  const [incidentSeverity, setIncidentSeverity] = useState<IncidentSeverity>("medium");
  const [incidentOwner, setIncidentOwner] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [reviewReleaseId, setReviewReleaseId] = useState("");
  const [reviewDecision, setReviewDecision] = useState<Review["decision"]>("no_go");
  const [reviewConditions, setReviewConditions] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onAction("/api/admin/operational-assurance") as AssurancePayload;
      setPayload(response);
      const nextPolicy = response.policies.find((item) => item.workflowKey === selectedPolicyKey) || response.policies[0];
      if (nextPolicy) {
        setSelectedPolicyKey(nextPolicy.workflowKey);
        setPolicy(policyForm(nextPolicy));
      }
      setReviewReleaseId((current) => current || response.summary?.activeReleaseId || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Operational Assurance gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestSnapshot = useMemo(() => {
    const releaseId = reviewReleaseId || payload?.summary.activeReleaseId;
    return payload?.snapshots.find((item) => item.pilotReleaseId === releaseId) || null;
  }, [payload, reviewReleaseId]);
  const workflowHealth = latestSnapshot?.metrics?.workflows || [];
  const selectedIncident = payload?.incidents.find((item) => item.id === selectedIncidentId) || null;
  const selectedReleaseCriticalCount = useMemo(() => payload?.incidents.filter((item) => (
    item.severity === "critical"
    && !["resolved", "dismissed"].includes(item.status)
    && (!item.pilotReleaseId || item.pilotReleaseId === reviewReleaseId)
  )).length || 0, [payload, reviewReleaseId]);

  const choosePolicy = (workflowKey: string) => {
    const selected = payload?.policies.find((item) => item.workflowKey === workflowKey);
    setSelectedPolicyKey(workflowKey);
    if (selected) setPolicy(policyForm(selected));
  };

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/operational-assurance", {
        method: "PATCH",
        body: JSON.stringify({
          action: "save_policy",
          workflowKey: selectedPolicyKey,
          lookbackHours: Number(policy.lookbackHours),
          minimumRuns: Number(policy.minimumRuns),
          maximumFailureRatePercent: Number(policy.maximumFailureRatePercent),
          staleRunningMinutes: Number(policy.staleRunningMinutes),
          maximumConsecutiveFailures: Number(policy.maximumConsecutiveFailures),
          enabled: policy.enabled,
          owner: policy.owner.trim() || null,
          isMock: policy.isMock,
        }),
      });
      setNotice("Policy monitoring tersimpan dan audit trail diperbarui.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Policy gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const runScan = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await onAction("/api/admin/operational-assurance", {
        method: "PATCH",
        headers: {
          "x-idempotency-key": `phase11-admin-scan:${new Date().toISOString()}:${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          action: "run_scan",
          releaseId: payload?.summary.activeReleaseId || null,
          materializeIncidents: registerIncidents,
          humanApproved: registerIncidents,
        }),
      }) as { scan?: { overallStatus?: string; materializedIncidentCount?: number } };
      setNotice(registerIncidents
        ? `Scan selesai. ${response.scan?.materializedIncidentCount || 0} finding dicatat atau diperbarui sebagai incident.`
        : `Preview scan selesai dengan status ${response.scan?.overallStatus || "unknown"}; tidak ada incident yang dibuat.`);
      await load();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan monitoring gagal.");
    } finally {
      setSaving(false);
    }
  };

  const chooseIncident = (incident: Incident) => {
    setSelectedIncidentId(incident.id);
    setIncidentStatus(incident.status);
    setIncidentSeverity(incident.severity);
    setIncidentOwner(incident.owner || "");
    setResolutionNote(incident.resolutionNote || "");
  };

  const saveIncident = async () => {
    if (!selectedIncident) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/operational-assurance", {
        method: "PATCH",
        body: JSON.stringify({
          action: "update_incident",
          incidentId: selectedIncident.id,
          status: incidentStatus,
          severity: incidentSeverity,
          owner: incidentOwner.trim() || null,
          resolutionNote: resolutionNote.trim() || null,
        }),
      });
      setNotice("Status incident dan audit trail berhasil diperbarui.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Incident gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  };

  const recordReview = async () => {
    if (!latestSnapshot || !reviewReleaseId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/operational-assurance", {
        method: "PATCH",
        body: JSON.stringify({
          action: "record_review",
          releaseId: reviewReleaseId,
          snapshotId: latestSnapshot.id,
          decision: reviewDecision,
          conditions: reviewConditions.split("\n").map((item) => item.trim()).filter(Boolean),
          decisionNote: reviewNote,
        }),
      });
      setNotice("Keputusan go/no-go tersimpan dan terikat pada snapshot monitoring terbaru.");
      await load();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Keputusan go/no-go gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (payload && !payload.phase11Ready) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Operational Assurance belum tersedia. Jalankan migration 0036.</div>;
  }

  return (
    <div className="space-y-6">
      <AdminToastFeedback error={error} notice={notice} scope="operational-assurance" />
      <section className="rounded-2xl border border-[#0B2C6B]/10 bg-[linear-gradient(135deg,#071B3D,#0B2C6B)] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E9BD65]">Fase 11 · Operational Assurance</p>
            <h2 className="mt-2 text-2xl font-bold">Kesehatan automation, incident response, dan keputusan pilot</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">Keputusan didasarkan pada execution evidence dan threshold deterministik. Halaman ini tidak mengaktifkan n8n, tidak mengubah environment, dan tidak mengirim pesan keluar.</p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Perbarui data
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">{STATE_LABELS[payload?.state || "release_required"] || payload?.state}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold">Activation tetap terkunci</span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status snapshot" value={payload?.summary.latestSnapshotStatus ? HEALTH_LABELS[payload.summary.latestSnapshotStatus] : "Belum ada"} icon={Activity} tone={payload?.summary.latestSnapshotStatus === "critical" ? "danger" : payload?.summary.latestSnapshotStatus === "healthy" ? "success" : "gold"} />
        <StatCard label="Policy real" value={`${(payload?.summary.policyCount || 0) - (payload?.summary.mockPolicyCount || 0)}/4`} icon={ShieldCheck} tone={payload?.summary.policiesReady ? "success" : "gold"} />
        <StatCard label="Incident terbuka" value={payload?.summary.openIncidentCount || 0} icon={AlertOctagon} tone={payload?.summary.openIncidentCount ? "danger" : "success"} />
        <StatCard label="Keputusan aktif" value={(payload?.summary.activeDecision || "Belum ada").replaceAll("_", " ")} icon={ClipboardCheck} tone={payload?.summary.activeDecision === "go" ? "success" : "gold"} />
      </div>

      <Panel title="Snapshot kesehatan terbaru" action={displayDate(payload?.summary.latestSnapshotAt || null)}>
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#0B2C6B]">Scan aman sebelum keputusan</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Preview hanya menyimpan snapshot. Aktifkan opsi incident jika finding high/critical perlu masuk antrean penanganan manusia.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={registerIncidents} onChange={(event) => setRegisterIncidents(event.target.checked)} /> Catat finding sebagai incident</label>
            <button type="button" onClick={runScan} disabled={saving} className="rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Jalankan scan</button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workflowHealth.map((item) => (
            <div key={item.workflowKey} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-sm font-bold text-[#0B2C6B]">{WORKFLOW_LABELS[item.workflowKey] || item.workflowKey}</p><p className="mt-1 text-[11px] text-slate-400">{item.runCount} run · terakhir {displayDate(item.latestRunAt)}</p></div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${HEALTH_STYLE[item.status]}`}>{HEALTH_LABELS[item.status]}</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-emerald-50 p-2"><strong className="block text-emerald-700">{item.succeededRunCount}</strong><span className="text-slate-400">sukses</span></div><div className="rounded-lg bg-red-50 p-2"><strong className="block text-red-700">{item.failedRunCount + item.partialRunCount}</strong><span className="text-slate-400">gagal</span></div><div className="rounded-lg bg-slate-50 p-2"><strong className="block text-slate-700">{item.failureRatePercent}%</strong><span className="text-slate-400">failure</span></div></div>
              {item.findings[0] && <p className="mt-3 text-xs leading-relaxed text-slate-500">{item.findings[0].title}</p>}
            </div>
          ))}
          {!workflowHealth.length && <p className="col-span-full text-sm text-slate-500">Belum ada snapshot untuk release aktif. Jalankan scan setelah policy diperiksa.</p>}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Monitoring policy" action={payload?.summary.policiesReady ? "Real & owned" : "Mock / belum lengkap"}>
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {payload?.policies.map((item) => (
              <button key={item.workflowKey} type="button" onClick={() => choosePolicy(item.workflowKey)} className={`rounded-xl border p-3 text-left ${selectedPolicyKey === item.workflowKey ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white"}`}>
                <p className="text-xs font-bold text-[#0B2C6B]">{WORKFLOW_LABELS[item.workflowKey]}</p>
                <div className="mt-2 flex gap-2"><Badge tone={item.isMock ? "gold" : "green"}>{item.isMock ? "Mock" : "Real"}</Badge><Badge tone={item.environmentDryRun ? "green" : "red"}>{item.environmentDryRun ? "Env dry-run" : "Env live"}</Badge></div>
              </button>
            ))}
          </div>
          {policy && <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="grid gap-3 sm:grid-cols-2"><AdminInput label="Lookback (jam)" type="number" value={policy.lookbackHours} onChange={(lookbackHours) => setPolicy({ ...policy, lookbackHours })} /><AdminInput label="Minimum run" type="number" value={policy.minimumRuns} onChange={(minimumRuns) => setPolicy({ ...policy, minimumRuns })} /></div>
            <div className="grid gap-3 sm:grid-cols-3"><AdminInput label="Maks failure (%)" type="number" value={policy.maximumFailureRatePercent} onChange={(maximumFailureRatePercent) => setPolicy({ ...policy, maximumFailureRatePercent })} /><AdminInput label="Stale running (menit)" type="number" value={policy.staleRunningMinutes} onChange={(staleRunningMinutes) => setPolicy({ ...policy, staleRunningMinutes })} /><AdminInput label="Gagal beruntun" type="number" value={policy.maximumConsecutiveFailures} onChange={(maximumConsecutiveFailures) => setPolicy({ ...policy, maximumConsecutiveFailures })} /></div>
            <AdminInput label="Monitoring owner" type="email" value={policy.owner} onChange={(owner) => setPolicy({ ...policy, owner })} placeholder="operations@binahub.id" />
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700"><label className="flex items-center gap-2"><input type="checkbox" checked={policy.enabled} onChange={(event) => setPolicy({ ...policy, enabled: event.target.checked })} /> Policy aktif</label><label className="flex items-center gap-2"><input type="checkbox" checked={policy.isMock} onChange={(event) => setPolicy({ ...policy, isMock: event.target.checked })} /> Masih mock</label></div>
            <button type="button" onClick={savePolicy} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save size={14} /> Simpan policy</button>
          </div>}
        </Panel>

        <Panel title="Incident response" action={`${payload?.summary.openIncidentCount || 0} terbuka`}>
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {payload?.incidents.map((item) => (
                <button key={item.id} type="button" onClick={() => chooseIncident(item)} className={`w-full rounded-xl border p-3 text-left ${selectedIncidentId === item.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-start justify-between gap-2"><p className="text-xs font-bold text-[#0B2C6B]">{item.title}</p><Badge tone={item.severity === "critical" || item.severity === "high" ? "red" : "gold"}>{item.severity}</Badge></div>
                  <p className="mt-2 text-[11px] text-slate-500">{WORKFLOW_LABELS[item.workflowKey || ""] || "Platform"} · {item.status.replaceAll("_", " ")} · {item.occurrenceCount}x</p>
                </button>
              ))}
              {!payload?.incidents.length && <p className="text-sm text-slate-500">Belum ada incident. Preview scan tidak membuat incident.</p>}
            </div>
            {selectedIncident ? <div className="space-y-4 rounded-xl bg-slate-50 p-4">
              <div><p className="text-sm font-bold text-[#0B2C6B]">{selectedIncident.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{selectedIncident.summary}</p></div>
              <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span><AdminSelect value={incidentStatus} onChange={(value) => setIncidentStatus(value as IncidentStatus)} options={[["open", "Open"], ["investigating", "Investigating"], ["monitoring", "Monitoring"], ["resolved", "Resolved"], ["dismissed", "Dismissed"]]} /></label><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity</span><AdminSelect value={incidentSeverity} onChange={(value) => setIncidentSeverity(value as IncidentSeverity)} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]]} /></label></div>
              <AdminInput label="Incident owner" type="email" value={incidentOwner} onChange={setIncidentOwner} placeholder="operations@binahub.id" />
              <AdminTextarea label="Catatan penyelesaian" value={resolutionNote} onChange={setResolutionNote} placeholder="Akar masalah, tindakan, dan bukti verifikasi" />
              <button type="button" onClick={saveIncident} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Save size={14} /> Simpan incident</button>
            </div> : <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Pilih incident untuk menetapkan owner, status, severity, dan resolusi.</div>}
          </div>
        </Panel>
      </div>

      <Panel title="Keputusan go / conditional go / no-go" action="Human gate">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-bold text-[#0B2C6B]">Evidence yang akan dikunci</p>
            <dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-3"><dt className="text-slate-500">Release</dt><dd className="text-right font-semibold">{payload?.releases.find((item) => item.id === reviewReleaseId)?.title || "Belum dipilih"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Snapshot</dt><dd className="text-right font-semibold">{latestSnapshot ? `${HEALTH_LABELS[latestSnapshot.overallStatus]} · ${displayDate(latestSnapshot.evaluatedAt)}` : "Belum tersedia"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Policy</dt><dd className="text-right font-semibold">{payload?.summary.policiesReady ? "4 real & owned" : "Belum memenuhi gate"}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-500">Critical incident</dt><dd className="text-right font-semibold">{selectedReleaseCriticalCount}</dd></div></dl>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Keputusan ini tidak menyalakan workflow. Setelah `go`, perubahan environment dan aktivasi n8n tetap merupakan deployment terpisah dengan rollback owner aktif.</p>
          </div>
          <div className="space-y-4">
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Release pilot</span><AdminSelect value={reviewReleaseId} onChange={setReviewReleaseId} options={[["", "Pilih release approved"], ...(payload?.releases.filter((item) => ["approved", "scheduled"].includes(item.status) && !item.isMock).map((item) => [item.id, item.title] as [string, string]) || [])]} /></label>
            <label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Keputusan</span><AdminSelect value={reviewDecision} onChange={(value) => setReviewDecision(value as Review["decision"])} options={[["no_go", "No-go"], ["conditional_go", "Conditional go"], ["go", "Go"]]} /></label>
            {reviewDecision === "conditional_go" && <AdminTextarea label="Kondisi (satu per baris)" value={reviewConditions} onChange={setReviewConditions} placeholder="Owner memantau setiap run selama 48 jam" />}
            <AdminTextarea label="Dasar keputusan" value={reviewNote} onChange={setReviewNote} placeholder="Ringkas evidence, risiko yang diterima, dan alasan keputusan" />
            <button type="button" onClick={recordReview} disabled={saving || !latestSnapshot || !reviewReleaseId} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={14} /> Catat keputusan</button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
