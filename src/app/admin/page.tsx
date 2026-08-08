"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, RefreshCw, Loader2, Radar as RadarIcon, Grid3x3, Trophy, BarChart3, Users, FileText, Download, FileSpreadsheet, Plus, ShieldCheck, UsersRound, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AssessmentPanel } from "./_components/assessment-panel";
import { ContactsPanel } from "./_components/contacts-panel";
import { InquiriesPanel } from "./_components/inquiries-panel";
import { Overview } from "./_components/overview";
import { SmartCenterPanel } from "./_components/smart-center-panel";
import { DashboardSkeleton, NotificationBadge } from "./_components/shared";
import { TAB_META, tabs } from "./_lib/constants";
import { isProjectCompleted } from "./_lib/utils";
import type { DashboardData } from "./_lib/types";
import { ErrorBoundary } from "@/components/error-boundary";
import { generateDashboardData } from "@/modules/tbos/scoring";
import type { TbosObservation, TbosDashboardData } from "@/modules/tbos/types";
import { TbosRadarChart } from "./_components/tbos-radar";
import { TbosHeatmap } from "./_components/tbos-heatmap";
import { TbosRanking } from "./_components/tbos-ranking";
import { TbosBatchComparison } from "./_components/tbos-batch";
import { TbosExecutiveSummary } from "./_components/tbos-exec-summary";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [query, setQuery] = useState("");
  const [assessmentCategory, setAssessmentCategory] = useState("Semua");
  const [assessmentEmployeeRange, setAssessmentEmployeeRange] = useState("Semua");
  const [assessmentMinScore, setAssessmentMinScore] = useState("0");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seenState, setSeenState] = useState({ assessment: "", inquiries: "" });

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      setError(json.error || "Gagal memuat dashboard admin.");
      setLoading(false);
      if (response.status === 401 || response.status === 403) {
        router.replace("/login");
      }
      return;
    }

    setData(json as DashboardData);
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchDashboard());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const storedSeen = {
      assessment: localStorage.getItem("binahub_admin_seen_assessment") || "",
      inquiries: localStorage.getItem("binahub_admin_seen_inquiries") || "",
    };
    void Promise.resolve().then(() => setSeenState(storedSeen));
  }, []);

  useEffect(() => {
    if (!data) return;
    const nextSeen: Partial<typeof seenState> = {};

    if (!localStorage.getItem("binahub_admin_seen_assessment")) {
      const latest = data.assessments[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_assessment", latest);
      nextSeen.assessment = latest;
    }

    if (!localStorage.getItem("binahub_admin_seen_inquiries")) {
      const latest = data.inquiries[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_inquiries", latest);
      nextSeen.inquiries = latest;
    }

    if (activeTab === "Assessment") {
      const latest = data.assessments[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_assessment", latest);
      nextSeen.assessment = latest;
    }

    if (activeTab === "Inquiry Masuk") {
      const latest = data.inquiries[0]?.createdAt || new Date().toISOString();
      localStorage.setItem("binahub_admin_seen_inquiries", latest);
      nextSeen.inquiries = latest;
    }

    if (Object.keys(nextSeen).length) {
      void Promise.resolve().then(() => setSeenState((current) => ({ ...current, ...nextSeen })));
    }
  }, [activeTab, data]);

  const filteredAssessments = useMemo(() => {
    const search = query.toLowerCase();
    return (data?.assessments || []).filter((item) =>
      [item.name, item.email, item.company, item.role, item.category, item.assessmentStatus, item.proposalStatus]
        .join(" ")
        .toLowerCase()
        .includes(search) &&
      (assessmentCategory === "Semua" || item.category === assessmentCategory) &&
      (assessmentEmployeeRange === "Semua" || item.employees === assessmentEmployeeRange) &&
      item.overallScore >= Number(assessmentMinScore || 0)
    );
  }, [assessmentCategory, assessmentEmployeeRange, assessmentMinScore, data, query]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const newAssessmentCount = useMemo(() => {
    if (!data || !seenState.assessment) return data?.assessments.length || 0;
    const seenTime = new Date(seenState.assessment).getTime();
    return data.assessments.filter((item) => new Date(item.createdAt).getTime() > seenTime).length;
  }, [data, seenState.assessment]);

  const newInquiryCount = useMemo(() => {
    if (!data || !seenState.inquiries) return data?.inquiries.length || 0;
    const seenTime = new Date(seenState.inquiries).getTime();
    return data.inquiries.filter((item) => new Date(item.createdAt || 0).getTime() > seenTime).length;
  }, [data, seenState.inquiries]);

  const adminRequest = async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.replace("/login");
      throw new Error("Sesi admin tidak ditemukan.");
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.error || "Aksi admin gagal.");
    }

    return json;
  };

  const activeMeta = TAB_META[activeTab];
  const activeProjectCount = data?.projects?.filter((project) => !isProjectCompleted(project)).length || 0;
  const pendingSmartActionCount =
    data?.smartActions?.filter((action) => (action.status || "").toLowerCase() === "pending").length || 0;
  const focusStats = [
    { label: "Assessment baru", value: newAssessmentCount },
    { label: "Inquiry baru", value: newInquiryCount },
    { label: "Smart action", value: pendingSmartActionCount },
    { label: "Project aktif", value: activeProjectCount },
  ];

  return (
    <>
      <main className="admin-root min-h-screen bg-[#FAF8F4] text-slate-900 font-sans selection:bg-[#C79A3C]/20 selection:text-[#0B2C6B]">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-800/60 bg-[#071B3D] px-5 py-6 text-white lg:flex lg:flex-col lg:justify-between z-30">
          <div>
            {/* Genuine Logo */}
            <div className="mb-8 px-2">
              <Link href="/home" className="inline-block transition-opacity hover:opacity-90">
                <img
                  src="/binahub_logo.webp"
                  alt="BinaHub Logo"
                  className="h-9 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D9A441]">
                  Admin Workspace
                </span>
              </div>
            </div>

            {/* Navigation Tabs: Analitik & Intelijen */}
            <nav className="space-y-1">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pusat Analitik &amp; Intelijen
              </p>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-left text-xs font-semibold transition-all ${
                    activeTab === tab
                      ? "bg-white text-[#0B2C6B] shadow-sm shadow-black/10"
                      : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab}
                    {tab === "Assessment" && newAssessmentCount > 0 && <NotificationBadge count={newAssessmentCount} />}
                    {tab === "Inquiry Masuk" && newInquiryCount > 0 && <NotificationBadge count={newInquiryCount} />}
                  </span>
                  {activeTab === tab && <ArrowRight size={14} className="text-[#D9A441]" />}
                </button>
              ))}
            </nav>

            {/* Manajemen & Tata Kelola */}
            <div className="mt-5 border-t border-slate-800/80 pt-3 space-y-1">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Manajemen &amp; Tata Kelola
              </p>
              <Link
                href="/admin/users"
                className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Manajemen User &amp; Role
              </Link>
              <Link
                href="/admin/engagements"
                className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Program Engagements
              </Link>
              <Link
                href="/admin/rbac"
                className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Matriks Izin RBAC
              </Link>
            </div>

            {/* Operasional Lapangan */}
            <div className="mt-4 border-t border-slate-800/80 pt-3 space-y-1">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operasional Lapangan
              </p>
              <Link
                href="/fasilitator/tbos/observations"
                className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Kelola &amp; Kunci Observasi
              </Link>
              <Link
                href="/fasilitator/tbos"
                className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Form Input Observasi
              </Link>
              <Link
                href="/peserta/dashboard"
                className="flex rounded-xl px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Dashboard Peserta
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-all"
          >
            <LogOut size={14} /> Keluar dari Sesi
          </button>
        </aside>

        <section className="lg:pl-72">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-md md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#C79A3C]">
                  {activeMeta.eyebrow}
                </p>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                  {activeMeta.title}
                </h1>
                <p className="mt-1 max-w-2xl text-xs text-slate-500 leading-relaxed">
                  {activeMeta.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value as (typeof tabs)[number])}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs lg:hidden"
                >
                  {tabs.map((tab) => (
                    <option key={tab}>{tab}</option>
                  ))}
                </select>
                <button
                  onClick={fetchDashboard}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin text-[#C79A3C]" : "text-slate-500"} />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          <div className="p-5 md:p-8">
            {error && (
              <div className="mb-6 rounded-[12px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading || !data ? (
              <DashboardSkeleton />
            ) : (
              <>
                {activeTab === "Overview" && <Overview data={data} />}
                {activeTab === "Automation Center" && (
                  <SmartCenterPanel data={data} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "Assessment" && (
                  <AssessmentPanel
                    data={data}
                    records={filteredAssessments}
                    query={query}
                    setQuery={setQuery}
                    category={assessmentCategory}
                    setCategory={setAssessmentCategory}
                    employeeRange={assessmentEmployeeRange}
                    setEmployeeRange={setAssessmentEmployeeRange}
                    minScore={assessmentMinScore}
                    setMinScore={setAssessmentMinScore}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    onAction={adminRequest}
                    onRefresh={fetchDashboard}
                  />
                )}
                {activeTab === "Kontak & Leads" && (
                  <ContactsPanel contacts={data.contacts} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "Inquiry Masuk" && (
                  <InquiriesPanel inquiries={data.inquiries} onAction={adminRequest} onRefresh={fetchDashboard} />
                )}
                {activeTab === "T-BOS" && (
                  <TbosTab />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function TbosTab() {
  const [subTab, setSubTab] = useState<"overview" | "summary" | "radar" | "heatmap" | "ranking" | "batch">("overview");
  const [dashboardData, setDashboardData] = useState<TbosDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Team Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamBatch, setNewTeamBatch] = useState<"Batch 1" | "Batch 2">("Batch 1");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createTeamError, setCreateTeamError] = useState("");
  const [createTeamSuccess, setCreateTeamSuccess] = useState(false);

  // Assign Facilitator Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [facilitatorsList, setFacilitatorsList] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
  const [selectedMissionId, setSelectedMissionId] = useState("mission-1");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assignError, setAssignError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const { fetchDashboardRawData } = await import("@/modules/tbos/api-client");
      const { teams, observations } = await fetchDashboardRawData();
      const computed = generateDashboardData(teams, observations);
      setDashboardData(computed);

      // Fetch facilitators list for assignment
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userRes = await res.json();
        if (userRes.success && userRes.users) {
          const facs = userRes.users.filter((u: any) => u.role === "facilitator" || u.role === "admin");
          setFacilitatorsList(facs);
          if (facs.length > 0 && !selectedFacilitatorId) {
            setSelectedFacilitatorId(facs[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load users for facilitator assignment:", err);
      }
    } catch {
      setError("Gagal memuat data T-BOS.");
    } finally {
      setLoading(false);
    }
  }, [selectedFacilitatorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setCreateTeamError("Nama tim tidak boleh kosong.");
      return;
    }

    setCreatingTeam(true);
    setCreateTeamError("");
    const { createTeam } = await import("@/modules/tbos/api-client");
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

  const handleAssignFacilitator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilitatorId) {
      setAssignError("Pilih fasilitator terlebih dahulu.");
      return;
    }

    setAssigning(true);
    setAssignError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/tbos/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          facilitatorId: selectedFacilitatorId,
          missionId: selectedMissionId,
        }),
      });
      const dataRes = await res.json();

      if (dataRes.success) {
        setAssignSuccess(true);
        setTimeout(() => {
          setAssignSuccess(false);
          setShowAssignModal(false);
        }, 1200);
      } else {
        setAssignError(dataRes.error || "Gagal menugaskan fasilitator.");
      }
    } catch (err: any) {
      setAssignError(err.message || "Gagal menghubungi server.");
    } finally {
      setAssigning(false);
    }
  };

  const SUB_TABS = [
    { key: "overview" as const, label: "Overview", icon: <BarChart3 size={14} /> },
    { key: "summary" as const, label: "Executive Summary", icon: <FileText size={14} /> },
    { key: "radar" as const, label: "Radar Chart", icon: <RadarIcon size={14} /> },
    { key: "heatmap" as const, label: "Heatmap", icon: <Grid3x3 size={14} /> },
    { key: "ranking" as const, label: "Ranking", icon: <Trophy size={14} /> },
    { key: "batch" as const, label: "Batch", icon: <Users size={14} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B2C6B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
        {error}
      </div>
    );
  }

  if (!dashboardData || dashboardData.teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 max-w-lg mx-auto">
        <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900 mb-1">Belum Ada Data Tim T-BOS</h3>
        <p className="text-xs text-slate-500 mb-5">
          Mulai dengan menambahkan tim dan batch peserta untuk diobservasi oleh fasilitator.
        </p>
        <button
          onClick={() => setShowAddTeamModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B2C6B] text-white text-xs font-semibold hover:bg-[#071B3D] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Tim Pertama
        </button>

        {showAddTeamModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
              <h3 className="text-base font-bold text-slate-900 mb-4">Tambah Tim Baru</h3>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                {createTeamError && <p className="text-xs text-red-600">{createTeamError}</p>}
                {createTeamSuccess && <p className="text-xs text-green-600">Tim berhasil ditambahkan!</p>}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tim</label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Contoh: Team Alpha"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Batch 1", "Batch 2"] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setNewTeamBatch(b)}
                        className={`py-2 text-xs font-semibold rounded-lg border ${
                          newTeamBatch === b ? "bg-[#0B2C6B] text-white" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTeamModal(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTeam}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-[#0B2C6B] text-white"
                  >
                    {creatingTeam ? "Menyimpan..." : "Simpan Tim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const summary = dashboardData.executiveSummary;

  return (
    <div className="space-y-6">
      {/* Quick Action Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">T-BOS Intelligence</span>
          <span className="text-xs text-slate-400">• Real-time sync</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#0B2C6B] to-[#C79A3C] text-white text-xs font-semibold shadow-xs hover:brightness-110 transition-all"
          >
            <UsersRound className="w-3.5 h-3.5" />
            Tugaskan Fasilitator
          </button>
          <button
            onClick={() => setShowAddTeamModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2C6B] text-white text-xs font-semibold hover:bg-[#071B3D] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Tim
          </button>
          <Link
            href="/fasilitator/tbos/observations"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-[#0B2C6B] text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D9A441]" />
            Kelola Observasi
          </Link>
          <Link
            href="/fasilitator/tbos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Form Input
          </Link>
          <Link
            href="/peserta/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
          >
            Dashboard Peserta
          </Link>
        </div>
      </div>

      {/* Assign Facilitator Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tugaskan Fasilitator ke T-BOS</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pilih fasilitator untuk memimpin observasi 8 dimensi perilaku.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignFacilitator} className="space-y-4">
              {assignError && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{assignError}</p>}
              {assignSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-semibold">Fasilitator berhasil ditugaskan!</p>}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Fasilitator</label>
                {facilitatorsList.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Belum ada akun dengan role fasilitator. Tambahkan di menu Manajemen User & Role terlebih dahulu.
                  </p>
                ) : (
                  <select
                    value={selectedFacilitatorId}
                    onChange={(e) => setSelectedFacilitatorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-800"
                  >
                    {facilitatorsList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.full_name || f.email} ({f.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Mission Observasi</label>
                <select
                  value={selectedMissionId}
                  onChange={(e) => setSelectedMissionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-800"
                >
                  <option value="mission-1">Mission 1: Visi Bersama &amp; Mindset Bertumbuh</option>
                  <option value="mission-2">Mission 2: Komunikasi Terbuka &amp; Koordinasi Lintas Fungsi</option>
                  <option value="mission-3">Mission 3: Pemecahan Masalah &amp; Pengambilan Keputusan</option>
                  <option value="mission-4">Mission 4: Eksekusi Tangkas &amp; Resiliensi Tim</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={assigning || facilitatorsList.length === 0}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-gradient-to-br from-[#0B2C6B] to-[#C79A3C] text-white disabled:opacity-50 hover:brightness-110 transition-all"
                >
                  {assigning ? "Menugaskan..." : "Simpan Penugasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Tim</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{dashboardData.teams.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Observasi</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">{summary?.totalObservations || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dimensi Terobservasi</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {dashboardData.batchComparisons.filter((b) => b.batch1Avg !== null || b.batch2Avg !== null).length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rata-rata Skor</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {summary?.topStrengths.length
              ? (summary.topStrengths.reduce((a, b) => a + (b.score || 0), 0) / summary.topStrengths.length).toFixed(1)
              : "-"}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              subTab === tab.key
                ? "border-[#0B2C6B] text-[#0B2C6B]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div>
        {subTab === "overview" && <TbosOverviewTab data={dashboardData} />}
        {subTab === "summary" && <TbosExecutiveSummary data={dashboardData} />}
        {subTab === "radar" && <TbosRadarChart teams={dashboardData.teams} />}
        {subTab === "heatmap" && <TbosHeatmap teams={dashboardData.teams} />}
        {subTab === "ranking" && <TbosRanking teams={dashboardData.teams} />}
        {subTab === "batch" && <TbosBatchComparison comparisons={dashboardData.batchComparisons} />}
      </div>

      {/* Modal Dialog */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left">
            <h3 className="text-base font-bold text-slate-900 mb-4">Tambah Tim Baru</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              {createTeamError && <p className="text-xs text-red-600">{createTeamError}</p>}
              {createTeamSuccess && <p className="text-xs text-green-600">Tim berhasil ditambahkan!</p>}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tim</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Contoh: Team Alpha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0B2C6B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Program</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Batch 1", "Batch 2"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setNewTeamBatch(b)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        newTeamBatch === b
                          ? "bg-[#0B2C6B] text-white border-[#0B2C6B]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-[#0B2C6B] text-white hover:bg-[#071B3D] transition-colors"
                >
                  {creatingTeam ? "Menyimpan..." : "Simpan Tim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TbosOverviewTab({ data }: { data: TbosDashboardData }) {
  const { executiveSummary: summary } = data;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">3 Kekuatan Utama</h3>
          </div>
          <div className="space-y-2">
            {summary.topStrengths.length === 0 && <p className="text-xs text-slate-400">Belum ada data.</p>}
            {summary.topStrengths.map((dim, i) => (
              <div key={dim.dimensionCode} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-xs font-medium text-slate-700">{dim.dimensionName}</span>
                <span className="text-xs font-bold text-[#0B2C6B]">{dim.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">3 Area Pengembangan</h3>
          </div>
          <div className="space-y-2">
            {summary.developmentAreas.length === 0 && <p className="text-xs text-slate-400">Belum ada data.</p>}
            {summary.developmentAreas.map((dim, i) => (
              <div key={dim.dimensionCode} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-xs font-medium text-slate-700">{dim.dimensionName}</span>
                <span className="text-xs font-bold text-[#0B2C6B]">{dim.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Ringkasan Tim</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="text-left py-2 px-3 font-semibold uppercase">Tim</th>
                <th className="text-left py-2 px-3 font-semibold uppercase">Batch</th>
                <th className="text-center py-2 px-3 font-semibold uppercase">Skor</th>
                <th className="text-left py-2 px-3 font-semibold uppercase">Kekuatan</th>
                <th className="text-left py-2 px-3 font-semibold uppercase">Area Dev.</th>
                <th className="text-center py-2 px-3 font-semibold uppercase">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((team) => (
                <tr key={team.teamId} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-[#0B2C6B]">{team.teamName}</td>
                  <td className="py-2.5 px-3 text-slate-500">{team.batch}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[#0B2C6B]">{team.overallTeamScore !== null ? team.overallTeamScore.toFixed(1) : "-"}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{team.strongestDimension?.dimensionName || "-"}</td>
                  <td className="py-2.5 px-3 text-slate-600">{team.weakestDimension?.dimensionName || "-"}</td>
                  <td className="py-2.5 px-3 text-center font-medium text-slate-500">{team.totalObservations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
