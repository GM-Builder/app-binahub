"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Target, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useCapabilities, useEngagements } from "@/hooks/use-transformation-data";
import type { ParticipantCapability } from "@/lib/transformation-types";
import { ProgressBar, TrendIcon, EmptyState } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";

const CAPABILITY_COLORS = ["#0B2C6B", "#D9A441", "#10b981", "#6366f1", "#f59e0b"];

function RadarVisualization({ capabilities }: { capabilities: ParticipantCapability[] }) {
  const data = capabilities.map((cap) => ({
    capability: cap.capability?.name || "Unknown",
    score: cap.score,
    fullMark: 100,
  }));

  if (data.length < 3) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-[#4A4C54]/50">
        Perlu minimal 3 kemampuan untuk grafik radar.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#E6EAF0" />
        <PolarAngleAxis dataKey="capability" tick={{ fill: "#0B2C6B", fontSize: 12, fontWeight: 600 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#4A4C54", fontSize: 10 }} />
        <Radar name="Score" dataKey="score" stroke="#0B2C6B" fill="#0B2C6B" fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function BarVisualization({ capabilities }: { capabilities: ParticipantCapability[] }) {
  const data = capabilities.map((cap) => ({
    name: cap.capability?.name || "Unknown",
    score: cap.score,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6EAF0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4A4C54", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "#0B2C6B", fontSize: 12, fontWeight: 600 }} width={120} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #E6EAF0", fontSize: 12 }}
          formatter={(value) => [`${value}`, "Skor"]}
        />
        <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_, index) => (
            <Cell key={index} fill={CAPABILITY_COLORS[index % CAPABILITY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ClientCapabilityPage() {
  const { engagements } = useEngagements();
  const activeEngagement = useMemo(
    () => engagements.find((e) => e.status === "active" || e.status === "in_progress") || engagements[0] || null,
    [engagements],
  );
  const { capabilities, loading } = useCapabilities(activeEngagement?.id || null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!activeEngagement?.id) return;
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Sesi tidak valid.");
        setExporting(false);
        return;
      }

      const response = await fetch(`/api/export?engagement_id=${activeEngagement.id}&type=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        toast.error("Gagal mengunduh data.");
        setExporting(false);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kemampuan-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Berhasil mengunduh data kemampuan.");
    } catch {
      toast.error("Gagal mengunduh data.");
    }
    setExporting(false);
  };

  const averageScore = useMemo(() => {
    if (!capabilities.length) return 0;
    return Math.round(capabilities.reduce((sum, c) => sum + c.score, 0) / capabilities.length);
  }, [capabilities]);

  const totalEvidence = useMemo(
    () => capabilities.reduce((sum, c) => sum + (c.evidence_count || 0), 0),
    [capabilities],
  );

  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Sistem Kemampuan" title="Perkembangan Kemampuan">
        <ErrorBoundary>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Skor Rata-rata</p>
              <p className="mt-2 text-3xl font-semibold text-[#0B2C6B]">{averageScore || "—"}</p>
              <p className="mt-1 text-xs text-[#4A4C54]/50">Di semua kemampuan</p>
            </section>
            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Kemampuan Terlacak</p>
              <p className="mt-2 text-3xl font-semibold text-[#0B2C6B]">{capabilities.length}</p>
              <p className="mt-1 text-xs text-[#4A4C54]/50">Area kemampuan aktif</p>
            </section>
            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Catatan Berkontribusi</p>
              <p className="mt-2 text-3xl font-semibold text-[#0B2C6B]">{totalEvidence}</p>
              <p className="mt-1 text-xs text-[#4A4C54]/50">Item catatan terhubung</p>
            </section>
          </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#4A4C54]/60">Memuat kemampuan...</div>
        ) : capabilities.length === 0 ? (
          <div className="py-20 text-center">
            <Target size={40} className="mx-auto text-[#0B2C6B]/20" />
            <p className="mt-4 text-sm text-[#4A4C54]/60">Belum ada data kemampuan. Kirim refleksi dan catatan untuk mulai membangun profil kemampuan Anda.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Radar Kemampuan</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Profil Perkembangan Anda</h2>
              </div>
              <RadarVisualization capabilities={capabilities} />
            </section>

            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Rincian Skor</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Perbandingan kemampuan</h2>
              </div>
              <BarVisualization capabilities={capabilities} />
            </section>

            <section className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6 lg:col-span-2">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Rincian Catatan</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">Yang mendorong kemampuan Anda</h2>
              </div>
              <div className="space-y-4">
                {capabilities.map((cap, idx) => (
                  <div key={cap.id} className="rounded-lg border border-[#0B2C6B]/8 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CAPABILITY_COLORS[idx % CAPABILITY_COLORS.length] }} />
                        <h3 className="text-base font-semibold text-[#0B2C6B]">{cap.capability?.name || "Unknown"}</h3>
                        <TrendIcon trend={cap.trend} size={12} />
                      </div>
                      <span className="text-lg font-semibold text-[#0B2C6B]">{cap.score}</span>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={cap.score} color={CAPABILITY_COLORS[idx % CAPABILITY_COLORS.length]} />
                    </div>
                    {cap.evidence && cap.evidence.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cap.evidence.slice(0, 5).map((link) => (
                          <span key={link.id} className="inline-flex items-center gap-1 rounded-full bg-[#F5F7FA] px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">
                            <FileText size={10} />
                            {link.evidence?.type?.replace(/_/g, " ") || "catatan"}
                            <span className="text-[#4A4C54]/50">w:{link.weight}</span>
                          </span>
                        ))}
                        {cap.evidence.length > 5 && (
                          <span className="text-[10px] text-[#4A4C54]/50">+{cap.evidence.length - 5} lainnya</span>
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-[#4A4C54]/50">{cap.evidence_count} item catatan berkontribusi</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <section className="mt-6 rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Bagaimana Kemampuan Dihitung</p>
            <button
              onClick={() => void handleExport()}
              disabled={exporting || !activeEngagement}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
            >
              {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Ekspor Data
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Skor kemampuan <strong>berasal dari catatan</strong>, tidak pernah diinput manual. Setiap tipe catatan memiliki bobot:
            Penilaian (1.0), Pengamatan (0.85), Umpan Balik (0.8), Penyelesaian Tindakan (0.75), Catatan Pembinaan (0.7),
            Survei (0.65), Refleksi (0.55). Sistem mengalikan skor keyakinan dengan bobot, lalu merata-rata
            semua catatan terkait untuk setiap kemampuan.
          </p>
        </section>
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
