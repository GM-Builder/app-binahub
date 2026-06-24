"use client";

import { useState } from "react";
import { Clock3, CheckCircle2, AlertCircle, RefreshCw, Radio, Filter } from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEvents } from "@/hooks/use-transformation-data";
import { StatusPill, EmptyState, FilterTabs } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

const STATUS_FILTERS = [
  { key: "Semua", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "processing", label: "Diproses" },
  { key: "done", label: "Selesai" },
  { key: "failed", label: "Gagal" },
];

function EventsContent() {
  const { events, loading, error, refetch } = useEvents();
  const [statusFilter, setStatusFilter] = useState("Semua");

  const filteredEvents = events.filter((e) =>
    statusFilter === "Semua" || e.status === statusFilter
  );

  const statusCounts = {
    pending: events.filter((e) => e.status === "pending").length,
    processing: events.filter((e) => e.status === "processing").length,
    done: events.filter((e) => e.status === "done").length,
    failed: events.filter((e) => e.status === "failed").length,
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat antrian kejadian...</div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Gagal memuat data"
        description={error}
        action={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A255A]"
          >
            <RefreshCw size={14} /> Coba Lagi
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Event-Driven Core</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Antrian Kejadian</h1>
          <p className="mt-1 text-sm text-[#4A4C54]/60">{events.length} kejadian tercatat</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]"
        >
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 text-center shadow-sm">
          <Clock3 size={18} className="mx-auto text-amber-500" />
          <p className="mt-2 text-2xl font-bold text-[#0B2C6B]">{statusCounts.pending}</p>
          <p className="text-xs text-[#4A4C54]/50">Menunggu</p>
        </div>
        <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 text-center shadow-sm">
          <Radio size={18} className="mx-auto text-blue-500" />
          <p className="mt-2 text-2xl font-bold text-[#0B2C6B]">{statusCounts.processing}</p>
          <p className="text-xs text-[#4A4C54]/50">Diproses</p>
        </div>
        <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 text-center shadow-sm">
          <CheckCircle2 size={18} className="mx-auto text-emerald-500" />
          <p className="mt-2 text-2xl font-bold text-[#0B2C6B]">{statusCounts.done}</p>
          <p className="text-xs text-[#4A4C54]/50">Selesai</p>
        </div>
        <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 text-center shadow-sm">
          <AlertCircle size={18} className="mx-auto text-red-500" />
          <p className="mt-2 text-2xl font-bold text-[#0B2C6B]">{statusCounts.failed}</p>
          <p className="text-xs text-[#4A4C54]/50">Gagal</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={14} className="text-[#4A4C54]/50" />
          <span className="text-xs font-semibold text-[#4A4C54]/50">Filter Status</span>
        </div>
        <FilterTabs
          tabs={STATUS_FILTERS}
          active={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <Radio size={40} className="mx-auto text-[#0B2C6B]/15" />
            <p className="mt-4 text-sm text-[#4A4C54]/50">
              {statusFilter === "Semua"
                ? "Belum ada kejadian di antrian."
                : `Tidak ada kejadian dengan status "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#0B2C6B]/5">
            {filteredEvents.map((event) => {
              const msg = event.payload?.message ? String(event.payload.message) : null;
              return (
                <div key={event.id} className="flex items-start gap-4 p-4 transition hover:bg-[#F5F7FA]/50 sm:p-5">
                  <span className="mt-0.5">
                    {event.status === "done" ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : event.status === "failed" ? (
                      <AlertCircle size={18} className="text-red-500" />
                    ) : event.status === "processing" ? (
                      <Radio size={18} className="text-blue-500" />
                    ) : (
                      <Clock3 size={18} className="text-amber-500" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#0B2C6B]">{event.type}</h3>
                      <StatusPill status={event.status} />
                    </div>
                    <p className="mt-1 text-sm text-[#4A4C54]/70">
                      {event.aggregate_type && (
                        <span className="font-medium">{event.aggregate_type}</span>
                      )}
                      {event.aggregate_id && (
                        <span className="text-[#4A4C54]/50"> #{String(event.aggregate_id).slice(0, 8)}</span>
                      )}
                      {!event.aggregate_type && msg && <span>{msg}</span>}
                      {!event.aggregate_type && !msg && (
                        <span className="text-[#4A4C54]/50">Antrian sistem</span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#4A4C54]/50">
                      <span>Dibuat: {new Date(event.created_at).toLocaleString("id-ID")}</span>
                      {event.processed_at && (
                        <span>Diproses: {new Date(event.processed_at).toLocaleString("id-ID")}</span>
                      )}
                      {event.attempts > 0 && <span>Percobaan: {event.attempts}</span>}
                      {event.error_message && (
                        <span className="text-red-500">Error: {event.error_message}</span>
                      )}
                    </div>
                    {event.engagement_id && (
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-[#0B2C6B]/5 px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">
                          Program: #{String(event.engagement_id).slice(0, 8)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Tentang Antrian Kejadian</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Setiap tindakan di BinaHub menghasilkan event yang masuk ke antrian ini.
          Event diproses secara asinkron untuk memperbarui skor kemampuan dan menghasilkan insight.
          Proses ini memastikan data selalu konsisten dan dapat ditelusuri.
        </p>
      </div>
    </div>
  );
}

export default function FacilitatorEventsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Sistem Kejadian" title="Antrian Kejadian">
        <ErrorBoundary>
          <EventsContent />
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
