"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Gauge, LockKeyhole, Power, RefreshCw, Save, ShieldAlert } from "lucide-react";
import { AdminToastFeedback } from "@/components/admin-toast-feedback";
import { AdminInput, AdminSelect, AdminTextarea, Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type ReleaseStatus = "draft" | "review_requested" | "approved" | "rejected" | "scheduled" | "paused" | "rolled_back" | "completed";
type RuntimeMode = "disabled" | "dry_run" | "pilot" | "live";

type PilotRelease = {
  id: string;
  releaseKey: string;
  title: string;
  status: ReleaseStatus;
  cohortDescription: string;
  maximumParticipants: number;
  recipientEmails: string[];
  recipientCount: number;
  startsAt: string | null;
  endsAt: string | null;
  businessOwner: string | null;
  technicalOwner: string | null;
  monitoringOwner: string | null;
  successCriteria: string[];
  rollbackTriggers: string[];
  rollbackPlan: string | null;
  decisionNote: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  isMock: boolean;
  updatedAt: string;
};

type RuntimeControl = {
  workflowKey: string;
  requestedMode: RuntimeMode;
  effectiveMode: RuntimeMode;
  environmentDryRun: boolean;
  maximumItemsPerRun: number;
  pilotReleaseId: string | null;
  owner: string | null;
  approvalNote: string | null;
  approvedBy: string | null;
  rollbackPlan: string | null;
  killSwitchReason: string | null;
  version: number;
  updatedAt: string;
};

type PilotOperationsResponse = {
  success: boolean;
  phase10Ready: boolean;
  activationLocked: boolean;
  externalActivationRequired: boolean;
  state: "migration_required" | "construction_locked" | "eligible_for_pilot_review";
  gates?: {
    uat: { ready: boolean; required: number; passed: number };
    templates: { ready: boolean; approvedNonMock: number; required: number };
    businessRules: { ready: boolean; activeVersion: string | null; outboundAutomationEnabled: boolean; blockerCount: number | null };
    approvedRelease: { ready: boolean; count: number };
  };
  releases: PilotRelease[];
  controls: RuntimeControl[];
  releaseEvents: Array<{ id: string; releaseId: string; eventType: string; actor: string; note: string | null; createdAt: string }>;
  controlEvents: Array<{ id: string; workflowKey: string; eventType: string; actor: string; note: string | null; createdAt: string }>;
};

type ReleaseForm = {
  releaseKey: string;
  title: string;
  cohortDescription: string;
  maximumParticipants: string;
  recipientEmails: string;
  startsAt: string;
  endsAt: string;
  businessOwner: string;
  technicalOwner: string;
  monitoringOwner: string;
  successCriteria: string;
  rollbackTriggers: string;
  rollbackPlan: string;
  isMock: boolean;
};

type ControlForm = {
  requestedMode: RuntimeMode;
  maximumItemsPerRun: string;
  owner: string;
  releaseId: string;
  humanApproved: boolean;
  approvalNote: string;
  rollbackPlan: string;
  killSwitchReason: string;
};

const WORKFLOW_LABELS: Record<string, string> = {
  follow_up_scheduler: "Follow-up Scheduler",
  transformation_event_worker: "Transformation Event Worker",
  client_operations_daily: "Client Operations Daily",
  acquisition_batch_processor: "Acquisition Batch Processor",
};

const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  draft: "Draft",
  review_requested: "Menunggu review",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Terjadwal",
  paused: "Dijeda",
  rolled_back: "Rollback",
  completed: "Selesai",
};

const TRANSITIONS: Partial<Record<ReleaseStatus, Array<[ReleaseStatus, string]>>> = {
  draft: [["review_requested", "Ajukan review"]],
  review_requested: [["approved", "Setujui"], ["rejected", "Tolak"]],
  approved: [["scheduled", "Jadwalkan"], ["paused", "Jeda"]],
  scheduled: [["paused", "Jeda"], ["rolled_back", "Rollback"], ["completed", "Selesaikan"]],
  paused: [["scheduled", "Jadwalkan ulang"], ["rolled_back", "Rollback"], ["completed", "Selesaikan"]],
};

function emptyReleaseForm(): ReleaseForm {
  return {
    releaseKey: `pilot-${new Date().toISOString().slice(0, 10)}`,
    title: "Pilot BinaHub Terkontrol",
    cohortDescription: "Cohort terbatas yang akan ditetapkan setelah seluruh gate lulus.",
    maximumParticipants: "5",
    recipientEmails: "",
    startsAt: "",
    endsAt: "",
    businessOwner: "",
    technicalOwner: "",
    monitoringOwner: "",
    successCriteria: "Tidak ada pengiriman ganda\nSeluruh human task memiliki owner dan SLA",
    rollbackTriggers: "Error rate melewati ambang yang disetujui\nPesan terkirim kepada penerima yang tidak semestinya",
    rollbackPlan: "Aktifkan kill switch, hentikan n8n, lalu lakukan rekonsiliasi data dan audit insiden.",
    isMock: true,
  };
}

function localDateTime(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function isoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function releaseForm(item: PilotRelease): ReleaseForm {
  return {
    releaseKey: item.releaseKey,
    title: item.title,
    cohortDescription: item.cohortDescription,
    maximumParticipants: String(item.maximumParticipants),
    recipientEmails: item.recipientEmails.join("\n"),
    startsAt: localDateTime(item.startsAt),
    endsAt: localDateTime(item.endsAt),
    businessOwner: item.businessOwner || "",
    technicalOwner: item.technicalOwner || "",
    monitoringOwner: item.monitoringOwner || "",
    successCriteria: item.successCriteria.join("\n"),
    rollbackTriggers: item.rollbackTriggers.join("\n"),
    rollbackPlan: item.rollbackPlan || "",
    isMock: item.isMock,
  };
}

function controlForm(item: RuntimeControl): ControlForm {
  return {
    requestedMode: item.requestedMode,
    maximumItemsPerRun: String(item.maximumItemsPerRun),
    owner: item.owner || "",
    releaseId: item.pilotReleaseId || "",
    humanApproved: false,
    approvalNote: item.approvalNote || "",
    rollbackPlan: item.rollbackPlan || "",
    killSwitchReason: item.killSwitchReason || "",
  };
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function displayDate(value: string | null | undefined) {
  if (!value) return "Belum tersedia";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(parsed);
}

export function PilotOperationsPanel({ onAction }: { onAction: AdminAction }) {
  const [payload, setPayload] = useState<PilotOperationsResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [plan, setPlan] = useState<ReleaseForm>(emptyReleaseForm);
  const [controlForms, setControlForms] = useState<Record<string, ControlForm>>({});
  const [decisionNote, setDecisionNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onAction("/api/admin/pilot-operations") as PilotOperationsResponse;
      setPayload(response);
      setControlForms(Object.fromEntries(response.controls.map((item) => [item.workflowKey, controlForm(item)])));
      const selected = response.releases.find((item) => item.id === selectedIdRef.current) || response.releases[0] || null;
      selectedIdRef.current = selected?.id || null;
      setSelectedId(selected?.id || null);
      setPlan(selected ? releaseForm(selected) : emptyReleaseForm());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat Pilot Operations.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const selected = useMemo(
    () => payload?.releases.find((item) => item.id === selectedId) || null,
    [payload, selectedId],
  );

  const savePlan = async () => {
    setSaving("plan");
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/pilot-operations", {
        method: "PATCH",
        body: JSON.stringify({
          action: "save_plan",
          releaseId: selected?.id || null,
          releaseKey: plan.releaseKey.trim(),
          title: plan.title.trim(),
          cohortDescription: plan.cohortDescription.trim(),
          maximumParticipants: Number(plan.maximumParticipants),
          recipientEmails: Array.from(new Set(lines(plan.recipientEmails).map((email) => email.toLowerCase()))),
          startsAt: isoOrNull(plan.startsAt),
          endsAt: isoOrNull(plan.endsAt),
          businessOwner: plan.businessOwner.trim() || null,
          technicalOwner: plan.technicalOwner.trim() || null,
          monitoringOwner: plan.monitoringOwner.trim() || null,
          successCriteria: lines(plan.successCriteria),
          rollbackTriggers: lines(plan.rollbackTriggers),
          rollbackPlan: plan.rollbackPlan.trim() || null,
          isMock: plan.isMock,
        }),
      });
      setNotice("Rencana pilot dan audit event berhasil disimpan. Tidak ada workflow yang diaktifkan.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan rencana pilot.");
    } finally {
      setSaving("");
    }
  };

  const transitionPlan = async (nextStatus: ReleaseStatus) => {
    if (!selected) return;
    setSaving(`transition-${nextStatus}`);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/pilot-operations", {
        method: "PATCH",
        body: JSON.stringify({ action: "transition_plan", releaseId: selected.id, nextStatus, decisionNote: decisionNote.trim() }),
      });
      setDecisionNote("");
      setNotice(`Status release diperbarui menjadi ${RELEASE_STATUS_LABELS[nextStatus]}. Aktivasi eksternal tetap terkunci.`);
      await load();
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : "Gagal memperbarui status release.");
    } finally {
      setSaving("");
    }
  };

  const saveControl = async (workflowKey: string) => {
    const form = controlForms[workflowKey];
    if (!form) return;
    setSaving(workflowKey);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/pilot-operations", {
        method: "PATCH",
        body: JSON.stringify({
          action: "set_control",
          workflowKey,
          requestedMode: form.requestedMode,
          maximumItemsPerRun: Number(form.maximumItemsPerRun),
          owner: form.owner.trim() || null,
          releaseId: form.releaseId || null,
          humanApproved: form.humanApproved,
          approvalNote: form.approvalNote.trim() || null,
          rollbackPlan: form.rollbackPlan.trim() || null,
          killSwitchReason: form.killSwitchReason.trim() || null,
        }),
      });
      setNotice(`${WORKFLOW_LABELS[workflowKey]} diperbarui. Effective mode tetap mengikuti environment dry-run.`);
      await load();
    } catch (controlError) {
      setError(controlError instanceof Error ? controlError.message : "Gagal memperbarui runtime control.");
    } finally {
      setSaving("");
    }
  };

  if (loading && !payload) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat Pilot Operations…</div>;
  if (payload && !payload.phase10Ready) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Control plane Fase 10 belum tersedia. Jalankan migration 0035.</div>;

  const gates = payload?.gates;
  return (
    <div className="space-y-6">
      <AdminToastFeedback error={error} notice={notice} scope="pilot-operations" />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Control plane tidak mengaktifkan n8n atau mengubah environment</p>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed">Database hanya dapat memperketat mode dan batas eksekusi. Variabel dry-run tetap menjadi otoritas terakhir; perubahan ke pilot/live membutuhkan gate lengkap, release non-mock, keputusan Operational Assurance, persetujuan manusia, serta langkah aktivasi eksternal.</p>
            </div>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-amber-900/15 bg-white px-3.5 py-2 text-xs font-bold disabled:opacity-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Perbarui
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="UAT wajib" value={`${gates?.uat.passed || 0}/${gates?.uat.required || 12}`} icon={CheckCircle2} tone={gates?.uat.ready ? "success" : "gold"} />
        <StatCard label="Template approved" value={`${gates?.templates.approvedNonMock || 0}/${gates?.templates.required || 18}`} icon={Gauge} tone={gates?.templates.ready ? "success" : "gold"} />
        <StatCard label="Business Rules" value={gates?.businessRules.ready ? `Siap · ${gates.businessRules.activeVersion}` : "Terkunci"} icon={ShieldAlert} tone={gates?.businessRules.ready ? "success" : "danger"} />
        <StatCard label="Release approved" value={gates?.approvedRelease.count || 0} icon={Power} tone={gates?.approvedRelease.ready ? "success" : "default"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel title="Pilot release" action={`${payload?.releases.length || 0} rencana`}>
          <button type="button" onClick={() => { selectedIdRef.current = null; setSelectedId(null); setPlan(emptyReleaseForm()); setDecisionNote(""); }} className="mb-3 w-full rounded-xl border border-dashed border-[#0B2C6B]/30 bg-blue-50/50 p-3 text-xs font-bold text-[#0B2C6B]">+ Rencana baru</button>
          <div className="space-y-2">
            {(payload?.releases || []).map((item) => (
              <button key={item.id} type="button" onClick={() => { selectedIdRef.current = item.id; setSelectedId(item.id); setPlan(releaseForm(item)); setDecisionNote(""); }} className={`w-full rounded-xl border p-4 text-left ${selectedId === item.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-[#0B2C6B]">{item.title}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">{RELEASE_STATUS_LABELS[item.status]}</span></div>
                <p className="mt-2 text-xs text-slate-500">{item.releaseKey} · {item.recipientCount}/{item.maximumParticipants} penerima</p>
                <p className="mt-1 text-[11px] text-slate-400">{item.isMock ? "Data mock" : "Data real"} · {displayDate(item.updatedAt)}</p>
              </button>
            ))}
            {!payload?.releases.length && <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Belum ada release plan.</p>}
          </div>
        </Panel>

        <Panel title={selected ? "Detail release pilot" : "Rencana pilot baru"} action={selected ? RELEASE_STATUS_LABELS[selected.status] : "Draft"}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2"><AdminInput label="Release key" value={plan.releaseKey} onChange={(releaseKey) => setPlan({ ...plan, releaseKey })} placeholder="pilot-september-2026" /><AdminInput label="Judul" value={plan.title} onChange={(title) => setPlan({ ...plan, title })} /></div>
            <AdminTextarea label="Deskripsi cohort" value={plan.cohortDescription} onChange={(cohortDescription) => setPlan({ ...plan, cohortDescription })} />
            <AdminTextarea label="Email penerima pilot — satu per baris" value={plan.recipientEmails} onChange={(recipientEmails) => setPlan({ ...plan, recipientEmails })} placeholder="nama@example.com" />
            <p className="-mt-2 text-xs leading-relaxed text-slate-500">Daftar ini adalah allowlist yang benar-benar ditegakkan worker. Alamat di luar daftar tidak dapat menerima outbound saat mode pilot.</p>
            <div className="grid gap-4 sm:grid-cols-3"><AdminInput label="Maksimum peserta" type="number" value={plan.maximumParticipants} onChange={(maximumParticipants) => setPlan({ ...plan, maximumParticipants })} /><AdminInput label="Mulai" type="datetime-local" value={plan.startsAt} onChange={(startsAt) => setPlan({ ...plan, startsAt })} /><AdminInput label="Selesai" type="datetime-local" value={plan.endsAt} onChange={(endsAt) => setPlan({ ...plan, endsAt })} /></div>
            <div className="grid gap-4 sm:grid-cols-3"><AdminInput label="Business owner" type="email" value={plan.businessOwner} onChange={(businessOwner) => setPlan({ ...plan, businessOwner })} /><AdminInput label="Technical owner" type="email" value={plan.technicalOwner} onChange={(technicalOwner) => setPlan({ ...plan, technicalOwner })} /><AdminInput label="Monitoring owner" type="email" value={plan.monitoringOwner} onChange={(monitoringOwner) => setPlan({ ...plan, monitoringOwner })} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><AdminTextarea label="Kriteria sukses — satu per baris" value={plan.successCriteria} onChange={(successCriteria) => setPlan({ ...plan, successCriteria })} /><AdminTextarea label="Trigger rollback — satu per baris" value={plan.rollbackTriggers} onChange={(rollbackTriggers) => setPlan({ ...plan, rollbackTriggers })} /></div>
            <AdminTextarea label="Rencana rollback" value={plan.rollbackPlan} onChange={(rollbackPlan) => setPlan({ ...plan, rollbackPlan })} />
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><input type="checkbox" checked={plan.isMock} onChange={(event) => setPlan({ ...plan, isMock: event.target.checked })} /><span><strong>Data mock</strong><span className="ml-1 text-slate-500">— release mock tidak dapat diajukan untuk review.</span></span></label>
            <div className="flex justify-end"><button type="button" onClick={savePlan} disabled={saving === "plan" || Boolean(selected && !["draft", "rejected"].includes(selected.status))} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"><Save size={14} /> {saving === "plan" ? "Menyimpan…" : "Simpan rencana"}</button></div>

            {selected && (TRANSITIONS[selected.status] || []).length > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <AdminTextarea label="Catatan keputusan" value={decisionNote} onChange={setDecisionNote} placeholder="Alasan keputusan dan konteks minimal 10 karakter" />
                <div className="mt-3 flex flex-wrap justify-end gap-2">{(TRANSITIONS[selected.status] || []).map(([status, label]) => <button key={status} type="button" onClick={() => transitionPlan(status)} disabled={Boolean(saving)} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40 ${status === "rejected" || status === "rolled_back" ? "bg-red-600" : "bg-[#0B2C6B]"}`}>{saving === `transition-${status}` ? "Memproses…" : label}</button>)}</div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Runtime control & kill switch" action="4 workflow terkontrol">
        <div className="grid gap-4 xl:grid-cols-2">
          {(payload?.controls || []).map((control) => {
            const form = controlForms[control.workflowKey];
            if (!form) return null;
            return (
              <div key={control.workflowKey} className={`rounded-2xl border p-5 ${control.effectiveMode === "disabled" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50/50"}`}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-[#0B2C6B]">{WORKFLOW_LABELS[control.workflowKey]}</p><p className="mt-1 text-xs text-slate-500">Requested: {control.requestedMode} · Effective: <strong>{control.effectiveMode}</strong> · v{control.version}</p></div>{control.environmentDryRun && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">ENV dry-run aktif</span>}</div>
                <div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/36">Requested mode</span><AdminSelect value={form.requestedMode} onChange={(requestedMode) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, requestedMode: requestedMode as RuntimeMode } })} options={[["disabled", "Disabled / kill switch"], ["dry_run", "Dry-run"], ["pilot", "Pilot"], ["live", "Live"]]} /></label><AdminInput label="Maksimum per run" type="number" value={form.maximumItemsPerRun} onChange={(maximumItemsPerRun) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, maximumItemsPerRun } })} /></div>
                {form.requestedMode === "disabled" ? <div className="mt-3"><AdminTextarea label="Alasan kill switch" value={form.killSwitchReason} onChange={(killSwitchReason) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, killSwitchReason } })} /></div> : (
                  <div className="mt-3 space-y-3">
                    <AdminInput label="Owner workflow" type="email" value={form.owner} onChange={(owner) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, owner } })} placeholder="owner@binahub.id" />
                    {["pilot", "live"].includes(form.requestedMode) && <><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-black/36">Approved release</span><AdminSelect value={form.releaseId} onChange={(releaseId) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, releaseId } })} options={[["", "Pilih release"], ...(payload?.releases.filter((item) => ["approved", "scheduled"].includes(item.status) && !item.isMock).map((item) => [item.id, item.title] as [string, string]) || [])]} /></label><AdminTextarea label="Catatan approval" value={form.approvalNote} onChange={(approvalNote) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, approvalNote } })} /><AdminTextarea label="Rencana rollback" value={form.rollbackPlan} onChange={(rollbackPlan) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, rollbackPlan } })} /><label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={form.humanApproved} onChange={(event) => setControlForms({ ...controlForms, [control.workflowKey]: { ...form, humanApproved: event.target.checked } })} /> Saya menyetujui perubahan mode ini sebagai manusia</label></>}
                  </div>
                )}
                <div className="mt-4 flex justify-end"><button type="button" onClick={() => saveControl(control.workflowKey)} disabled={Boolean(saving)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40 ${form.requestedMode === "disabled" ? "bg-red-600" : "bg-[#0B2C6B]"}`}><Save size={13} /> {saving === control.workflowKey ? "Menyimpan…" : form.requestedMode === "disabled" ? "Aktifkan kill switch" : "Simpan kontrol"}</button></div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500"><div className="flex gap-2"><AlertTriangle size={15} className="shrink-0 text-amber-600" /><p>Jika requested mode pilot/live tetapi environment masih dry-run, effective mode tetap <strong>dry_run</strong>. Fase 11 juga mewajibkan go/conditional go dan tidak adanya critical incident. Perubahan environment serta aktivasi n8n tetap dilakukan sebagai deployment terpisah.</p></div></div>
    </div>
  );
}
