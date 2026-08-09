"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import Link from "next/link";
import {
  Loader2,
  Radar as RadarIcon,
  Grid3x3,
  Trophy,
  BarChart3,
  Users,
  FileText,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  UserPlus,
  UsersRound,
  Lock,
  Eye,
  Check,
  X,
  ClipboardList,
  TrendingUp,
  Activity,
  Target,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/ui";
import { generateDashboardData } from "@/modules/tbos/scoring";
import { createTeam, fetchTeams } from "@/modules/tbos/api-client";
import type { TbosDbTeam } from "@/modules/tbos/api-client";
import type { TbosDashboardData } from "@/modules/tbos/types";
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
      <AppShell role="admin" navigation="tbos" title="T-BOS Dashboard" eyebrow="Team Behavioral Observation System">
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
  const [teamRoster, setTeamRoster] = useState<TbosDbTeam[]>([]);

  // Create Team Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamBatch, setNewTeamBatch] = useState<"Batch 1" | "Batch 2">("Batch 1");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");
  const [createTeamSuccess, setCreateTeamSuccess] = useState(false);

  // Facilitator assignment state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [facilitators, setFacilitators] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { fetchDashboardRawData } = await import("@/modules/tbos/api-client");
      const [{ teams, observations }, roster] = await Promise.all([
        fetchDashboardRawData(),
        fetchTeams(),
      ]);
      const computed = generateDashboardData(teams, observations);
      setDashboardData(computed);
      setTeamRoster(roster);
    } catch {
      setError("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const openAssignmentModal = async () => {
    setAssignmentError("");
    setAssignmentSuccess(false);
    try {
      const response = await fetch("/api/users");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat fasilitator.");
      const available = (result.users as Array<{ id: string; full_name: string; email: string; role: string }>)
        .filter((user) => user.role === "facilitator");
      setFacilitators(available);
      setSelectedFacilitatorId(available[0]?.id || "");
      setSelectedTeamId(dashboardData?.teams[0]?.teamId || "");
      setShowAssignmentModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat fasilitator.");
    }
  };

  const handleAssignFacilitator = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFacilitatorId || !selectedTeamId) {
      setAssignmentError("Pilih fasilitator dan tim terlebih dahulu.");
      return;
    }
    setAssigning(true);
    setAssignmentError("");
    try {
      const response = await fetch("/api/tbos/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilitatorId: selectedFacilitatorId, teamId: selectedTeamId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menugaskan fasilitator.");
      setAssignmentSuccess(true);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Gagal menugaskan fasilitator.");
    } finally {
      setAssigning(false);
    }
  };

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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setCreateTeamError("Nama tim tidak boleh kosong.");
      return;
    }

    setCreatingTeam(true);
    setCreateTeamError("");
    const res = await createTeam({
      name: newTeamName.trim(),
      batch: newTeamBatch,
    });

    if (res.success) {
      setCreateTeamSuccess(true);
      setNewTeamName("");
      setTimeout(() => {
        setCreateTeamSuccess(false);
        setShowAddTeamModal(false);
        fetchData();
      }, 1000);
    } else {
      setCreateTeamError(res.error || "Gagal membuat tim.");
    }
    setCreatingTeam(false);
  };

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
      <div className="text-center py-20 bg-white rounded-2xl border border-black/[0.04] p-8 max-w-xl mx-auto">
        <Users className="w-12 h-12 text-[#0B2C6B]/40 mx-auto mb-4" />
        <h3 className="text-base font-bold text-[#0B2C6B] mb-2">Belum Ada Data Tim T-BOS</h3>
        <p className="text-sm text-[#4A4C54] mb-6">
          Mulai dengan menambahkan tim dan batch peserta untuk diobservasi oleh fasilitator.
        </p>
        <button
          onClick={() => setShowAddTeamModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Tim Pertama
        </button>

        {showAddTeamModal && (
          <AddTeamModal
            name={newTeamName}
            setName={setNewTeamName}
            batch={newTeamBatch}
            setBatch={setNewTeamBatch}
            loading={creatingTeam}
            error={createTeamError}
            success={createTeamSuccess}
            onSubmit={handleCreateTeam}
            onClose={() => setShowAddTeamModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action Navigation & Real-time indicator */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-[#4A4C54]">
            Auto-refresh (30s)
            {lastUpdated && (
              <span className="text-[#0B2C6B] font-semibold ml-1">
                • {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </span>
          <button
            onClick={() => {
              fetchData();
              setLastUpdated(new Date());
            }}
            title="Refresh data sekarang"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Kembali ke Home Admin
          </Link>
          <button
            onClick={() => setShowAddTeamModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2C6B] text-white text-xs font-semibold hover:bg-[#071B3D] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Tim
          </button>
          <button
            onClick={openAssignmentModal}
            className="flex min-h-11 items-center gap-1.5 rounded-lg bg-[#D9A441] px-3 py-2 text-xs font-semibold text-[#071B3D] transition-colors hover:bg-[#C89432]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tugaskan Fasilitator
          </button>
          <Link
            href="/fasilitator/tbos/observations"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] text-[#0B2C6B] bg-[#0B2C6B]/[0.04] text-xs font-semibold hover:bg-[#0B2C6B]/[0.08] transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-[#D9A441]" />
            Kelola & Kunci Observasi
          </Link>
          <Link
            href="/fasilitator/tbos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Form Observasi
          </Link>
          <Link
            href="/peserta/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] text-[#4A4C54] text-xs font-medium hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Tampilan Peserta
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Tim" value={dashboardData.teams.length} icon={<Users size={16} />} />
        <StatCard label="Total Observasi" value={summary?.totalObservations || 0} icon={<Activity size={16} />} />
        <StatCard
          label="Dimensi Terobservasi"
          value={dashboardData.batchComparisons.filter((b) => b.batch1Avg !== null || b.batch2Avg !== null).length}
          detail={`dari ${dashboardData.batchComparisons.length} dimensi`}
          icon={<Layers size={16} />}
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
          detail="dari 3 kekuatan utama"
          icon={<Target size={16} />}
        />
      </div>

      {/* Tab Navigation + Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 p-1 bg-[#0B2C6B]/[0.04] rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]"
                  : "text-[#4A4C54] hover:text-[#0B2C6B] hover:bg-white/60"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <ExportButtons data={dashboardData} />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab data={dashboardData} roster={teamRoster} />}
        {activeTab === "summary" && <TbosExecutiveSummary data={dashboardData} />}
        {activeTab === "radar" && <TbosRadarChart teams={dashboardData.teams} />}
        {activeTab === "heatmap" && <TbosHeatmap teams={dashboardData.teams} />}
        {activeTab === "ranking" && <TbosRanking teams={dashboardData.teams} />}
        {activeTab === "batch" && <TbosBatchComparison comparisons={dashboardData.batchComparisons} />}
      </div>

      {/* Tambah Tim Modal */}
      {showAddTeamModal && (
        <AddTeamModal
          name={newTeamName}
          setName={setNewTeamName}
          batch={newTeamBatch}
          setBatch={setNewTeamBatch}
          loading={creatingTeam}
          error={createTeamError}
          success={createTeamSuccess}
          onSubmit={handleCreateTeam}
          onClose={() => setShowAddTeamModal(false)}
        />
      )}
      {showAssignmentModal && (
        <AssignmentModal
          facilitators={facilitators}
          teams={dashboardData.teams.map((team) => ({ id: team.teamId, name: team.teamName, batch: team.batch }))}
          facilitatorId={selectedFacilitatorId}
          teamId={selectedTeamId}
          setFacilitatorId={setSelectedFacilitatorId}
          setTeamId={setSelectedTeamId}
          loading={assigning}
          error={assignmentError}
          success={assignmentSuccess}
          onSubmit={handleAssignFacilitator}
          onClose={() => setShowAssignmentModal(false)}
        />
      )}
    </div>
  );
}

function AssignmentModal({
  facilitators,
  teams,
  facilitatorId,
  teamId,
  setFacilitatorId,
  setTeamId,
  loading,
  error,
  success,
  onSubmit,
  onClose,
}: {
  facilitators: Array<{ id: string; full_name: string; email: string }>;
  teams: Array<{ id: string; name: string; batch: string }>;
  facilitatorId: string;
  teamId: string;
  setFacilitatorId: (value: string) => void;
  setTeamId: (value: string) => void;
  loading: boolean;
  error: string;
  success: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-[#0B2C6B]" />
            <h2 id="assignment-title" className="font-bold text-[#0B2C6B]">Tugaskan Fasilitator</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup penugasan" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          {success && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700" role="status">Fasilitator berhasil ditugaskan.</p>}
          {facilitators.length === 0 ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Belum ada akun dengan role fasilitator.</p>
          ) : (
            <div>
              <label htmlFor="tbos-facilitator" className="mb-1.5 block text-xs font-semibold text-[#0B2C6B]">Fasilitator</label>
              <select id="tbos-facilitator" value={facilitatorId} onChange={(event) => setFacilitatorId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
                {facilitators.map((facilitator) => <option key={facilitator.id} value={facilitator.id}>{facilitator.full_name || facilitator.email}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="tbos-team" className="mb-1.5 block text-xs font-semibold text-[#0B2C6B]">Tim</label>
            <select id="tbos-team" value={teamId} onChange={(event) => setTeamId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm">
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name} ({team.batch})</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold">Batal</button>
            <button type="submit" disabled={loading || success || facilitators.length === 0} className="min-h-11 flex-1 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Menyimpan..." : "Simpan Penugasan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTeamModal({
  name,
  setName,
  batch,
  setBatch,
  loading,
  error,
  success,
  onSubmit,
  onClose,
}: {
  name: string;
  setName: (v: string) => void;
  batch: "Batch 1" | "Batch 2";
  setBatch: (v: "Batch 1" | "Batch 2") => void;
  loading: boolean;
  error: string;
  success: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0B2C6B]" />
            <h3 className="text-base font-bold text-[#0B2C6B]">Tambah Tim Baru</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/[0.04] text-[#4A4C54]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Tim berhasil ditambahkan!
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Nama Tim
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Team Alpha, Bravo 1"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Batch Program
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Batch 1", "Batch 2"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBatch(b)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                    batch === b
                      ? "bg-[#0B2C6B] text-white border-[#0B2C6B]"
                      : "bg-white text-[#4A4C54] border-black/10 hover:border-[#0B2C6B]/30"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-semibold text-[#4A4C54] hover:bg-black/[0.02] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Tim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExportButtons({ data }: { data: TbosDashboardData }) {
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

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
      setToast({ type: "success", message: "PDF report berhasil diunduh." });
    } catch (err) {
      console.error("[T-BOS] PDF export failed:", err);
      setToast({ type: "error", message: "Gagal mengekspor PDF. Coba lagi." });
    } finally {
      setExporting(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      const { fetchDashboardRawData } = await import("@/modules/tbos/api-client");
      const { observations } = await fetchDashboardRawData();

      const headers = ["ID", "Team", "Batch", "Mission", "Facilitator", "Observed Date", "Status", "Notes"];
      const rows = observations.map((o) => [
        o.id,
        `"${o.teamName}"`,
        `"${o.batch}"`,
        `"${o.missionName}"`,
        `"${o.facilitatorName}"`,
        o.observedAt,
        o.status,
        `"${(o.notes || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TBOS_Observations_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: "CSV data berhasil diunduh." });
    } catch (err) {
      console.error("[T-BOS] CSV export failed:", err);
      setToast({ type: "error", message: "Gagal mengekspor CSV. Coba lagi." });
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleExportPdf}
          disabled={exporting !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B2C6B] text-white text-xs font-semibold hover:bg-[#071B3D] transition-all duration-200 disabled:opacity-40 shadow-sm hover:shadow-md"
        >
          {exporting === "pdf" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          PDF Report
        </button>
        <button
          onClick={handleExportCsv}
          disabled={exporting !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] text-[#4A4C54] text-xs font-semibold hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] transition-all duration-200 disabled:opacity-40 hover:shadow-sm"
        >
          {exporting === "csv" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          CSV Data
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </>
  );
}

function ScoreBar({ score, max = 5 }: { score: number | null; max?: number }) {
  const pct = score !== null ? Math.min((score / max) * 100, 100) : 0;
  const color = score === null ? "bg-gray-200" : score >= 4.5 ? "bg-emerald-500" : score >= 3.5 ? "bg-lime-500" : score >= 2.5 ? "bg-amber-400" : score >= 1.5 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-black/[0.04] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-[#0B2C6B] w-8 text-right tabular-nums">{score !== null ? score.toFixed(1) : "—"}</span>
    </div>
  );
}

function OverviewTab({ data, roster }: { data: TbosDashboardData; roster: TbosDbTeam[] }) {
  const { executiveSummary: summary } = data;
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const rosterById = new Map(roster.map((team) => [team.id, team]));

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Strengths */}
        <div className="bg-white rounded-xl p-5 border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">3 Kekuatan Utama</h3>
              <p className="text-[10px] text-[#4A4C54]/60">Dimensi perilaku terbaik</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {summary.topStrengths.length === 0 && (
              <p className="text-xs text-[#4A4C54] italic">Belum ada data.</p>
            )}
            {summary.topStrengths.map((dim, i) => (
              <div key={dim.dimensionCode} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#0B2C6B]">{dim.dimensionName}</span>
                </div>
                <div className="ml-[30px]">
                  <ScoreBar score={dim.score} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Development Areas */}
        <div className="bg-white rounded-xl p-5 border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">3 Area Pengembangan</h3>
              <p className="text-[10px] text-[#4A4C54]/60">Prioritas pengembangan</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {summary.developmentAreas.length === 0 && (
              <p className="text-xs text-[#4A4C54] italic">Belum ada data.</p>
            )}
            {summary.developmentAreas.map((dim, i) => (
              <div key={dim.dimensionCode} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#0B2C6B]">{dim.dimensionName}</span>
                </div>
                <div className="ml-[30px]">
                  <ScoreBar score={dim.score} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Team Overview */}
      <div className="bg-white rounded-xl border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04]">
          <h3 className="text-sm font-bold text-[#0B2C6B]">Ringkasan Tim</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2C6B]/[0.03]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Tim</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Batch</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Skor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Kekuatan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Area Dev.</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Obs.</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Roster</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team, idx) => {
                const isExpanded = expandedTeamId === team.teamId;
                const rosterTeam = rosterById.get(team.teamId);
                const members = rosterTeam?.members || [];
                return (
                  <Fragment key={team.teamId}>
                    <tr className={`border-b border-black/[0.03] hover:bg-[#0B2C6B]/[0.02] transition-colors ${idx % 2 === 1 ? "bg-[#F8F9FC]" : ""}`}>
                      <td className="py-3 px-4 font-semibold text-[#0B2C6B]">{team.teamName}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/70">{team.batch}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-lg text-sm font-bold ${
                          team.overallTeamScore !== null && team.overallTeamScore >= 4.0
                            ? "bg-emerald-50 text-emerald-700"
                            : team.overallTeamScore !== null && team.overallTeamScore >= 3.0
                            ? "bg-blue-50 text-blue-700"
                            : team.overallTeamScore !== null
                            ? "bg-amber-50 text-amber-700"
                            : "text-gray-400"
                        }`}>
                          {team.overallTeamScore !== null ? team.overallTeamScore.toFixed(1) : "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4A4C54]">
                        {team.strongestDimension ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {team.strongestDimension.dimensionName}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4A4C54]">
                        {team.weakestDimension ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {team.weakestDimension.dimensionName}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-[#0B2C6B]">{team.totalObservations}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedTeamId(isExpanded ? null : team.teamId)}
                          aria-expanded={isExpanded}
                          aria-label={`Lihat roster ${team.teamName}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isExpanded
                              ? "bg-[#0B2C6B] text-white"
                              : "bg-[#0B2C6B]/[0.06] text-[#0B2C6B] hover:bg-[#0B2C6B]/[0.1]"
                          }`}
                        >
                          <UsersRound className="w-3.5 h-3.5" />
                          Lihat Tim
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#F8F9FC] border-b border-black/[0.03]">
                        <td colSpan={7} className="py-4 px-4 sm:px-6">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#0B2C6B]">
                            Roster & Kapten
                          </p>
                          {members.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-400 italic">Roster belum diisi.</p>
                          ) : (
                            <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Anggota ${team.teamName}`}>
                              {members.map((member) => (
                                <li key={member.id} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-black/[0.06] px-3 py-1.5 text-xs text-slate-700">
                                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${member.is_captain ? "bg-[#D9A441]/15 text-[#D9A441]" : "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]"}`}>
                                    {member.is_captain ? "C" : member.member_name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                  {member.member_name}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
