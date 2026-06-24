"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useEngagements, useEvidence } from "@/hooks/use-transformation-data";
import { ProgressBar, TrendIcon, EmptyState } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/lib/supabase";

const CAPABILITIES = [
  { name: "Kepemimpinan", score: 76, trend: "up", evidenceCount: 12 },
  { name: "Komunikasi", score: 81, trend: "up", evidenceCount: 9 },
  { name: "Kolaborasi", score: 69, trend: "stable", evidenceCount: 8 },
  { name: "Eksekusi", score: 73, trend: "up", evidenceCount: 11 },
  { name: "Berpikir Strategis", score: 67, trend: "down", evidenceCount: 6 },
];

export default function FacilitatorReportsPage() {
  const { engagements } = useEngagements();
  const { evidence } = useEvidence();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (engagementId: string) => {
    setExportingId(engagementId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Sesi tidak valid.");
        setExportingId(null);
        return;
      }

      const response = await fetch(`/api/export?engagement_id=${engagementId}&type=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        toast.error("Gagal mengunduh data.");
        setExportingId(null);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-${engagementId.slice(0, 8)}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Berhasil mengunduh data.");
    } catch {
      toast.error("Gagal mengunduh data.");
    }
    setExportingId(null);
  };

  const activeEngagements = useMemo(
    () => engagements.filter((e) => e.status === "active" || e.status === "in_progress" || e.status === "review"),
    [engagements],
  );

  const averageScore = useMemo(
    () => Math.round(CAPABILITIES.reduce((s, c) => s + c.score, 0) / CAPABILITIES.length),
    [],
  );

  const summaryByType = useMemo(() => {
    const counts: Record<string, number> = {};
    evidence.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [evidence]);

  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Ruang Fasilitator" title="Buat Laporan">
        <ErrorBoundary>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Ringkasan Catatan</p>
              <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">Semua catatan berdasarkan tipe ({evidence.length} total)</h2>
            </div>
            {Object.entries(summaryByType).length === 0 ? (
              <EmptyState icon={FileText} title="Belum ada catatan." />
            ) : (
              <div className="space-y-3">
                {Object.entries(summaryByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-3">
                    <span className="text-sm font-medium text-[#0B2C6B]">{type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                    <span className="text-lg font-semibold text-[#0B2C6B]">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Rata-rata Kemampuan</p>
              <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">{averageScore}</h2>
            </div>
            <div className="space-y-3">
              {CAPABILITIES.map((cap) => (
                <div key={cap.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <TrendIcon trend={cap.trend} />
                      <span className="font-medium text-[#0B2C6B]">{cap.name}</span>
                    </div>
                    <span className="text-xs text-[#4A4C54]/60">{cap.evidenceCount} catatan</span>
                  </div>
                  <ProgressBar value={cap.score} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Laporan Program</p>
            <h2 className="mt-1 text-lg font-semibold text-[#0B2C6B]">Laporan tersedia</h2>
          </div>
          {activeEngagements.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#4A4C54]/50">Tidak ada program aktif untuk dilaporkan.</p>
          ) : (
            <div className="space-y-3">
              {activeEngagements.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-[#0B2C6B]/8 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0B2C6B]">{e.title}</p>
                    <p className="text-xs text-[#4A4C54]/60">{e.type} — {e.participants ?? 0} peserta</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleExport(e.id)}
                    disabled={exportingId === e.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2C6B]/15 px-3 py-1.5 text-xs font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA] disabled:opacity-50"
                  >
                    {exportingId === e.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}{" "}
                    Ekspor
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Draft AI Tersedia</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Pembuatan insight AI dipicu saat event <strong>CapabilityRecalculated</strong> terjadi.
            Setiap insight terhubung ke catatan sumber dan mencakup skor keyakinan.
            AI bertindak sebagai penerjemah, bukan sumber kebenaran.
          </p>
        </section>
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
