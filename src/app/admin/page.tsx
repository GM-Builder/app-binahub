"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AssociatePanel } from "./_components/associate-panel";
import { AssessmentPanel } from "./_components/assessment-panel";
import { ContactsPanel } from "./_components/contacts-panel";
import { InquiriesPanel } from "./_components/inquiries-panel";
import { Overview } from "./_components/overview";
import { SmartCenterPanel } from "./_components/smart-center-panel";
import { DashboardSkeleton, ModuleHero, NotificationBadge } from "./_components/shared";
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

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      router.replace("/admin/login");
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
        router.replace("/admin/login");
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
    router.replace("/admin/login");
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
      router.replace("/admin/login");
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
              Role Preview
            </p>
            <a
              href="/client/dashboard"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Client View
            </a>
            <a
              href="/facilitator/dashboard"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Facilitator View
            </a>
            <a
              href="/facilitator/statistics"
              className="flex rounded-[12px] px-4 py-2 text-sm text-white/62 hover:bg-white/[0.06] hover:text-white"
            >
              Team Statistics
            </a>
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
                {activeTab === "Associate Network" && (
                  <AssociatePanel
                    mode="coach"
                    coaches={data.coaches}
                    onAction={adminRequest}
                    onRefresh={fetchDashboard}
                  />
                )}
                {activeTab === "Project Assignment" && (
                  <AssociatePanel
                    mode="hrm"
                    coaches={data.coaches}
                    assignments={data.coachAssignments || []}
                    projects={data.projects || []}
                    projectAssignments={data.projectAssignments || []}
                    sessions={data.coachSessions || []}
                    availability={data.coachAvailability || []}
                    documents={data.coachDocuments || []}
                    onAction={adminRequest}
                    onRefresh={fetchDashboard}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
