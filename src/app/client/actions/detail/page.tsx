"use client";

import { useMemo, useCallback, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Flag, User, CheckCircle2, RefreshCw, AlertTriangle, Clock, X, ShieldCheck, History } from "lucide-react";
import { toast } from "sonner";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useActions, updateAction } from "@/hooks/use-transformation-data";
import type { Action, ActionStatus } from "@/lib/transformation-types";
import { StatusPill, ProgressBar, Breadcrumb } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
  todo: { label: "Akan Dilakukan", icon: <Clock size={14} />, tone: "bg-slate-100 text-slate-700" },
  in_progress: { label: "Sedang Berjalan", icon: <RefreshCw size={14} />, tone: "bg-blue-50 text-blue-700" },
  blocked: { label: "Terhambat", icon: <AlertTriangle size={14} />, tone: "bg-red-50 text-red-700" },
  done: { label: "Selesai", icon: <CheckCircle2 size={14} />, tone: "bg-emerald-50 text-emerald-700" },
  verified: { label: "Terverifikasi", icon: <ShieldCheck size={14} />, tone: "bg-indigo-50 text-indigo-700" },
  cancelled: { label: "Dibatalkan", icon: <X size={14} />, tone: "bg-gray-100 text-gray-500" },
};

const PRIORITY_CONFIG: Record<string, { label: string; tone: string }> = {
  critical: { label: "Kritis", tone: "bg-red-50 text-red-700" },
  high: { label: "Tinggi", tone: "bg-orange-50 text-orange-700" },
  medium: { label: "Sedang", tone: "bg-amber-50 text-amber-700" },
  low: { label: "Rendah", tone: "bg-slate-50 text-slate-600" },
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function daysUntil(dueDate: string | null): number | null {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function NextActions({ action, onAction }: { action: Action; onAction: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const nextMap: Record<string, ActionStatus[]> = {
    todo: ["in_progress", "cancelled"],
    in_progress: ["done", "blocked", "cancelled"],
    blocked: ["in_progress", "cancelled"],
    done: ["verified", "in_progress"],
    verified: [],
    cancelled: ["todo"],
  };

  const nextStatuses = nextMap[action.status] || [];

  const handleTransition = useCallback(async (status: ActionStatus) => {
    setUpdating(true);
    try {
      const payload: Record<string, unknown> = { status };
      if (status === "cancelled" && cancelReason) payload.cancelled_reason = cancelReason;
      if (status === "done") payload.progress = 100;
      if (status === "verified") payload.verified_at = new Date().toISOString();
      await updateAction(action.id, payload);
      toast.success("Status tindakan diperbarui");
      onAction();
    } catch { toast.error("Gagal memperbarui status"); } finally { setUpdating(false); }
  }, [action.id, cancelReason, onAction]);

  if (nextStatuses.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {nextStatuses.includes("in_progress") && (
        <button type="button" onClick={() => handleTransition("in_progress")} disabled={updating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A] disabled:opacity-50">
          <RefreshCw size={12} /> {action.status === "done" ? "Buka Kembali" : "Mulai"}
        </button>
      )}
      {nextStatuses.includes("done") && (
        <button type="button" onClick={() => handleTransition("done")} disabled={updating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          <CheckCircle2 size={12} /> Selesaikan
        </button>
      )}
      {nextStatuses.includes("verified") && (
        <button type="button" onClick={() => handleTransition("verified")} disabled={updating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          <ShieldCheck size={12} /> Verifikasi
        </button>
      )}
      {nextStatuses.includes("blocked") && (
        <button type="button" onClick={() => handleTransition("blocked")} disabled={updating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
          <AlertTriangle size={12} /> Blokir
        </button>
      )}
      {nextStatuses.includes("cancelled") && (
        <div className="flex items-center gap-2">
          <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Alasan pembatalan..."
            className="w-44 rounded-lg border border-[#0B2C6B]/10 px-2 py-1.5 text-xs text-[#0B2C6B] outline-none placeholder:text-[#4A4C54]/40 focus:border-[#D9A441]" />
          <button type="button" onClick={() => handleTransition("cancelled")} disabled={updating || !cancelReason}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <X size={12} /> Batalkan
          </button>
        </div>
      )}
    </div>
  );
}

function ActionDetailContent() {
  const searchParams = useSearchParams();
  const actionId = searchParams.get("id") || "";
  const { actions, loading, refetch } = useActions();
  const [progressInput, setProgressInput] = useState("");
  const [assignInput, setAssignInput] = useState("");

  const action = useMemo(() => actions.find((a) => a.id === actionId), [actions, actionId]);

  const handleUpdateProgress = useCallback(async () => {
    if (!action || !progressInput) return;
    const val = parseInt(progressInput, 10);
    if (isNaN(val)) return;
    await updateAction(action.id, { progress: Math.min(100, Math.max(0, val)) });
    setProgressInput("");
    toast.success("Kemajuan diperbarui");
    refetch();
  }, [action, progressInput, refetch]);

  const handleAssign = useCallback(async () => {
    if (!action || !assignInput) return;
    await updateAction(action.id, { assigned_to: assignInput });
    setAssignInput("");
    toast.success("Pemilik tindakan ditetapkan");
    refetch();
  }, [action, assignInput, refetch]);

  const handleSetPriority = useCallback(async (priority: string) => {
    if (!action) return;
    await updateAction(action.id, { priority });
    toast.success("Prioritas diperbarui");
    refetch();
  }, [action, refetch]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat...</div>;
  }

  if (!action) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-[#4A4C54]/60">Tindakan tidak ditemukan.</p>
        <Link href="/client/actions" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#D9A441]">
          <ArrowLeft size={12} /> Kembali ke Tindakan
        </Link>
      </div>
    );
  }

  const config = STATUS_CONFIG[action.status] || STATUS_CONFIG.todo;
  const overdue = isOverdue(action.due_date) && !["done", "verified", "cancelled"].includes(action.status);
  const dueDays = daysUntil(action.due_date);
  const historyEntries = [
    { date: action.created_at, event: "Tindakan dibuat", status: "todo" },
    ...(action.completed_at ? [{ date: action.completed_at, event: "Tindakan selesai", status: "done" }] : []),
    ...(action.verified_at ? [{ date: action.verified_at, event: "Tindakan terverifikasi", status: "verified" }] : []),
  ];

  return (
    <>
      <Breadcrumb items={[
        { label: "Tindakan", href: "/client/actions" },
        { label: action.title },
      ]} />

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <StatusPill status={action.status} icon={config.icon} />
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                  <AlertTriangle size={10} /> TERLAMBAT
                </span>
              )}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-[#0B2C6B]">{action.title}</h2>
            {action.description && <p className="mt-1 text-sm text-[#4A4C54]/80">{action.description}</p>}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Tenggat Waktu</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6B]">
              <CalendarClock size={14} className="text-[#4A4C54]/40" />
              {action.due_date
                ? `${new Date(action.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}${dueDays !== null ? ` (${dueDays > 0 ? `${dueDays}h tersisa` : dueDays === 0 ? "Hari Ini" : `${Math.abs(dueDays)}h terlambat`})` : ""}`
                : "Tidak ada tenggat"}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Ditugaskan Kepada</p>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6B]">
              <User size={14} className="text-[#4A4C54]/40" />
              {action.assigned_to || "Tidak ditugaskan"}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Prioritas</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Flag size={14} className="text-[#4A4C54]/40" />
              {action.priority ? (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_CONFIG[action.priority]?.tone || "bg-slate-50 text-slate-600"}`}>
                  {PRIORITY_CONFIG[action.priority]?.label || action.priority}
                </span>
              ) : <span className="text-sm text-[#4A4C54]/60">Belum diatur</span>}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Kemajuan</p>
            <div className="mt-1"><ProgressBar value={action.progress} /><p className="mt-1 text-right text-xs text-[#4A4C54]/50">{action.progress}%</p></div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Transisi</p>
          <NextActions action={action} onAction={refetch} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Perbarui Kemajuan</p>
          <div className="mt-3 flex items-center gap-2">
            <input type="number" min={0} max={100} value={progressInput} onChange={(e) => setProgressInput(e.target.value)}
              placeholder="0-100" className="w-20 rounded-lg border border-[#0B2C6B]/10 px-3 py-1.5 text-sm text-[#0B2C6B] outline-none placeholder:text-[#4A4C54]/40 focus:border-[#D9A441]" />
            <button type="button" onClick={handleUpdateProgress}
              className="rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A]">Atur</button>
          </div>
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Tetapkan Pemilik</p>
          <div className="mt-3 flex items-center gap-2">
            <input type="text" value={assignInput} onChange={(e) => setAssignInput(e.target.value)}
              placeholder="Nama atau email" className="min-w-0 flex-1 rounded-lg border border-[#0B2C6B]/10 px-3 py-1.5 text-sm text-[#0B2C6B] outline-none placeholder:text-[#4A4C54]/40 focus:border-[#D9A441]" />
            <button type="button" onClick={handleAssign}
              className="rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A]">Tetapkan</button>
          </div>
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Atur Prioritas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["low", "medium", "high", "critical"].map((p) => (
              <button key={p} type="button" onClick={() => handleSetPriority(p)}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${action.priority === p ? "bg-[#0B2C6B] text-white" : "border border-[#0B2C6B]/10 text-[#4A4C54]/70 hover:bg-[#F5F7FA]"}`}>
                {PRIORITY_CONFIG[p]?.label || p}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Riwayat Aktivitas</p>
          <div className="mt-3 space-y-2">
            {historyEntries.map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <History size={12} className="shrink-0 text-[#4A4C54]/30" />
                <span className="text-[#4A4C54]/50">{new Date(entry.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-[#0B2C6B]">{entry.event}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default function ClientActionDetailPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Sistem Tindakan" title="Detail Tindakan">
        <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat tindakan...</div>}>
            <ActionDetailContent />
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
