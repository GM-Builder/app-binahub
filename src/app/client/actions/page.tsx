"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, ListChecks, RefreshCw, ShieldCheck, X, ArrowUpRight, Flag } from "lucide-react";
import { toast } from "sonner";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useActions, updateAction } from "@/hooks/use-transformation-data";
import type { Action, ActionStatus } from "@/lib/transformation-types";
import { StatusPill, ProgressBar, FilterTabs, EmptyState, ListSkeleton, SearchInput } from "@/components/ui";
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

const PRIORITY_TONES: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-400",
  medium: "border-l-amber-300",
  low: "border-l-slate-200",
};

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate) return false;
  if (["done", "verified", "cancelled"].includes(status)) return false;
  return new Date(dueDate) < new Date();
}

function ActionCard({ action, onStatusChange }: { action: Action; onStatusChange: (id: string) => void }) {
  const config = STATUS_CONFIG[action.status] || STATUS_CONFIG.todo;
  const overdue = isOverdue(action.due_date, action.status);

  const nextMap: Record<string, ActionStatus | null> = {
    todo: "in_progress",
    in_progress: "done",
    blocked: "in_progress",
    done: "verified",
    verified: null,
    cancelled: "todo",
  };

  const next = nextMap[action.status] || null;

  const handleQuickTransition = useCallback(async () => {
    if (!next) return;
    const payload: Record<string, unknown> = { status: next };
    if (next === "done") payload.progress = 100;
    await updateAction(action.id, payload);
    toast.success("Status tindakan diperbarui");
    onStatusChange(action.id);
  }, [action.id, next, onStatusChange]);

  const priorityBorder = PRIORITY_TONES[action.priority || ""] || "border-l-[#0B2C6B]/10";

  return (
    <article className={`rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] border-l-4 ${priorityBorder}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill status={action.status} icon={config.icon} />
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                <AlertTriangle size={10} /> OVERDUE
              </span>
            )}
            {action.priority === "critical" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                <Flag size={10} /> KRITIS
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-base font-semibold text-[#0B2C6B]">{action.title}</h3>
          {action.description && <p className="mt-0.5 text-sm text-[#4A4C54]/60 line-clamp-2">{action.description}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#4A4C54]/50">
            {action.due_date && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(action.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            )}
            {action.assigned_to && <span className="flex items-center gap-1">Ditugaskan: {action.assigned_to}</span>}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar value={action.progress} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">
          {next && (
            <button type="button" onClick={handleQuickTransition}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0B2C6B] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#0A255A]">
              {next === "in_progress" && <><RefreshCw size={10} /> Mulai</>}
              {next === "done" && <><CheckCircle2 size={10} /> Selesaikan</>}
              {next === "verified" && <><ShieldCheck size={10} /> Verifikasi</>}
              {next === "todo" && <><RefreshCw size={10} /> Buka Kembali</>}
            </button>
          )}
          {action.status === "in_progress" && (
            <button type="button" onClick={async () => { await updateAction(action.id, { status: "blocked" }); toast.success("Tindakan diblokir"); onStatusChange(action.id); }}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50">
              <AlertTriangle size={10} /> Blokir
            </button>
          )}
        </div>
        <Link href={`/client/actions/detail?id=${action.id}`}
          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          Detail <ArrowUpRight size={10} />
        </Link>
      </div>
    </article>
  );
}

export default function ClientActionsPage() {
  const { actions, loading, refetch } = useActions();
  const [filter, setFilter] = useState<ActionStatus | "all">("all");
  const [search, setSearch] = useState("");

  const handleStatusChange = useCallback(() => refetch(), [refetch]);

  const filteredActions = useMemo(() => {
    let list = filter === "all" ? actions : actions.filter((a) => a.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q)));
    }
    return list;
  }, [actions, filter, search]);

  const counts = {
    all: actions.length,
    todo: actions.filter((a) => a.status === "todo").length,
    in_progress: actions.filter((a) => a.status === "in_progress").length,
    blocked: actions.filter((a) => a.status === "blocked").length,
    done: actions.filter((a) => a.status === "done").length,
    verified: actions.filter((a) => a.status === "verified").length,
    cancelled: actions.filter((a) => a.status === "cancelled").length,
  };

  const filterTabs = ["all", "todo", "in_progress", "blocked", "done", "verified", "cancelled"] as const;

  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Sistem Tindakan" title="Tindakan">
        <ErrorBoundary>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari tindakan..." className="w-64" />
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((status) => (
                <button key={status} type="button" onClick={() => setFilter(status)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === status
                      ? "bg-[#0B2C6B] text-white"
                      : "bg-white border border-[#0B2C6B]/10 text-[#0B2C6B]/70 hover:bg-[#F5F7FA]"
                  }`}>
                  {status === "all" ? "Semua" : STATUS_CONFIG[status]?.label || status}
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === status ? "bg-white/20" : "bg-[#F5F7FA]"}`}>
                    {counts[status]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <ListSkeleton count={3} />
          ) : filteredActions.length === 0 ? (
            <div className="py-20 text-center">
              <ListChecks size={40} className="mx-auto text-[#0B2C6B]/20" />
              <p className="mt-4 text-sm text-[#4A4C54]/60">
                {filter === "all" ? "Belum ada tindakan." : `Tidak ada ${(STATUS_CONFIG[filter]?.label || filter).toLowerCase()}.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => (
                <ActionCard key={action.id} action={action} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
