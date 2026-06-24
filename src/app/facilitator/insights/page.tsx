"use client";

import { useState } from "react";
import { Lightbulb, AlertTriangle, TrendingUp, RefreshCw, Sparkles, Loader2, Filter, Shield } from "lucide-react";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { AppShell } from "@/components/app-shell";
import { useInsights, useEngagements, generateInsight } from "@/hooks/use-transformation-data";
import { EmptyState, FilterTabs } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const TYPE_FILTERS = [
  { key: "Semua", label: "Semua" },
  { key: "risk", label: "Risiko" },
  { key: "improvement", label: "Perbaikan" },
  { key: "recommendation", label: "Rekomendasi" },
];

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  risk: AlertTriangle,
  improvement: TrendingUp,
  recommendation: Lightbulb,
};

const TYPE_COLORS: Record<string, string> = {
  risk: "border-red-200 bg-red-50",
  improvement: "border-emerald-200 bg-emerald-50",
  recommendation: "border-amber-200 bg-amber-50",
};

function InsightsContent() {
  const { insights, loading, error, refetch } = useInsights();
  const { engagements } = useEngagements();
  const [typeFilter, setTypeFilter] = useState("Semua");
  const [generating, setGenerating] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState("");

  const filteredInsights = insights.filter((i) =>
    typeFilter === "Semua" || i.type === typeFilter
  );

  const typeCounts = {
    risk: insights.filter((i) => i.type === "risk").length,
    improvement: insights.filter((i) => i.type === "improvement").length,
    recommendation: insights.filter((i) => i.type === "recommendation").length,
  };

  const handleGenerate = async () => {
    if (!selectedEngagement) {
      toast.error("Pilih program terlebih dahulu.");
      return;
    }
    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Sesi tidak valid.");
        setGenerating(false);
        return;
      }

      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ engagement_id: selectedEngagement }),
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Insight berhasil dihasilkan.");
        void refetch();
      } else {
        toast.error(json.error || "Gagal menghasilkan insight.");
      }
    } catch {
      toast.error("Gagal menghasilkan insight.");
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat insight...</div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
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
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">BinaInsight AI</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Insight & Rekomendasi</h1>
          <p className="mt-1 text-sm text-[#4A4C54]/60">{insights.length} insight tercatat</p>
        </div>
        <button
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]"
        >
          <RefreshCw size={14} /> Muat Ulang
        </button>
      </div>

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold text-[#4A4C54]/50">Hasilkan Insight Baru</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[200px]">
            <span className="text-xs font-semibold text-[#0B2C6B]/60">Pilih Program</span>
            <select
              value={selectedEngagement}
              onChange={(e) => setSelectedEngagement(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]"
            >
              <option value="">Pilih program...</option>
              {engagements.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => void handleGenerate()}
            disabled={generating || !selectedEngagement}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-5 py-2.5 text-sm font-semibold text-[#071B3D] hover:bg-[#c49235] disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? "Menghasilkan..." : "Hasilkan Insight"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <AlertTriangle size={18} className="mx-auto text-red-500" />
          <p className="mt-2 text-2xl font-bold text-red-700">{typeCounts.risk}</p>
          <p className="text-xs text-red-600/70">Risiko</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <TrendingUp size={18} className="mx-auto text-emerald-500" />
          <p className="mt-2 text-2xl font-bold text-emerald-700">{typeCounts.improvement}</p>
          <p className="text-xs text-emerald-600/70">Perbaikan</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <Lightbulb size={18} className="mx-auto text-amber-500" />
          <p className="mt-2 text-2xl font-bold text-amber-700">{typeCounts.recommendation}</p>
          <p className="text-xs text-amber-600/70">Rekomendasi</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={14} className="text-[#4A4C54]/50" />
          <span className="text-xs font-semibold text-[#4A4C54]/50">Filter Tipe</span>
        </div>
        <FilterTabs tabs={TYPE_FILTERS} active={typeFilter} onChange={setTypeFilter} />
      </div>

      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="Belum ada insight"
            description={
              typeFilter === "Semua"
                ? "Hasilkan insight pertama dari program yang dipilih."
                : `Tidak ada insight tipe "${typeFilter}".`
            }
          />
        ) : (
          filteredInsights.map((insight) => {
            const Icon = TYPE_ICONS[insight.type] || Lightbulb;
            const colorClass = TYPE_COLORS[insight.type] || "border-[#0B2C6B]/10 bg-white";
            return (
              <div
                key={insight.id}
                className={`rounded-xl border p-5 shadow-sm ${colorClass}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-[#0B2C6B]">{insight.title}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#0B2C6B]/10 px-2 py-0.5 text-[10px] font-bold text-[#0B2C6B]">
                        <Shield size={10} />
                        {Math.round(insight.confidence_score * 100)}% keyakinan
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#4A4C54]/70">{insight.summary}</p>
                    {insight.evidence_links && insight.evidence_links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {insight.evidence_links.map((link, i) => (
                          <span key={i} className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">
                            #{String(link).slice(0, 8)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-[#4A4C54]/40">
                      {new Date(insight.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border border-[#0B2C6B]/10 bg-[#071B3D] p-5 text-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Tentang BinaInsight AI</p>
        <p className="mt-2 text-sm leading-6 text-white/70">
          BinaInsight AI bertindak sebagai <strong>penerjemah</strong>, bukan sumber kebenaran.
          Setiap insight dihasilkan berdasarkan catatan (evidence) yang terkumpul, dengan skor keyakinan
          yang menunjukkan seberapa andal rekomendasi tersebut. Insight selalu dilampirkan dengan
          tautan ke catatan sumber untuk verifikasi.
        </p>
      </div>
    </div>
  );
}

export default function FacilitatorInsightsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="BinaInsight AI" title="Insight & Rekomendasi">
        <ErrorBoundary>
          <InsightsContent />
        </ErrorBoundary>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
