"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, RefreshCw, Loader2, Radar as RadarIcon, Grid3x3, Trophy, BarChart3, Users, FileText, Download, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AssessmentPanel } from "./_components/assessment-panel";
import { ContactsPanel } from "./_components/contacts-panel";
import { InquiriesPanel } from "./_components/inquiries-panel";
import { Overview } from "./_components/overview";
import { SmartCenterPanel } from "./_components/smart-center-panel";
import { DashboardSkeleton, ModuleHero, NotificationBadge } from "./_components/shared";
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
      <style>{`
        #global-navbar, footer { display: none !important; }
        body { background: #F5F7FA; }
        .admin-root button,
        .admin-root a[href] {
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease, color 180ms ease, opacity 180ms ease;
        }
        .admin-root button:not(:disabled):hover,
        .admin-root a[href]:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -22px rgba(11, 44, 107, 0.65);
        }
        .admin-root button:not(:disabled):active,
        .admin-root a[href]:active {
          transform: translateY(0) scale(0.98);
        }
        .admin-root button:disabled {
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `}</style>
      <main className="admin-root min-h-screen bg-[#F5F7FA] text-[#0B2C6B]">
        <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-black/[0.06] bg-[#071B3D] px-5 py-6 text-white lg:block">
          <div className="mb-10">
            <div className="relative flex h-11 w-40 items-center rounded-[10px] bg-white px-3">
              <Image src="/full-logo.png" alt="BinaHub" fill className="object-contain object-left px-3 py-2" />
            </div>
            <h1 className="mt-3 text-2xl font-light tracking-[-0.04em]">Intelligence Hub</h1>
          </div>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-sm transition ${
                  activeTab === tab
                    ? "bg-white text-[#0B2C6B]"
                    : "text-white/62 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab}
                  {tab === "Assessment" && newAssessmentCount > 0 && <NotificationBadge count={newAssessmentCount} />}
                  {tab === "Inquiry Masuk" && newInquiryCount > 0 && <NotificationBadge count={newInquiryCount} />}
                </span>
                {activeTab === tab && <ArrowRight size={15} className="text-[#D9A441]" />}
              </button>
            ))}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/34">
              Sistem Transformasi
            </p>
            <Link
              href="/admin/engagements"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Program
            </Link>
            <Link
              href="/admin/rbac"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Matriks Izin
            </Link>
            <p className="mb-2 mt-4 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/34">
              Pratinjau Peran
            </p>
            <Link
              href="/client/dashboard"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Tampilan Peserta
            </Link>
            <Link
              href="/facilitator/dashboard"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Tampilan Fasilitator
            </Link>
            <Link
              href="/facilitator/statistics"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Statistik Tim
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="absolute bottom-6 left-5 right-5 flex items-center justify-center gap-2 rounded-[12px] border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/58 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} /> Keluar
          </button>
        </aside>

        <section className="lg:pl-72">
          <header className="sticky top-0 z-20 border-b border-black/[0.06] bg-[#F5F7FA]/95 px-5 py-4 backdrop-blur-sm md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#D9A441]">
                  {activeMeta.eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-light tracking-[-0.04em] md:text-3xl">
                  {activeMeta.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#0B2C6B]/58">{activeMeta.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={activeTab}
                  onChange={(event) => setActiveTab(event.target.value as (typeof tabs)[number])}
                  className="rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm lg:hidden"
                >
                  {tabs.map((tab) => (
                    <option key={tab}>{tab}</option>
                  ))}
                </select>
                <button
                  onClick={fetchDashboard}
                  className="flex items-center gap-2 rounded-[10px] border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0B2C6B]"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
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
                {activeTab !== "Overview" && (
                  <div className="mb-6">
                    <ModuleHero
                      eyebrow="Workspace context"
                      title={activeMeta.title}
                      description={activeMeta.description}
                      stats={focusStats}
                    />
                  </div>
                )}
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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/tbos/dashboard");
      const data = await res.json();
      if (data.success) {
        const observations: TbosObservation[] = (data.observations || []).map((obs: any) => ({
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
          scores: (obs.scores || []).map((s: any) => ({
            dimensionCode: s.dimensionCode,
            dimensionName: s.dimensionName,
            levelValue: s.levelValue,
            levelLabel: s.levelLabel,
          })),
        }));
        const teams = (data.teams || []).map((t: any) => ({ id: t.id, name: t.name, batch: t.batch }));
        const computed = generateDashboardData(teams, observations);
        setDashboardData(computed);
      } else {
        setError(data.error || "Gagal memuat data T-BOS.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const SUB_TABS = [
    { key: "overview" as const, label: "Overview", icon: <BarChart3 size={14} /> },
    { key: "summary" as const, label: "Executive Summary", icon: <FileText size={14} /> },
    { key: "radar" as const, label: "Radar", icon: <RadarIcon size={14} /> },
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
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!dashboardData || dashboardData.teams.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#4A4C54]">Belum ada data observasi T-BOS. Buat tim dan assign fasilitator untuk mulai.</p>
      </div>
    );
  }

  const summary = dashboardData.executiveSummary;

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
          <p className="text-xs text-[#4A4C54] mb-1">Total Tim</p>
          <p className="text-2xl font-bold text-[#0B2C6B]">{dashboardData.teams.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
          <p className="text-xs text-[#4A4C54] mb-1">Total Observasi</p>
          <p className="text-2xl font-bold text-[#0B2C6B]">{summary?.totalObservations || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
          <p className="text-xs text-[#4A4C54] mb-1">Dimensi Terobservasi</p>
          <p className="text-2xl font-bold text-[#0B2C6B]">
            {dashboardData.batchComparisons.filter((b) => b.batch1Avg !== null || b.batch2Avg !== null).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-black/[0.04]">
          <p className="text-xs text-[#4A4C54] mb-1">Rata-rata Skor</p>
          <p className="text-2xl font-bold text-[#0B2C6B]">
            {summary?.topStrengths.length
              ? (summary.topStrengths.reduce((a, b) => a + (b.score || 0), 0) / summary.topStrengths.length).toFixed(1)
              : "-"}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-black/[0.06] overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              subTab === tab.key
                ? "border-[#0B2C6B] text-[#0B2C6B]"
                : "border-transparent text-[#4A4C54] hover:text-[#0B2C6B]"
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
    </div>
  );
}

function TbosOverviewTab({ data }: { data: TbosDashboardData }) {
  const { executiveSummary: summary } = data;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-[#0B2C6B]">3 Kekuatan Utama</h3>
          </div>
          <div className="space-y-2">
            {summary.topStrengths.length === 0 && <p className="text-xs text-[#4A4C54]">Belum ada data.</p>}
            {summary.topStrengths.map((dim, i) => (
              <div key={dim.dimensionCode} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm text-[#4A4C54]">{dim.dimensionName}</span>
                <span className="text-sm font-bold text-[#0B2C6B]">{dim.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-[#0B2C6B]">3 Area Pengembangan</h3>
          </div>
          <div className="space-y-2">
            {summary.developmentAreas.length === 0 && <p className="text-xs text-[#4A4C54]">Belum ada data.</p>}
            {summary.developmentAreas.map((dim, i) => (
              <div key={dim.dimensionCode} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm text-[#4A4C54]">{dim.dimensionName}</span>
                <span className="text-sm font-bold text-[#0B2C6B]">{dim.score?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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
                    <span className="font-bold text-[#0B2C6B]">{team.overallTeamScore !== null ? team.overallTeamScore.toFixed(1) : "-"}</span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#4A4C54]">{team.strongestDimension?.dimensionName || "-"}</td>
                  <td className="py-2.5 px-3 text-xs text-[#4A4C54]">{team.weakestDimension?.dimensionName || "-"}</td>
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
