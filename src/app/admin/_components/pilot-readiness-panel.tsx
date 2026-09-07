"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, ExternalLink, LockKeyhole, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { AdminToastFeedback } from "@/components/admin-toast-feedback";
import { AdminInput, AdminSelect, AdminTextarea, Panel, StatCard } from "./shared";

type AdminAction = (url: string, init?: RequestInit) => Promise<unknown>;
type UatStatus = "not_started" | "in_progress" | "passed" | "failed" | "blocked" | "not_applicable";

type Scenario = {
  id: string;
  scenarioKey: string;
  category: string;
  title: string;
  objective: string;
  expectedResult: string;
  required: boolean;
  status: UatStatus;
  owner: string | null;
  environment: "local" | "staging" | "production";
  evidenceNote: string | null;
  evidenceUrl: string | null;
  actualResult: string | null;
  blockerReason: string | null;
  lastTestedAt: string | null;
  lastTestedBy: string | null;
  updatedAt: string;
};

type UatEvent = {
  id: string;
  scenarioId: string;
  eventType: string;
  actor: string;
  note: string | null;
  createdAt: string;
};

type PilotResponse = {
  success: boolean;
  phase9Ready: boolean;
  state: "uat_incomplete" | "eligible_for_human_review";
  activationLocked: boolean;
  humanDecisionRequired: boolean;
  summary: {
    total: number;
    required: number;
    passed: number;
    failed: number;
    blocked: number;
    inProgress: number;
    remaining: number;
    evidenceIssueCount: number;
    completionPercent: number;
  };
  blockers: Array<{ key: string; label: string }>;
  scenarios: Scenario[];
  events: UatEvent[];
};

type ScenarioForm = {
  status: UatStatus;
  owner: string;
  environment: "local" | "staging" | "production";
  evidenceNote: string;
  evidenceUrl: string;
  actualResult: string;
  blockerReason: string;
};

const STATUS_OPTIONS: Array<[UatStatus, string]> = [
  ["not_started", "Belum dimulai"],
  ["in_progress", "Sedang diuji"],
  ["passed", "Lulus"],
  ["failed", "Gagal"],
  ["blocked", "Terblokir"],
  ["not_applicable", "Tidak berlaku"],
];

const STATUS_STYLE: Record<UatStatus, string> = {
  not_started: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  passed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  blocked: "bg-amber-100 text-amber-800",
  not_applicable: "bg-slate-100 text-slate-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  public_funnel: "Public Funnel",
  security_access: "Security & Access",
  sales_proposal: "Sales & Proposal",
  calendar: "Calendar",
  deliverability: "Deliverability",
  client_delivery: "Client & Delivery",
  retention: "Retain & Repeat",
  accessibility: "Accessibility",
  operations: "Operations",
};

function formFromScenario(scenario: Scenario): ScenarioForm {
  return {
    status: scenario.status,
    owner: scenario.owner || "",
    environment: scenario.environment,
    evidenceNote: scenario.evidenceNote || "",
    evidenceUrl: scenario.evidenceUrl || "",
    actualResult: scenario.actualResult || "",
    blockerReason: scenario.blockerReason || "",
  };
}

function displayDate(value: string | null | undefined) {
  if (!value) return "Belum diuji";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(date);
}

export function PilotReadinessPanel({ onAction }: { onAction: AdminAction }) {
  const [payload, setPayload] = useState<PilotResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [form, setForm] = useState<ScenarioForm | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await onAction("/api/admin/pilot-readiness") as PilotResponse;
      setPayload(response);
      const nextSelected = response.scenarios.find((item) => item.id === selectedIdRef.current)
        || response.scenarios[0]
        || null;
      selectedIdRef.current = nextSelected?.id || null;
      setSelectedId(nextSelected?.id || null);
      setForm(nextSelected ? formFromScenario(nextSelected) : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat Human UAT & Pilot Gate.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const selected = useMemo(
    () => payload?.scenarios.find((item) => item.id === selectedId) || null,
    [payload, selectedId],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (payload?.scenarios || []).filter((scenario) => (
      (statusFilter === "all" || scenario.status === statusFilter)
      && (!normalized || [scenario.title, scenario.objective, scenario.category, scenario.owner || ""].join(" ").toLowerCase().includes(normalized))
    ));
  }, [payload, query, statusFilter]);

  const selectedEvents = useMemo(
    () => (payload?.events || []).filter((event) => event.scenarioId === selectedId).slice(0, 12),
    [payload, selectedId],
  );

  const saveScenario = async () => {
    if (!selected || !form) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await onAction("/api/admin/pilot-readiness", {
        method: "PATCH",
        body: JSON.stringify({
          scenarioId: selected.id,
          status: form.status,
          owner: form.owner.trim() || null,
          environment: form.environment,
          evidenceNote: form.evidenceNote.trim() || null,
          evidenceUrl: form.evidenceUrl.trim() || null,
          actualResult: form.actualResult.trim() || null,
          blockerReason: form.blockerReason.trim() || null,
        }),
      });
      setNotice("Hasil UAT dan audit trail berhasil disimpan.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan hasil UAT.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !payload) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat Human UAT &amp; Pilot Gate…</div>;
  }
  if (payload && !payload.phase9Ready) {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Fondasi Fase 9 belum tersedia. Jalankan migration 0034 sebelum membuka UAT.</div>;
  }

  return (
    <div className="space-y-6">
      <AdminToastFeedback error={error} notice={notice} scope="pilot-readiness" />

      <div className={`rounded-2xl border p-5 ${payload?.state === "eligible_for_human_review" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold">Pilot tetap terkunci sampai UAT lengkap dan diputuskan manusia</p>
              <p className="mt-1 max-w-4xl text-sm leading-relaxed">
                Status lulus pada seluruh skenario wajib hanya menjadikan pilot layak direview. Halaman ini tidak memiliki aksi untuk mengaktifkan workflow, mengubah dry-run, atau mengirim pesan live.
              </p>
            </div>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-current/20 bg-white/70 px-3.5 py-2 text-xs font-bold disabled:opacity-50">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Perbarui
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Progres UAT wajib" value={`${payload?.summary.completionPercent || 0}%`} icon={ClipboardCheck} />
        <StatCard label="Skenario lulus" value={`${payload?.summary.passed || 0}/${payload?.summary.required || 12}`} icon={CheckCircle2} tone="success" />
        <StatCard label="Gagal / terblokir" value={(payload?.summary.failed || 0) + (payload?.summary.blocked || 0)} icon={AlertTriangle} tone={(payload?.summary.failed || payload?.summary.blocked) ? "danger" : "default"} />
        <StatCard label="Status pilot" value={payload?.state === "eligible_for_human_review" ? "Siap direview" : "Terkunci"} icon={ShieldCheck} tone={payload?.state === "eligible_for_human_review" ? "success" : "gold"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Skenario UAT" action={`${filtered.length} dari ${payload?.summary.total || 0}`}>
          <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <AdminInput label="Cari skenario" value={query} onChange={setQuery} placeholder="Judul, kategori, atau owner" />
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">Filter status</span>
              <AdminSelect value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter status UAT" options={[["all", "Semua status"], ...STATUS_OPTIONS]} />
            </label>
          </div>
          <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
            {filtered.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => {
                  selectedIdRef.current = scenario.id;
                  setSelectedId(scenario.id);
                  setForm(formFromScenario(scenario));
                }}
                className={`w-full rounded-xl border p-4 text-left transition ${selectedId === scenario.id ? "border-[#D9A441] bg-[#FFF8EA]" : "border-slate-200 bg-white hover:border-[#0B2C6B]/30"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#C79A3C]">{CATEGORY_LABELS[scenario.category] || scenario.category}</p>
                    <p className="mt-1 text-sm font-bold text-[#0B2C6B]">{scenario.title}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[scenario.status]}`}>
                    {STATUS_OPTIONS.find(([value]) => value === scenario.status)?.[1]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{scenario.objective}</p>
                <p className="mt-2 text-[11px] text-slate-400">{scenario.owner || "Owner belum ditetapkan"}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={selected?.title || "Pilih skenario"} action={selected?.required ? "Wajib" : "Opsional"}>
          {selected && form ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-bold text-[#0B2C6B]">Tujuan</p>
                <p className="mt-1 leading-relaxed text-slate-600">{selected.objective}</p>
                <p className="mt-4 font-bold text-[#0B2C6B]">Hasil yang diharapkan</p>
                <p className="mt-1 leading-relaxed text-slate-600">{selected.expectedResult}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">Status pengujian</span>
                  <AdminSelect
                    value={form.status}
                    onChange={(value) => setForm({ ...form, status: value as UatStatus })}
                    options={selected.required ? STATUS_OPTIONS.filter(([value]) => value !== "not_applicable") : STATUS_OPTIONS}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">Environment</span>
                  <AdminSelect value={form.environment} onChange={(value) => setForm({ ...form, environment: value as ScenarioForm["environment"] })} options={[["local", "Local"], ["staging", "Staging"], ["production", "Production"]]} />
                </label>
              </div>
              <AdminInput label="Owner pengujian" type="email" value={form.owner} onChange={(owner) => setForm({ ...form, owner })} placeholder="nama@binahub.id" help="Wajib untuk status sedang diuji, lulus, gagal, atau terblokir." />
              <AdminTextarea label="Catatan bukti" value={form.evidenceNote} onChange={(evidenceNote) => setForm({ ...form, evidenceNote })} placeholder="Langkah yang dijalankan dan bukti yang diperiksa" />
              <AdminInput label="URL bukti (HTTPS)" type="url" value={form.evidenceUrl} onChange={(evidenceUrl) => setForm({ ...form, evidenceUrl })} placeholder="https://..." />
              <AdminTextarea label="Hasil aktual" value={form.actualResult} onChange={(actualResult) => setForm({ ...form, actualResult })} placeholder="Apa yang benar-benar terjadi saat pengujian" />
              {form.status === "blocked" && (
                <AdminTextarea label="Alasan blocker" value={form.blockerReason} onChange={(blockerReason) => setForm({ ...form, blockerReason })} placeholder="Keputusan, akses, atau dependency yang masih dibutuhkan" />
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">Terakhir diuji: {displayDate(selected.lastTestedAt)}{selected.lastTestedBy ? ` oleh ${selected.lastTestedBy}` : ""}</p>
                <button type="button" onClick={saveScenario} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                  <Save size={14} /> {saving ? "Menyimpan…" : "Simpan hasil UAT"}
                </button>
              </div>

              {selected.evidenceUrl && (
                <a href={selected.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-[#0B2C6B] underline decoration-[#D9A441] underline-offset-4">
                  Buka bukti tersimpan <ExternalLink size={13} />
                </a>
              )}

              <div className="border-t border-slate-100 pt-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Audit trail terbaru</p>
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex flex-wrap justify-between gap-2"><strong className="text-[#0B2C6B]">{event.eventType.replaceAll("_", " ")}</strong><span>{displayDate(event.createdAt)}</span></div>
                      <p className="mt-1">{event.actor}{event.note ? ` — ${event.note}` : ""}</p>
                    </div>
                  ))}
                  {!selectedEvents.length && <p className="text-xs text-slate-500">Belum ada audit event.</p>}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Pilih skenario untuk mencatat owner, hasil, bukti, dan blocker.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
