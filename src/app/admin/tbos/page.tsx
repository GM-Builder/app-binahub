"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from "react";
import Link from "next/link";
import {
  Loader2,
  Users,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Plus,
  UserPlus,
  UsersRound,
  Lock,
  Check,
  X,
  ClipboardList,
  TrendingUp,
  Target,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Home,
  Building2,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/ui";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/download";
import { generateDashboardData } from "@/modules/tbos/scoring";
import { createTeam } from "@/modules/tbos/api-client";
import type { TbosDbTeam } from "@/modules/tbos/api-client";
import type { TbosDashboardData, TbosObservation } from "@/modules/tbos/types";
import { TbosRadarChart } from "./_components/radar-chart";
import { TbosHeatmap } from "./_components/heatmap";
import { TbosRanking } from "./_components/ranking";
import { TbosBatchComparison } from "./_components/batch-comparison";
import { TbosExecutiveSummary } from "./_components/executive-summary";
import { TbosTeamReports } from "./_components/team-reports";

type Tab = "overview" | "summary" | "teams" | "radar" | "heatmap" | "ranking" | "batch";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Ringkasan" },
  { key: "summary", label: "Ringkasan Eksekutif" },
  { key: "teams", label: "Laporan per Tim" },
  { key: "radar", label: "Grafik Radar" },
  { key: "heatmap", label: "Heatmap" },
  { key: "ranking", label: "Peringkat" },
  { key: "batch", label: "Perbandingan Batch" },
];

export default function TbosDashboardPage() {
  return (
    <AdminAuthGate>
      <AppShell role="admin" navigation="tbos" compactHeader title="Dashboard T-BOS" eyebrow="Observasi Perilaku Tim">
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
  const [activePrograms, setActivePrograms] = useState<Array<{ id: string; code: string | null; title: string }>>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

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
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "batch" | "team"; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [editingTeam, setEditingTeam] = useState<{ id: string; name: string } | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Batch filter persists in the URL (?batch=...) so the view can be shared/refreshed.
  const selectBatch = useCallback((batch: string) => {
    setSelectedBatch(batch);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (batch) url.searchParams.set("batch", batch);
    else url.searchParams.delete("batch");
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlBatch = new URLSearchParams(window.location.search).get("batch") || "";
    if (urlBatch) {
      void Promise.resolve().then(() => setSelectedBatch(urlBatch));
    }
  }, []);

  const fetchData = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!selectedProgramId) {
      setDashboardData(null);
      setTeamRoster([]);
      setObservations([]);
      setBatches([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);
    setError("");
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
      setLastUpdated(new Date());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data dashboard.";
      if (mode === "refresh") toast.error(message);
      else setError(message);
    } finally {
      if (mode === "initial") setLoading(false);
      else setRefreshing(false);
    }
  }, [selectedProgramId]);

  const handleProgramSelect = (programId: string) => {
    selectBatch("");
    setSelectedProgramId(programId);
  };

  const viewData = useMemo(() => {
    if (!dashboardData) return null;
    if (!selectedBatch) return { data: dashboardData, roster: teamRoster, observations };
    const roster = teamRoster.filter((team) => team.batch === selectedBatch);
    const filteredObservations = observations.filter((obs) => obs.batch === selectedBatch);
    return {
      data: generateDashboardData(roster, filteredObservations),
      roster,
      observations: filteredObservations,
    };
  }, [dashboardData, teamRoster, observations, selectedBatch]);

  useEffect(() => {
    let active = true;
    void import("@/modules/tbos/api-client")
      .then(({ fetchTbosPrograms }) => fetchTbosPrograms("tbos"))
      .then((programs) => { if (active) setActivePrograms(programs); })
      .catch((error) => { if (active) setError(error instanceof Error ? error.message : "Gagal memuat program T-BOS."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  useEffect(() => {
    if (!selectedProgramId && activePrograms[0]?.id) {
      void Promise.resolve().then(() => setSelectedProgramId(activePrograms[0].id));
    }
  }, [activePrograms, selectedProgramId]);

  const openAssignmentModal = async () => {
    setAssignmentError("");
    setAssignmentSuccess(false);
    try {
      const usersRes = await fetch("/api/users");
      const usersResult = await usersRes.json();

      if (!usersRes.ok || !usersResult.success) throw new Error(usersResult.error || "Gagal memuat fasilitator.");

      const available = (usersResult.users as Array<{ id: string; full_name: string; email: string; role: string }>)
        .filter((user) => user.role === "facilitator");
      setFacilitators(available);
      setSelectedFacilitatorId(available[0]?.id || "");

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
      const { assignFacilitatorToProgram } = await import("@/modules/tbos/api-client");
      const result = await assignFacilitatorToProgram({
        facilitatorId: selectedFacilitatorId,
        programId: selectedProgramId,
      });
      if (!result.success) throw new Error(result.error || "Gagal menugaskan fasilitator.");
      setAssignmentSuccess(true);
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Gagal menugaskan fasilitator.");
    } finally {
      setAssigning(false);
    }
  };

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
        fetchData("refresh");
      }, 1000);
    } else {
      setCreateTeamError(res.error || "Gagal membuat tim.");
    }
    setCreatingTeam(false);
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
        fetchData("refresh");
      } else {
        setBatchError(result.error || "Gagal membuat batch.");
      }
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Gagal membuat batch.");
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleDeleteBatch = (batchId: string, name: string) => {
    setDeleteTarget({ type: "batch", id: batchId, name });
  };

  const confirmDeleteItem = async () => {
    if (!deleteTarget) return;
    setDeletingItem(true);
    try {
      if (deleteTarget.type === "batch") {
        const { deleteBatch } = await import("@/modules/tbos/api-client");
        const result = await deleteBatch(deleteTarget.id);
        if (!result.success) throw new Error(result.error || "Batch tidak dapat dihapus.");
      } else {
        const response = await fetch(`/api/tbos/teams/${deleteTarget.id}`, { method: "DELETE" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.error || "Tim tidak dapat dihapus.");
      }
      toast.success(`${deleteTarget.type === "batch" ? "Batch" : "Tim"} berhasil dihapus.`);
      await fetchData("refresh");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus data.");
    } finally {
      setDeletingItem(false);
    }
  };

  const handleEditTeam = (teamId: string, currentName: string) => {
    setEditingTeam({ id: teamId, name: currentName });
    setEditTeamName(currentName);
  };

  const saveTeamName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTeam || !editTeamName.trim()) return;
    setSavingTeam(true);
    try {
      const response = await fetch(`/api/tbos/teams/${editingTeam.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editTeamName.trim() }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal mengubah tim.");
      toast.success("Nama tim diperbarui.");
      setEditingTeam(null);
      await fetchData("refresh");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah tim.");
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDeleteTeam = (teamId: string, name: string) => {
    setDeleteTarget({ type: "team", id: teamId, name });
  };

  const deleteConfirmation = (
    <ConfirmDialog
      open={!!deleteTarget}
      onClose={() => { if (!deletingItem) setDeleteTarget(null); }}
      onConfirm={confirmDeleteItem}
      title={`Hapus ${deleteTarget?.type === "batch" ? "Batch" : "Tim"}?`}
      description={deleteTarget ? `${deleteTarget.type === "batch" ? "Batch" : "Tim"} "${deleteTarget.name}" akan dihapus permanen. Data yang masih digunakan atau memiliki histori akan ditolak oleh sistem.` : undefined}
      confirmLabel="Ya, Hapus"
      variant="danger"
      loading={deletingItem}
    />
  );

  const summary = viewData?.data?.executiveSummary ?? dashboardData?.executiveSummary;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="space-y-2">
            <div className="h-3 w-36 animate-pulse rounded bg-slate-200/80" />
            <div className="h-6 w-52 animate-pulse rounded bg-slate-200/80" />
          </div>
          <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-200/80" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200/80" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-lg bg-slate-200/80" />)}
        </div>
        <div className="border-t border-slate-200 pt-4">
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-slate-200/80" />)}
          </div>
          <div className="mt-5 h-64 animate-pulse rounded-2xl bg-slate-200/60" />
        </div>
        <span className="sr-only" role="status">Memuat data T-BOS…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <X className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-red-800">Gagal memuat dashboard T-BOS</p>
          <p className="mt-1 text-sm leading-relaxed text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const programOptions = activePrograms.length > 0 ? (
    <select
      value={selectedProgramId}
      onChange={(event) => handleProgramSelect(event.target.value)}
      className="min-h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-[#F7F6F2] px-2.5 text-xs font-semibold text-[#0B2C6B] outline-none transition-colors focus:border-[#D9A441] focus:bg-white sm:w-auto sm:max-w-72"
      aria-label="Pilih program aktif"
    >
      {activePrograms.map((program) => (
        <option key={program.id} value={program.id}>{program.title}</option>
      ))}
    </select>
  ) : null;

  if (!dashboardData || dashboardData.teams.length === 0) {
    return (
      <div>
        {/* Band 1 — page header */}
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observasi perilaku tim</p>
            <h1 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#0B2C6B]">Dashboard T-BOS</h1>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && <span className="hidden text-[11px] text-slate-400 sm:inline">Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>}
            <button
              type="button"
              onClick={() => void fetchData("refresh")}
              disabled={refreshing}
              title="Perbarui data sekarang"
              aria-label="Perbarui data"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0B2C6B] transition-colors hover:border-[#0B2C6B]/30 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
            <Link href="/admin/engagements/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#071B3D]">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Buat Program
            </Link>
          </div>
        </header>

        {/* Band 2 — filter & toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">{programOptions}</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddTeamModal(true)}
              disabled={!selectedProgramId}
              title={selectedProgramId ? "Tambah tim ke program aktif" : "Pilih program aktif terlebih dahulu"}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#4A4C54] transition-colors hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Tambah Tim
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B2C6B]/[0.05]">
          <Users className="w-7 h-7 text-[#0B2C6B]/40" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-bold text-[#0B2C6B] mb-2">Belum Ada Data Tim T-BOS</h3>
        <p className="text-sm text-[#4A4C54] mb-6 leading-relaxed">
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
            className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-[#F7F6F2] px-3 text-sm outline-none transition-colors focus:border-[#D9A441] focus:bg-white"
          />
          <button type="submit" disabled={creatingBatch || !newBatchName.trim()} className="min-h-11 rounded-xl bg-[#D9A441] px-4 text-sm font-bold text-[#071B3D] shadow-sm shadow-[#D9A441]/30 transition-colors hover:bg-[#C89432] disabled:opacity-50">
            {creatingBatch ? "Menyimpan…" : "+ Tambah Batch"}
          </button>
        </form>
        {batchError && <p className="mb-4 text-sm text-red-700" role="alert">{batchError}</p>}
        {batches.length > 0 && (
          <div className="mx-auto mb-5 flex max-w-md flex-wrap justify-center gap-2">
            {batches.map((batch) => (
              <span key={batch.id} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0B2C6B]">
                {batch.name}
                <button type="button" onClick={() => handleDeleteBatch(batch.id, batch.name)} title={`Hapus batch ${batch.name}`} aria-label={`Hapus batch ${batch.name}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowAddTeamModal(true)}
          disabled={batches.length === 0}
          title={batches.length === 0 ? "Buat minimal satu batch terlebih dahulu." : "Tambah tim pertama"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors shadow-sm shadow-[#0B2C6B]/20 disabled:opacity-40"
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
        {deleteConfirmation}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Band 1 — Page header */}
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Observasi perilaku tim</p>
          <h1 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#0B2C6B]">
            Dashboard T-BOS{selectedBatch ? <span className="font-semibold text-[#4A4C54]"> · {selectedBatch}</span> : null}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="hidden text-[11px] text-slate-400 sm:inline">Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>}
          <button
            type="button"
            onClick={() => void fetchData("refresh")}
            disabled={refreshing}
            title="Perbarui data sekarang"
            aria-label="Perbarui data"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#0B2C6B] transition-colors hover:border-[#0B2C6B]/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
          <Link href="/admin/engagements/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#071B3D]">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Buat Program
          </Link>
        </div>
      </header>

      {/* Band 2 — Filter & toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {programOptions}
          {batches.length > 0 && (
            <>
              <div className="flex items-center gap-1 rounded-lg bg-[#0B2C6B]/[0.04] p-1" role="group" aria-label="Filter batch">
                <button
                  type="button"
                  onClick={() => selectBatch("")}
                  aria-pressed={!selectedBatch}
                  className={`inline-flex h-7 items-center rounded-md px-2.5 text-xs font-semibold transition-colors ${
                    !selectedBatch ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]" : "text-[#4A4C54] hover:bg-white/60 hover:text-[#0B2C6B]"
                  }`}
                >
                  Semua Batch
                </button>
                {batches.map((batch) => {
                  const active = selectedBatch === batch.name;
                  const count = teamRoster.filter((team) => team.batch === batch.name).length;
                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => selectBatch(batch.name)}
                      aria-pressed={active}
                      className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                        active ? "bg-white text-[#0B2C6B] shadow-sm ring-1 ring-black/[0.04]" : "text-[#4A4C54] hover:bg-white/60 hover:text-[#0B2C6B]"
                      }`}
                    >
                      {batch.name}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-[#0B2C6B]/[0.08] text-[#0B2C6B]" : "bg-black/[0.04] text-[#4A4C54]/70"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(true)}
                title="Kelola batch"
                aria-label="Kelola batch"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-[#0B2C6B]/[0.06] hover:text-[#0B2C6B]"
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddTeamModal(true)}
            disabled={!selectedProgramId}
            title={selectedProgramId ? "Tambah tim ke program aktif" : "Pilih program aktif terlebih dahulu"}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#4A4C54] transition-colors hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Tambah Tim
          </button>
          <button
            onClick={openAssignmentModal}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#D9A441] px-3 text-xs font-bold text-[#071B3D] transition-colors hover:bg-[#C89432]"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            Tugaskan Fasilitator
          </button>
          <TbosOverflowMenu />
        </div>
      </div>

      {/* Band 3 — Stats strip + Band 4 — Tabs & export */}
      {viewData && viewData.data.teams.length > 0 ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-4">
            <MetricTile label="Total tim" value={String(viewData.data.teams.length)} />
            <MetricTile label="Total observasi" value={String(summary?.totalObservations || 0)} />
            <MetricTile
              label="Dimensi terobservasi"
              value={String(viewData.data.batchComparisons.filter((b) => b.batchAverages.some((ba) => ba.avg !== null)).length)}
              suffix={`/ ${viewData.data.batchComparisons.length}`}
            />
            <MetricTile
              label="Rata-rata skor"
              value={
                summary?.topStrengths.length
                  ? (summary.topStrengths.reduce((a, b) => a + (b.score || 0), 0) / summary.topStrengths.length).toFixed(1)
                  : "-"
              }
              accent
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="tablist"
              aria-label="Jenis laporan T-BOS"
              className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0"
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
                const offset = event.key === "ArrowRight" ? 1 : -1;
                const next = TABS[(currentIndex + offset + TABS.length) % TABS.length];
                const nextButton = event.currentTarget.querySelector<HTMLButtonElement>(`[data-tab="${next.key}"]`);
                nextButton?.focus();
                setActiveTab(next.key);
              }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  data-tab={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  tabIndex={activeTab === tab.key ? 0 : -1}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]"
                      : "text-[#4A4C54] hover:bg-[#0B2C6B]/[0.03] hover:text-[#0B2C6B]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ExportButtons programId={selectedProgramId} batch={selectedBatch} />
          </div>

          {/* Tab Content */}
          <div className="mt-5">
            {activeTab === "overview" && <OverviewTab data={viewData.data} roster={viewData.roster} observations={viewData.observations} onEditTeam={handleEditTeam} onDeleteTeam={handleDeleteTeam} />}
            {activeTab === "summary" && <TbosExecutiveSummary data={viewData.data} />}
            {activeTab === "teams" && <TbosTeamReports teams={viewData.data.teams} roster={viewData.roster} />}
            {activeTab === "radar" && <TbosRadarChart teams={viewData.data.teams} />}
            {activeTab === "heatmap" && <TbosHeatmap teams={viewData.data.teams} />}
            {activeTab === "ranking" && <TbosRanking teams={viewData.data.teams} />}
            {activeTab === "batch" && <TbosBatchComparison comparisons={viewData.data.batchComparisons} />}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B2C6B]/[0.05]">
            <Users className="h-6 w-6 text-[#0B2C6B]/40" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-bold text-[#0B2C6B]">Belum ada tim pada batch ini</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#4A4C54]">
            {selectedBatch
              ? `Batch "${selectedBatch}" belum memiliki tim yang terobservasi. Pilih batch lain atau tambahkan tim.`
              : "Belum ada data tim untuk program ini."}
          </p>
        </div>
      )}

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
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-bold text-[#0B2C6B]">Buat Batch Baru</h3>
              <button onClick={() => { setShowBatchModal(false); setBatchError(""); setNewBatchName(""); }} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4A4C54] transition-colors hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-4 p-6">
              {batchError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">{batchError}</div>}
              <div>
                <label htmlFor="new-batch-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0B2C6B]">Nama Batch</label>
                <input
                  id="new-batch-name"
                  type="text"
                  required
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="Contoh: Batch 1, Angkatan 2025-A"
                  maxLength={50}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#F7F6F2] px-3.5 text-sm outline-none transition-colors focus:border-[#0B2C6B] focus:bg-white focus:ring-2 focus:ring-[#0B2C6B]/15"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowBatchModal(false); setBatchError(""); setNewBatchName(""); }} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-[#4A4C54] transition-colors hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={creatingBatch || !newBatchName.trim()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white shadow-sm shadow-[#0B2C6B]/20 transition-colors hover:bg-[#071B3D] disabled:opacity-50">
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
          facilitatorId={selectedFacilitatorId}
          setFacilitatorId={(value) => {
            setSelectedFacilitatorId(value);
            setAssignmentError("");
            setAssignmentSuccess(false);
          }}
          loading={assigning}
          error={assignmentError}
          success={assignmentSuccess}
          onSubmit={handleAssignFacilitator}
          onClose={() => setShowAssignmentModal(false)}
        />
      )}
      {editingTeam && (
        <TeamNameModal
          value={editTeamName}
          onChange={setEditTeamName}
          loading={savingTeam}
          onSubmit={saveTeamName}
          onClose={() => { if (!savingTeam) setEditingTeam(null); }}
        />
      )}
      {deleteConfirmation}
    </div>
  );
}

function TeamNameModal({
  value,
  onChange,
  loading,
  onSubmit,
  onClose,
}: {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="edit-team-title">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <h2 id="edit-team-title" className="text-base font-bold text-[#0B2C6B]">Ubah Nama Tim</h2>
        <label htmlFor="edit-team-name" className="mt-4 block text-xs font-semibold text-[#0B2C6B]">Nama tim</label>
        <input id="edit-team-name" autoFocus required maxLength={50} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-[#0B2C6B]" />
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-[#0B2C6B] disabled:opacity-50">Batal</button>
          <button type="submit" disabled={loading || !value.trim()} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}

function AssignmentModal({
  facilitators,
  facilitatorId,
  setFacilitatorId,
  loading,
  error,
  success,
  onSubmit,
  onClose,
}: {
  facilitators: Array<{ id: string; full_name: string; email: string }>;
  facilitatorId: string;
  setFacilitatorId: (value: string) => void;
  loading: boolean;
  error: string;
  success: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="assignment-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B2C6B]/[0.06] text-[#0B2C6B]">
              <UsersRound className="h-4.5 w-4.5" />
            </span>
            <h2 id="assignment-title" className="font-bold text-[#0B2C6B]">Tugaskan Fasilitator ke Program</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup penugasan" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4A4C54] transition-colors hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5">
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          {success && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">Fasilitator berhasil ditugaskan ke program.</p>}
          {facilitators.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Belum ada akun dengan role fasilitator.</p>
          ) : (
            <div>
              <label htmlFor="tbos-facilitator" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0B2C6B]">Fasilitator</label>
              <select id="tbos-facilitator" value={facilitatorId} onChange={(event) => setFacilitatorId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#F7F6F2] px-3 text-sm outline-none transition-colors focus:border-[#0B2C6B] focus:bg-white">
                {facilitators.map((facilitator) => <option key={facilitator.id} value={facilitator.id}>{facilitator.full_name || facilitator.email}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-[#4A4C54] transition-colors hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={loading || success || facilitators.length === 0 || !facilitatorId} className="min-h-11 flex-1 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white shadow-sm shadow-[#0B2C6B]/20 transition-colors hover:bg-[#071B3D] disabled:opacity-50">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B2C6B]/[0.06] text-[#0B2C6B]">
              <Users className="w-4.5 h-4.5" />
            </span>
            <h3 className="text-base font-bold text-[#0B2C6B]">Tambah Tim Baru</h3>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4A4C54] transition-colors hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <Check className="w-4 h-4 text-emerald-600" />
              Tim berhasil ditambahkan!
            </div>
          )}

          <div>
            <label htmlFor="new-team-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0B2C6B]">
              Nama Tim
            </label>
            <input
              id="new-team-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Team Alpha, Bravo 1"
              maxLength={50}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#F7F6F2] px-3.5 text-sm outline-none transition-colors focus:border-[#0B2C6B] focus:bg-white focus:ring-2 focus:ring-[#0B2C6B]/15"
            />
          </div>

          <div>
            <label htmlFor="new-team-batch" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0B2C6B]">
              Batch Program
            </label>
            {batches.length > 0 ? (
              <select
                id="new-team-batch"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-[#F7F6F2] px-3.5 text-sm outline-none transition-colors focus:border-[#0B2C6B] focus:bg-white"
              >
                <option value="">Pilih batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-600">
                Belum ada batch. Buat batch terlebih dahulu di panel &quot;Kelola Batch&quot;.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-[#4A4C54] transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B2C6B] text-sm font-semibold text-white shadow-sm shadow-[#0B2C6B]/20 transition-colors hover:bg-[#071B3D] disabled:opacity-50"
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

function ExportButtons({ programId, batch }: { programId: string; batch?: string }) {
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);

  const batchParam = batch
    ? `&batch=${encodeURIComponent(batch)}`
    : "";
  const batchLabel = batch
    ? safeBatchLabel(batch)
    : "";

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      const response = await fetch(`/api/tbos/export?format=pdf&programId=${encodeURIComponent(programId)}${batchParam}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat PDF.");
      }
      const blob = await response.blob();
      downloadBlob(blob, `TBOS_Report_${batchLabel ? `${batchLabel}_` : ""}${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(batch ? `Laporan PDF ${batch} berhasil diunduh.` : "Laporan PDF berhasil diunduh.");
    } catch (err) {
      console.error("[T-BOS] PDF export failed:", err);
      toast.error(err instanceof Error ? err.message : "Gagal mengekspor PDF. Coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting("csv");
    try {
      const { fetchDashboardRawData } = await import("@/modules/tbos/api-client");
      const { observations } = await fetchDashboardRawData(programId);
      const scopedObservations = batch
        ? observations.filter((o) => o.batch === batch)
        : observations;

      const headers = ["ID", "Tim", "Batch", "Misi", "Fasilitator", "Tanggal Observasi", "Status", "Catatan"];
      const csvCell = (value: string) => {
        const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
        return `"${safeValue.replace(/"/g, '""')}"`;
      };
      const rows = scopedObservations.map((o) => [
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
      downloadBlob(blob, `TBOS_Observations${batchLabel ? `_${batchLabel}` : ""}_${new Date().toISOString().split("T")[0]}.csv`);
      toast.success(batch ? `CSV ${batch} berhasil diunduh.` : "CSV data berhasil diunduh.");
    } catch (err) {
      console.error("[T-BOS] CSV export failed:", err);
      toast.error(err instanceof Error ? err.message : "Gagal mengekspor CSV. Coba lagi.");
    } finally {
      setExporting(null);
    }
  };

  return (
      <div className="flex w-full shrink-0 gap-2 sm:w-auto">
        <button
          onClick={handleExportPdf}
          disabled={exporting !== null}
          title={batch ? `Laporan PDF per Batch (${batch})` : "Laporan PDF Grup"}
          className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#071B3D] disabled:opacity-40 sm:flex-none"
        >
          {exporting === "pdf" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span className="hidden xl:inline">{batch ? "PDF per Batch" : "PDF Grup"}</span>
          <span className="xl:hidden">PDF</span>
        </button>
        <button
          onClick={handleExportCsv}
          disabled={exporting !== null}
          title="Unduh data observasi (CSV)"
          className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#4A4C54] transition-colors hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] disabled:opacity-40 sm:flex-none"
        >
          {exporting === "csv" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          <span className="hidden xl:inline">Data CSV</span>
          <span className="xl:hidden">CSV</span>
        </button>
      </div>
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

function safeBatchLabel(batch: string): string {
  return batch.normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "batch";
}

function MetricTile({ label, value, suffix, accent = false }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <section className={`rounded-lg px-3.5 py-3 ${accent ? "bg-[#FFF9EA]" : "bg-[#F7F6F2]"}`}>
      <p className={`text-xs font-medium ${accent ? "text-[#9A6A12]" : "text-[#4A4C54]"}`}>{label}</p>
      <p className={`mt-1 text-[22px] font-medium leading-tight tracking-[-0.01em] ${accent ? "text-[#9A6A12]" : "text-[#0B2C6B]"}`}>
        {value}
        {suffix && <span className="ml-1 text-xs font-normal text-slate-400">{suffix}</span>}
      </p>
    </section>
  );
}

function TbosOverflowMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

  const OVERFLOW_ACTIONS = [
    { key: "observations", href: "/fasilitator/tbos/observations", icon: <Lock className="h-3.5 w-3.5" aria-hidden="true" />, label: "Kelola Observasi" },
    { key: "facilitator", href: "/fasilitator/tbos", icon: <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />, label: "Buka Form Fasilitator" },
    { key: "admin", href: "/admin", icon: <Home className="h-3.5 w-3.5" aria-hidden="true" />, label: "Kembali ke Admin" },
  ];

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void Promise.resolve().then(() => itemsRef.current[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const currentIndex = itemsRef.current.findIndex((node) => node === document.activeElement);
      const total = OVERFLOW_ACTIONS.length;
      const next = event.key === "ArrowDown"
        ? (currentIndex + 1 + total) % total
        : (currentIndex - 1 + total) % total;
      itemsRef.current[next]?.focus();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      previousFocus?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Aksi lainnya"
        title="Aksi lainnya"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#4A4C54] transition-colors hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B]"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Aksi lainnya"
          className="absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
        >
          {OVERFLOW_ACTIONS.map((action, index) => (
            <Link
              key={action.key}
              ref={(node) => { itemsRef.current[index] = node; }}
              role="menuitem"
              href={action.href}
              onClick={() => setOpen(false)}
              tabIndex={-1}
              className="flex min-h-9 items-center gap-2.5 px-3 text-xs font-semibold text-[#4A4C54] outline-none transition-colors hover:bg-[#0B2C6B]/[0.04] hover:text-[#0B2C6B] focus-visible:bg-[#0B2C6B]/[0.04] focus-visible:text-[#0B2C6B]"
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
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

function OverviewTab({ data, roster, observations, onEditTeam, onDeleteTeam }: { data: TbosDashboardData; roster: TbosDbTeam[]; observations: TbosObservation[]; onEditTeam: (id: string, name: string) => void; onDeleteTeam: (id: string, name: string) => void }) {
  const { executiveSummary: summary } = data;
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const rosterById = new Map(roster.map((team) => [team.id, team]));
  const observationsByTeam = (teamId: string) => observations.filter((o) => o.teamId === teamId);

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Strengths */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">Kekuatan Utama</h3>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-[#0B2C6B]">Area Pengembangan</h3>
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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-[#0B2C6B]">Ringkasan Tim</h3>
          <span className="rounded-full bg-[#0B2C6B]/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0B2C6B]/70">{data.teams.length} tim</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F7F6F2]">
                <th className="text-left py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Tim</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Batch</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Skor</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Kekuatan</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Area Pengembangan</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Observasi</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Fasilitator</th>
                 <th className="text-center py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Anggota</th>
                 <th className="text-center py-3 px-4 text-[10px] font-bold text-[#0B2C6B] uppercase tracking-wider">Kelola</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team, idx) => {
                const isExpanded = expandedTeamId === team.teamId;
                const rosterTeam = rosterById.get(team.teamId);
                const members = rosterTeam?.members || [];
                return (
                  <Fragment key={team.teamId}>
                    <tr className={`border-b border-slate-100 transition-colors hover:bg-[#0B2C6B]/[0.03] ${idx % 2 === 1 ? "bg-[#FAFAF8]" : ""}`}>
                      <td className="py-3 px-4 font-semibold text-[#0B2C6B]">{team.teamName}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0B2C6B]/[0.06] text-[#0B2C6B]/80">{team.batch}</span>
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
                          aria-label={`Lihat anggota tim ${team.teamName}`}
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
                      <tr className="bg-[#FAFAF8] border-b border-slate-100">
                         <td colSpan={9} className="py-4 px-4 sm:px-6">
                           <p className="text-xs font-bold uppercase tracking-wider text-[#0B2C6B]">
                             Anggota dan Kapten
                           </p>
                           {members.length === 0 ? (
                             <p className="mt-2 text-sm text-slate-400 italic">Daftar anggota belum diisi.</p>
                           ) : (
                             <ul className="mt-2 flex flex-wrap gap-2" aria-label={`Anggota ${team.teamName}`}>
                               {members.map((member) => (
                                 <li key={member.id} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
                                   <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${member.is_captain ? "bg-[#D9A441]/15 text-[#9A6A12]" : "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]"}`}>
                                     {member.is_captain ? "C" : member.member_name?.charAt(0)?.toUpperCase() || "?"}
                                   </span>
                                   {member.member_name}
                                 </li>
                               ))}
                             </ul>
                           )}

                           <div className="mt-4">
                             <p className="text-xs font-bold uppercase tracking-wider text-[#0B2C6B]">
                               Riwayat observasi per misi
                             </p>
                             {observationsByTeam(team.teamId).length === 0 ? (
                               <p className="mt-2 text-sm text-slate-400 italic">Belum ada observasi untuk tim ini.</p>
                             ) : (
                               <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                                 <table className="w-full text-xs bg-white">
                                   <thead>
                                     <tr className="bg-[#F7F6F2]">
                                       <th className="text-left py-2 px-3 font-bold text-[#0B2C6B] uppercase tracking-wide">Misi</th>
                                       <th className="text-center py-2 px-3 font-bold text-[#0B2C6B] uppercase tracking-wide">Skor</th>
                                       <th className="text-left py-2 px-3 font-bold text-[#0B2C6B] uppercase tracking-wide">Fasilitator</th>
                                       <th className="text-left py-2 px-3 font-bold text-[#0B2C6B] uppercase tracking-wide">Tanggal</th>
                                       <th className="text-left py-2 px-3 font-bold text-[#0B2C6B] uppercase tracking-wide">Status</th>
                                     </tr>
                                   </thead>
                                   <tbody>
                                     {observationsByTeam(team.teamId).map((obs) => {
                                       const avg =
                                         obs.scores && obs.scores.length > 0
                                           ? Math.round((obs.scores.reduce((total, score) => total + score.levelValue, 0) / obs.scores.length) * 10) / 10
                                           : null;
                                       return (
                                         <tr key={obs.id} className="border-t border-slate-100">
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
                                               {obs.status === "locked" ? "Terkunci" : obs.status === "submitted" ? "Tersimpan" : "Draf"}
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

// Kept exported for backward-compatible imports; the dashboard now routes all
// creation through the canonical program wizard so module selection is not duplicated.
export function CreateProgramModal({
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
