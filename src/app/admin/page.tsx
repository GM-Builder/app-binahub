"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, RefreshCw } from "lucide-react";
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

  const handleTabChange = (tab: (typeof tabs)[number]) => {
    if (tab === "T-BOS") {
      router.push("/admin/tbos");
      return;
    }
    setActiveTab(tab);
  };

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
                  onClick={() => handleTabChange(tab)}
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
                  onChange={(event) => handleTabChange(event.target.value as (typeof tabs)[number])}
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
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
