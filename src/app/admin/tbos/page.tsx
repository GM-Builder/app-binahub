"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Radar as RadarIcon, Grid3x3, Trophy, BarChart3, Users, FileText, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { generateDashboardData } from "@/modules/tbos/scoring";
import type { TbosObservation, TbosDashboardData } from "@/modules/tbos/types";
import { TbosRadarChart } from "./_components/radar-chart";
import { TbosHeatmap } from "./_components/heatmap";
import { TbosRanking } from "./_components/ranking";
import { TbosBatchComparison } from "./_components/batch-comparison";
import { TbosExecutiveSummary } from "./_components/executive-summary";

type Tab = "overview" | "summary" | "radar" | "heatmap" | "ranking" | "batch";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
  { key: "summary", label: "Executive Summary", icon: <FileText size={16} /> },
  { key: "radar", label: "Radar Chart", icon: <RadarIcon size={16} /> },
  { key: "heatmap", label: "Heatmap", icon: <Grid3x3 size={16} /> },
  { key: "ranking", label: "Ranking", icon: <Trophy size={16} /> },
  { key: "batch", label: "Batch", icon: <Users size={16} /> },
];

export default function TbosDashboardPage() {
  return (
    <AdminAuthGate>
      <AppShell role="admin" title="T-BOS Dashboard" eyebrow="Team Behavioral Observation System">
        <TbosDashboardContent />
      </AppShell>
    </AdminAuthGate>
  );
}

function TbosDashboardContent() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboardData, setDashboardData] = useState<TbosDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/tbos/dashboard");
      const data = await res.json();

      if (data.success) {
        const observations: TbosObservation[] = data.observations.map((obs: any) => ({
          id: obs.id,
          teamId: obs.teamId,
          teamName: obs.teamName,
          missionId: obs.missionId,
          missionCode: obs.missionCode,
          missionName: obs.missionName,
          profileId: obs.profileId,
          facilitatorName: obs.facilitatorName,
          batch: obs.batch,
          observedAt: obs.observedAt,
          submittedAt: obs.submittedAt,
          status: obs.status,
          notes: obs.notes,
          scores: obs.scores.map((s: any) => ({
            dimensionCode: s.dimensionCode,
            dimensionName: s.dimensionName,
            levelValue: s.levelValue,
            levelLabel: s.levelLabel,
          })),
        }));

        const teams = data.teams.map((t: any) => ({
          id: t.id,
          name: t.name,
          batch: t.batch,
        }));

        const computed = generateDashboardData(teams, observations);
        setDashboardData(computed);
      } else {
        setError(data.error || "Gagal memuat data dashboard.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds for near real-time updates
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      fetchData();
      setLastUpdated(new Date());
    }, 30000);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchData]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [dashboardData]);

  const summary = dashboardData?.executiveSummary;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B2C6B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!dashboardData || dashboardData.teams.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#4A4C54]">Belum ada data observasi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-[#4A4C54]">
            Auto-refresh 30s
            {lastUpdated && (
              <> • Update: {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</>
            )}
          </span>
        </div>
        <button
          onClick={() => { fetchData(); setLastUpdated(new Date()); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Tim" value={String(dashboardData.teams.length)} />
        <StatCard label="Total Observasi" value={String(summary?.totalObservations || 0)} />
        <StatCard
          label="Dimensi Terobservasi"
          value={String(
            dashboardData.batchComparisons.filter((b) => b.batch1Avg !== null || b.batch2Avg !== null).length
          )}
        />
        <StatCard
          label="Rata-rata Skor"
          value={
            summary?.topStrengths.length
              ? (
                  summary.topStrengths.reduce((a, b) => a + (b.score || 0), 0) /
                  summary.topStrengths.length
                ).toFixed(1)
              : "-"
          }
        />
      </div>

      {/* Tab Navigation + Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 border-b border-black/[0.06] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#0B2C6B] text-[#0B2C6B]"
                  : "border-transparent text-[#4A4C54] hover:text-[#0B2C6B]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <ExportButtons data={dashboardData} />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab data={dashboardData} />}
        {activeTab === "summary" && <TbosExecutiveSummary data={dashboardData} />}
        {activeTab === "radar" && <TbosRadarChart teams={dashboardData.teams} />}
        {activeTab === "heatmap" && <TbosHeatmap teams={dashboardData.teams} />}
        {activeTab === "ranking" && <TbosRanking teams={dashboardData.teams} />}
        {activeTab === "batch" && <TbosBatchComparison comparisons={dashboardData.batchComparisons} />}
      </div>
    </div>
  );
}

function ExportButtons({ data }: { data: TbosDashboardData }) {
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      const { renderToBuffer } = await import("@react-pdf/renderer");
      const { TbosReportDocument } = await import("./_components/pdf-report");
      const buffer = await renderToBuffer(<TbosReportDocument data={data} />);
      const blob = new Blob([buffer as unknown as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TBOS_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[T-BOS] PDF export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      const res = await fetch("/api/tbos/export?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TBOS_Observations_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[T-BOS] CSV export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={handleExportPdf}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B2C6B] text-white text-xs font-medium hover:bg-[#071B3D] transition-colors disabled:opacity-40"
      >
        {exporting === "pdf" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        PDF
      </button>
      <button
        onClick={handleExportCsv}
        disabled={exporting !== null}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-colors disabled:opacity-40"
      >
        {exporting === "csv" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5" />
        )}
        CSV
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
      <p className="text-xs text-[#4A4C54] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#0B2C6B]">{value}</p>
    </div>
  );
}

function OverviewTab({ data }: { data: TbosDashboardData }) {
  const { executiveSummary: summary } = data;

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Strengths */}
        <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-[#0B2C6B]">3 Kekuatan Utama</h3>
          </div>
          <div className="space-y-2">
            {summary.topStrengths.length === 0 && (
              <p className="text-xs text-[#4A4C54]">Belum ada data.</p>
            )}
            {summary.topStrengths.map((dim, i) => (
              <div key={dim.dimensionCode} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-[#4A4C54]">{dim.dimensionName}</span>
                <span className="text-sm font-bold text-[#0B2C6B]">{dim.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Development Areas */}
        <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-[#0B2C6B]">3 Area Pengembangan</h3>
          </div>
          <div className="space-y-2">
            {summary.developmentAreas.length === 0 && (
              <p className="text-xs text-[#4A4C54]">Belum ada data.</p>
            )}
            {summary.developmentAreas.map((dim, i) => (
              <div key={dim.dimensionCode} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-[#4A4C54]">{dim.dimensionName}</span>
                <span className="text-sm font-bold text-[#0B2C6B]">{dim.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Team Overview */}
      <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
        <h3 className="text-sm font-semibold text-[#0B2C6B] mb-4">Ringkasan Tim</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Tim</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Batch</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Skor</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Kekuatan</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Area Dev.</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-[#4A4C54] uppercase">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team) => (
                <tr key={team.teamId} className="border-b border-black/[0.03] hover:bg-black/[0.01]">
                  <td className="py-2.5 px-3 font-medium text-[#0B2C6B]">{team.teamName}</td>
                  <td className="py-2.5 px-3 text-[#4A4C54]">{team.batch}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[#0B2C6B]">
                      {team.overallTeamScore !== null ? team.overallTeamScore.toFixed(1) : "-"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#4A4C54]">
                    {team.strongestDimension?.dimensionName || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#4A4C54]">
                    {team.weakestDimension?.dimensionName || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center text-[#4A4C54]">{team.totalObservations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
