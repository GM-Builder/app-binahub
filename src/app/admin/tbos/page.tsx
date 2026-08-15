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
  Pencil,
  Trash2,
  Building2,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/ui";
import { useEngagements } from "@/hooks/use-transformation-data";
import { generateDashboardData } from "@/modules/tbos/scoring";
import { createTeam } from "@/modules/tbos/api-client";
import type { TbosDbTeam } from "@/modules/tbos/api-client";
import type { TbosDashboardData, TbosObservation } from "@/modules/tbos/types";
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
  const [observations, setObservations] = useState<TbosObservation[]>([]);
  const { engagements } = useEngagements();
  const activePrograms = engagements.filter((program) => ["active", "in_progress", "review"].includes(program.status));
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [newProgramCode, setNewProgramCode] = useState("");
  const [newProgramTitle, setNewProgramTitle] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creatingProgram, setCreatingProgram] = useState(false);
  const [programError, setProgramError] = useState("");

  // Create Team Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamBatchId, setNewTeamBatchId] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");
  const [createTeamSuccess, setCreateTeamSuccess] = useState(false);

  // Batch management state
  const [batches, setBatches] = useState<Array<{ id: string; name: string; sort_order: number }>>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchError, setBatchError] = useState("");

  // Facilitator assignment state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [facilitators, setFacilitators] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [missions, setMissions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedProgramId) {
      setDashboardData(null);
      setTeamRoster([]);
      setObservations([]);
      setBatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { fetchDashboardRawData, fetchTeams, fetchBatches } = await import("@/modules/tbos/api-client");
      const [{ teams, observations }, roster] = await Promise.all([
        fetchDashboardRawData(selectedProgramId),
        fetchTeams(selectedProgramId),
      ]);
      const computed = generateDashboardData(teams, observations);
      setDashboardData(computed);
      setTeamRoster(roster);
      setObservations(observations);

      if (selectedProgramId) {
        const batchList = await fetchBatches(selectedProgramId);
        setBatches(batchList);
      }
    } catch {
      setError("Gagal memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  useEffect(() => {
    if (!selectedProgramId && activePrograms[0]?.id) {
      void Promise.resolve().then(() => setSelectedProgramId(activePrograms[0].id));
    }
  }, [activePrograms, selectedProgramId]);

  const openAssignmentModal = async () => {
    setAssignmentError("");
    setAssignmentSuccess(false);
    setSelectedMissionIds([]);
    try {
      const [usersRes, missionsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/tbos/missions"),
      ]);
      const usersResult = await usersRes.json();
      const missionsResult = await missionsRes.json();

      if (!usersRes.ok || !usersResult.success) throw new Error(usersResult.error || "Gagal memuat fasilitator.");
      if (!missionsRes.ok || !missionsResult.success) throw new Error(missionsResult.error || "Gagal memuat misi.");

      const available = (usersResult.users as Array<{ id: string; full_name: string; email: string; role: string }>)
        .filter((user) => user.role === "facilitator");
      setFacilitators(available);
      setSelectedFacilitatorId(available[0]?.id || "");

      const missionList = ((missionsResult.missions || []) as Array<{ id: string; code: string; name: string }>)
        .map((mission) => ({ id: mission.id, code: mission.code, name: mission.name }));
      setMissions(missionList);

      // Pre-select missions already assigned to the first facilitator
      if (available[0]?.id && selectedProgramId) {
        const { fetchFacilitatorMissions } = await import("@/modules/tbos/api-client");
        const existing = await fetchFacilitatorMissions(selectedProgramId, available[0].id);
        setSelectedMissionIds(existing.map((e) => e.missionId));
      }

      setShowAssignmentModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data penugasan.");
    }
  };

  const handleAssignFacilitator = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFacilitatorId || !selectedProgramId) {
      setAssignmentError("Pilih fasilitator terlebih dahulu.");
      return;
    }
    setAssigning(true);
    setAssignmentError("");
    try {
      const { bulkAssignFacilitatorToMissions } = await import("@/modules/tbos/api-client");
      const result = await bulkAssignFacilitatorToMissions({
        facilitatorId: selectedFacilitatorId,
        programId: selectedProgramId,
        missionIds: selectedMissionIds,
      });
      if (!result.success) throw new Error(result.error || "Gagal menugaskan fasilitator.");
      setAssignmentSuccess(true);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Gagal menugaskan fasilitator.");
    } finally {
      setAssigning(false);
    }
  };

  const handleFacilitatorSelection = async (facilitatorId: string) => {
    setSelectedFacilitatorId(facilitatorId);
    setSelectedMissionIds([]);
    setAssignmentError("");
    setAssignmentSuccess(false);
    if (!facilitatorId || !selectedProgramId) return;
    try {
      const { fetchFacilitatorMissions } = await import("@/modules/tbos/api-client");
      const existing = await fetchFacilitatorMissions(selectedProgramId, facilitatorId);
      setSelectedMissionIds(existing.map((assignment) => assignment.missionId));
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Gagal memuat penugasan fasilitator.");
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
    if (!selectedProgramId) {
      setCreateTeamError("Pilih program aktif terlebih dahulu.");
      return;
    }
    if (!newTeamName.trim()) {
      setCreateTeamError("Nama tim tidak boleh kosong.");
      return;
    }
    if (!newTeamBatchId) {
      setCreateTeamError("Pilih batch terlebih dahulu.");
      return;
    }

    setCreatingTeam(true);
    setCreateTeamError("");
    const res = await createTeam({
      name: newTeamName.trim(),
      batchId: newTeamBatchId,
      programId: selectedProgramId,
    });

    if (res.success) {
      setCreateTeamSuccess(true);
      setNewTeamName("");
      setNewTeamBatchId("");
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

  const handleCreateProgram = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProgramCode.trim() || !newProgramTitle.trim() || !newCompanyName.trim()) {
      setProgramError("Kode, nama program, dan perusahaan wajib diisi.");
      return;
    }
    setCreatingProgram(true);
    setProgramError("");
    try {
      const organizationResponse = await fetch("/api/organizations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCompanyName.trim() }) });
      const organizationResult = await organizationResponse.json().catch(() => ({}));
      if (!organizationResponse.ok || !organizationResult.success) throw new Error(organizationResult.error || "Gagal menyimpan perusahaan.");
      const response = await fetch("/api/engagements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId: organizationResult.organization.id, code: newProgramCode.trim().toUpperCase(), title: newProgramTitle.trim(), type: "assessment", status: "active", modules: [{ moduleKey: "tbos", enabled: true }, { moduleKey: "lep", enabled: false }] }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal membuat program.");
      setShowProgramModal(false);
      setNewProgramCode(""); setNewProgramTitle(""); setNewCompanyName("");
      setSelectedProgramId(result.engagement.id);
      window.location.reload();
    } catch (error) {
      setProgramError(error instanceof Error ? error.message : "Gagal membuat program.");
    } finally {
      setCreatingProgram(false);
    }
  };

  const handleCreateBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBatchName.trim() || !selectedProgramId) return;
    setCreatingBatch(true);
    setBatchError("");
    try {
      const { createBatch } = await import("@/modules/tbos/api-client");
      const result = await createBatch({ programId: selectedProgramId, name: newBatchName.trim() });
      if (result.success) {
        setNewBatchName("");
        setShowBatchModal(false);
        fetchData();
      } else {
        setBatchError(result.error || "Gagal membuat batch.");
      }
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Gagal membuat batch.");
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, name: string) => {
    if (!window.confirm(`Hapus batch "${name}"? Batch yang masih digunakan oleh tim tidak dapat dihapus.`)) return;
    try {
      const { deleteBatch } = await import("@/modules/tbos/api-client");
      const result = await deleteBatch(batchId);
      if (!result.success) {
        window.alert(result.error || "Batch tidak dapat dihapus.");
      } else {
        fetchData();
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Gagal menghapus batch.");
    }
  };

  const handleEditTeam = async (teamId: string, currentName: string) => {
    const name = window.prompt("Nama tim", currentName);
    if (!name?.trim()) return;
    const response = await fetch(`/api/tbos/teams/${teamId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) window.alert(result.error || "Gagal mengubah tim.");
    else await fetchData();
  };

  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (!window.confirm(`Hapus tim ${name}? Tim dengan histori observasi tidak dapat dihapus.`)) return;
    const response = await fetch(`/api/tbos/teams/${teamId}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) window.alert(result.error || "Tim tidak dapat dihapus.");
    else await fetchData();
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

  const programSelector = (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Program Aktif</p>
        <p className="mt-1 text-sm text-[#4A4C54]/70">Pilih program untuk melihat tim dan observasinya.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
      {activePrograms.length > 0 ? (
        <select
          value={selectedProgramId}
          onChange={(event) => setSelectedProgramId(event.target.value)}
          className="h-10 min-w-64 rounded-lg border border-[#0B2C6B]/15 bg-[#FAFAF8] px-3 text-sm font-semibold text-[#0B2C6B] outline-none focus:border-[#D9A441]"
          aria-label="Pilih program aktif"
        >
          {activePrograms.map((program) => (
            <option key={program.id} value={program.id}>{program.title}</option>
          ))}
        </select>
      ) : null}
      <button type="button" onClick={() => setShowProgramModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#071B3D]"><Plus className="h-3.5 w-3.5" /> Buat Program</button>
      </div>
    </div>
  );

  if (!dashboardData || dashboardData.teams.length === 0) {
    return (
      <div>
        {programSelector}
        <div className="text-center py-20 bg-white rounded-2xl border border-black/[0.04] p-8 max-w-xl mx-auto">
        <Users className="w-12 h-12 text-[#0B2C6B]/40 mx-auto mb-4" />
        <h3 className="text-base font-bold text-[#0B2C6B] mb-2">Belum Ada Data Tim T-BOS</h3>
        <p className="text-sm text-[#4A4C54] mb-6">
          Mulai dengan menambahkan tim dan batch peserta untuk diobservasi oleh fasilitator.
        </p>
        <form onSubmit={handleCreateBatch} className="mx-auto mb-5 flex max-w-md gap-2 text-left">
          <label className="sr-only" htmlFor="first-batch-name">Nama batch pertama</label>
          <input
            id="first-batch-name"
            value={newBatchName}
            onChange={(event) => setNewBatchName(event.target.value)}
            placeholder="Nama batch, mis. Gelombang Agustus"
            maxLength={50}
            className="min-h-11 flex-1 rounded-xl border border-[#0B2C6B]/15 px-3 text-sm outline-none focus:border-[#D9A441]"
          />
          <button type="submit" disabled={creatingBatch || !newBatchName.trim()} className="min-h-11 rounded-xl bg-[#D9A441] px-4 text-sm font-bold text-[#071B3D] disabled:opacity-50">
            {creatingBatch ? "Menyimpan…" : "+ Tambah Batch"}
          </button>
        </form>
        {batchError && <p className="mb-4 text-sm text-red-700" role="alert">{batchError}</p>}
        {batches.length > 0 && (
          <div className="mx-auto mb-5 flex max-w-md flex-wrap justify-center gap-2">
            {batches.map((batch) => (
              <span key={batch.id} className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/10 bg-[#0B2C6B]/[0.03] px-3 py-2 text-sm font-semibold text-[#0B2C6B]">
                {batch.name}
                <button type="button" onClick={() => handleDeleteBatch(batch.id, batch.name)} title={`Hapus batch ${batch.name}`} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowAddTeamModal(true)}
          disabled={batches.length === 0}
          title={batches.length === 0 ? "Buat minimal satu batch terlebih dahulu." : "Tambah tim pertama"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Tim Pertama
        </button>

        {showAddTeamModal && (
          <AddTeamModal
            name={newTeamName}
            setName={setNewTeamName}
            batchId={newTeamBatchId}
            setBatchId={setNewTeamBatchId}
            batches={batches}
            loading={creatingTeam}
            error={createTeamError}
            success={createTeamSuccess}
            onSubmit={handleCreateTeam}
            onClose={() => setShowAddTeamModal(false)}
          />
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {programSelector}

      {/* Batch Management */}
      {selectedProgramId && (
        <div className="bg-white rounded-xl border border-[#0B2C6B]/10 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Kelola Batch</p>
              <p className="mt-0.5 text-xs text-[#4A4C54]/70">Buat dan kelola batch untuk mengelompokkan tim dalam program ini.</p>
            </div>
            <button
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#071B3D]"
            >
              <Plus className="h-3.5 w-3.5" /> Buat Batch
            </button>
          </div>
          {batches.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {batches.map((b) => (
                <div key={b.id} className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/10 bg-[#0B2C6B]/[0.03] px-3 py-2 text-sm">
                  <span className="font-semibold text-[#0B2C6B]">{b.name}</span>
                  <button
                    onClick={() => handleDeleteBatch(b.id, b.name)}
                    disabled={teamRoster.some((team) => team.batchId === b.id)}
                    className="text-red-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:text-slate-300"
                    title={teamRoster.some((team) => team.batchId === b.id) ? "Batch tidak dapat dihapus karena masih memiliki tim." : `Hapus batch ${b.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#4A4C54]/50 italic">Belum ada batch untuk program ini.</p>
          )}
        </div>
      )}
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
            disabled={!selectedProgramId}
            title={selectedProgramId ? "Tambah tim ke program aktif" : "Pilih program aktif terlebih dahulu"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2C6B] text-white text-xs font-semibold hover:bg-[#071B3D] transition-colors shadow-sm disabled:opacity-40"
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
          value={dashboardData.batchComparisons.filter((b) => b.batchAverages.some((ba) => ba.avg !== null)).length}
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

        <ExportButtons programId={selectedProgramId} />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab data={dashboardData} roster={teamRoster} observations={observations} onEditTeam={handleEditTeam} onDeleteTeam={handleDeleteTeam} />}
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
          batchId={newTeamBatchId}
          setBatchId={setNewTeamBatchId}
          batches={batches}
          loading={creatingTeam}
          error={createTeamError}
          success={createTeamSuccess}
          onSubmit={handleCreateTeam}
          onClose={() => setShowAddTeamModal(false)}
        />
      )}
      {showProgramModal && <CreateProgramModal code={newProgramCode} title={newProgramTitle} company={newCompanyName} setCode={setNewProgramCode} setTitle={setNewProgramTitle} setCompany={setNewCompanyName} loading={creatingProgram} error={programError} onSubmit={handleCreateProgram} onClose={() => setShowProgramModal(false)} />}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
              <h3 className="text-base font-bold text-[#0B2C6B]">Buat Batch Baru</h3>
              <button onClick={() => { setShowBatchModal(false); setBatchError(""); setNewBatchName(""); }} className="p-1 rounded-lg hover:bg-black/[0.04] text-[#4A4C54]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              {batchError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{batchError}</div>}
              <div>
                <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">Nama Batch</label>
                <input
                  type="text"
                  required
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="Contoh: Batch 1, Angkatan 2025-A"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowBatchModal(false); setBatchError(""); setNewBatchName(""); }} className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-semibold text-[#4A4C54]">Batal</button>
                <button type="submit" disabled={creatingBatch || !newBatchName.trim()} className="flex-1 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {creatingBatch && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAssignmentModal && (
        <AssignmentModal
          facilitators={facilitators}
          missions={missions}
          facilitatorId={selectedFacilitatorId}
          missionIds={selectedMissionIds}
          setFacilitatorId={(value) => { void handleFacilitatorSelection(value); }}
          setMissionIds={setSelectedMissionIds}
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
  missions,
  facilitatorId,
  missionIds,
  setFacilitatorId,
  setMissionIds,
  loading,
  error,
  success,
  onSubmit,
  onClose,
}: {
  facilitators: Array<{ id: string; full_name: string; email: string }>;
  missions: Array<{ id: string; code: string; name: string }>;
  facilitatorId: string;
  missionIds: string[];
  setFacilitatorId: (value: string) => void;
  setMissionIds: (value: string[]) => void;
  loading: boolean;
  error: string;
  success: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const toggleMission = (missionId: string) => {
    setMissionIds(
      missionIds.includes(missionId)
        ? missionIds.filter((id) => id !== missionId)
        : [...missionIds, missionId]
    );
  };

  const selectAll = () => setMissionIds(missions.map((m) => m.id));
  const clearAll = () => setMissionIds([]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-[#0B2C6B]" />
            <h2 id="assignment-title" className="font-bold text-[#0B2C6B]">Tugaskan Fasilitator ke Misi</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup penugasan" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          {success && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700" role="status">Penugasan fasilitator berhasil disimpan.</p>}
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#0B2C6B]">Misi yang Ditugaskan</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-[10px] font-semibold text-[#0B2C6B] hover:underline">Pilih Semua</button>
                <button type="button" onClick={clearAll} className="text-[10px] font-semibold text-red-500 hover:underline">Hapus Semua</button>
              </div>
            </div>
            {missions.length === 0 ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Belum ada misi yang tersedia.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {missions.map((mission) => (
                  <label key={mission.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={missionIds.includes(mission.id)}
                      onChange={() => toggleMission(mission.id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0B2C6B] focus:ring-[#0B2C6B]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-[#0B2C6B] truncate">{mission.name}</span>
                      <span className="block text-[10px] text-[#4A4C54]/60 uppercase tracking-wide">{mission.code}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {missions.length > 0 && (
              <p className="mt-1.5 text-[10px] text-[#4A4C54]/50">{missionIds.length} dari {missions.length} misi dipilih</p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold">Batal</button>
            <button type="submit" disabled={loading || success || facilitators.length === 0 || missionIds.length === 0} className="min-h-11 flex-1 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white disabled:opacity-50">
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
  batchId,
  setBatchId,
  batches,
  loading,
  error,
  success,
  onSubmit,
  onClose,
}: {
  name: string;
  setName: (v: string) => void;
  batchId: string;
  setBatchId: (v: string) => void;
  batches: Array<{ id: string; name: string }>;
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
            {batches.length > 0 ? (
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20 bg-white"
              >
                <option value="">Pilih batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">
                Belum ada batch. Buat batch terlebih dahulu di panel &quot;Kelola Batch&quot;.
              </p>
            )}
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

function ExportButtons({ programId }: { programId: string }) {
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
      const response = await fetch(`/api/tbos/export?format=pdf&programId=${encodeURIComponent(programId)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat PDF.");
      }
      const blob = await response.blob();
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
      const { observations } = await fetchDashboardRawData(programId);

      const headers = ["ID", "Team", "Batch", "Mission", "Facilitator", "Observed Date", "Status", "Notes"];
      const csvCell = (value: string) => {
        const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
        return `"${safeValue.replace(/"/g, '""')}"`;
      };
      const rows = observations.map((o) => [
        csvCell(o.id),
        csvCell(o.teamName),
        csvCell(o.batch),
        csvCell(o.missionName),
        csvCell(o.facilitatorName),
        csvCell(o.observedAt),
        csvCell(o.status),
        csvCell(o.notes || ""),
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function profileLabel(profileId: string): string {
  if (!profileId) return "-";
  return profileId.slice(0, 8);
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

function OverviewTab({ data, roster, observations, onEditTeam, onDeleteTeam }: { data: TbosDashboardData; roster: TbosDbTeam[]; observations: TbosObservation[]; onEditTeam: (id: string, name: string) => void; onDeleteTeam: (id: string, name: string) => void }) {
  const { executiveSummary: summary } = data;
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  const [reportError, setReportError] = useState("");

  const rosterById = new Map(roster.map((team) => [team.id, team]));
  const observationsByTeam = (teamId: string) => observations.filter((o) => o.teamId === teamId);

  const handleDownloadTeamReport = async (teamId: string, teamName: string) => {
    setDownloadingReport(teamId);
    setReportError("");
    try {
      const response = await fetch(`/api/tbos/export?format=pdf&teamId=${encodeURIComponent(teamId)}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat laporan tim.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TBOS_Tim_${teamName.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[T-BOS] Team report export failed:", err);
      setReportError(err instanceof Error ? err.message : "Gagal mengunduh laporan tim.");
    } finally {
      setDownloadingReport(null);
    }
  };

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
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Fasilitator</th>
                 <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Roster</th>
                 <th className="text-center py-3 px-4 text-xs font-semibold text-[#0B2C6B] uppercase tracking-wide">Kelola</th>
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
                      <td className="py-3 px-4">
                        {(() => {
                          const teamObs = observationsByTeam(team.teamId);
                          const facNames = [...new Set(teamObs.map((o) => o.facilitatorName).filter(Boolean))];
                          if (facNames.length === 0) return <span className="text-xs text-slate-400">-</span>;
                          return (
                            <div className="flex flex-col gap-1">
                              {facNames.slice(0, 2).map((name) => (
                                <span key={name} className="inline-flex items-center gap-1 text-xs text-[#4A4C54]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] shrink-0" />
                                  {name}
                                </span>
                              ))}
                              {facNames.length > 2 && (
                                <span className="text-[10px] font-semibold text-[#0B2C6B]/60">+{facNames.length - 2} lagi</span>
                              )}
                            </div>
                          );
                        })()}
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
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => onEditTeam(team.teamId, team.teamName)} className="rounded-lg p-2 text-[#0B2C6B] hover:bg-[#0B2C6B]/[0.06]" aria-label={`Kelola ${team.teamName}`}><Pencil className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => onDeleteTeam(team.teamId, team.teamName)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Hapus ${team.teamName}`}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#F8F9FC] border-b border-black/[0.03]">
                         <td colSpan={9} className="py-4 px-4 sm:px-6">
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

                          <div className="mt-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-bold uppercase tracking-wide text-[#0B2C6B]">
                                Riwayat Observasi per Mission
                              </p>
                              <button
                                type="button"
                                onClick={() => handleDownloadTeamReport(team.teamId, team.teamName)}
                                disabled={downloadingReport !== null}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#071B3D] disabled:opacity-40"
                              >
                                {downloadingReport === team.teamId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                                Unduh Laporan Tim
                              </button>
                            </div>
                            {reportError && (
                              <p className="mt-2 text-xs text-red-600" role="alert">{reportError}</p>
                            )}
                            {observationsByTeam(team.teamId).length === 0 ? (
                              <p className="mt-2 text-sm text-slate-400 italic">Belum ada observasi untuk tim ini.</p>
                            ) : (
                              <div className="mt-2 overflow-x-auto rounded-lg border border-black/[0.05]">
                                <table className="w-full text-xs bg-white">
                                  <thead>
                                    <tr className="bg-[#0B2C6B]/[0.03]">
                                      <th className="text-left py-2 px-3 font-semibold text-[#0B2C6B]">Mission</th>
                                      <th className="text-center py-2 px-3 font-semibold text-[#0B2C6B]">Skor</th>
                                      <th className="text-left py-2 px-3 font-semibold text-[#0B2C6B]">Fasilitator</th>
                                      <th className="text-left py-2 px-3 font-semibold text-[#0B2C6B]">Tanggal</th>
                                      <th className="text-left py-2 px-3 font-semibold text-[#0B2C6B]">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {observationsByTeam(team.teamId).map((obs) => {
                                      const avg =
                                        obs.scores && obs.scores.length > 0
                                          ? Math.round((obs.scores.reduce((total, score) => total + score.levelValue, 0) / obs.scores.length) * 10) / 10
                                          : null;
                                      return (
                                        <tr key={obs.id} className="border-t border-black/[0.03]">
                                          <td className="py-2 px-3 font-medium text-[#0B2C6B]">{obs.missionName}</td>
                                          <td className="py-2 px-3 text-center font-bold text-[#0B2C6B]">{avg !== null ? avg.toFixed(1) : "-"}</td>
                                          <td className="py-2 px-3">
                                            <span className="inline-flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
                                              {obs.facilitatorName || profileLabel(obs.profileId)}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-[#4A4C54]">{formatDate(obs.observedAt)}</td>
                                          <td className="py-2 px-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                              obs.status === "locked"
                                                ? "bg-slate-100 text-slate-600"
                                                : obs.status === "submitted"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-amber-50 text-amber-700"
                                            }`}>
                                              {obs.status === "locked" ? "Terkunci" : obs.status === "submitted" ? "Submitted" : "Draft"}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
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

function CreateProgramModal({
  code,
  title,
  company,
  setCode,
  setTitle,
  setCompany,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  code: string;
  title: string;
  company: string;
  setCode: (v: string) => void;
  setTitle: (v: string) => void;
  setCompany: (v: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0B2C6B]" />
            <h3 className="text-base font-bold text-[#0B2C6B]">Buat Program Baru</h3>
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

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Nama Perusahaan
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Contoh: PT Masmindo Dwi Area"
              maxLength={160}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Kode Program
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Contoh: TBOS-MAS-2026-01"
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 font-mono text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Nama Program
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Leadership Readiness Sprint"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
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
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Buat Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
