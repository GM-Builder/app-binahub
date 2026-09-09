"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/lib/supabase";
import { AcquisitionControlPanel } from "./acquisition-control-panel";
import { AssessmentPanel } from "./assessment-panel";
import { ClientDeliveryPanel } from "./client-delivery-panel";
import { ContactsPanel } from "./contacts-panel";
import { InquiriesPanel } from "./inquiries-panel";
import { MeetingsPanel } from "./meetings-panel";
import { OperationsControlPanel } from "./operations-control-panel";
import { Overview } from "./overview";
import { PipelinePanel } from "./pipeline-panel";
import { SmartCenterPanel } from "./smart-center-panel";
import { DashboardSkeleton } from "./shared";
import { TAB_META } from "../_lib/constants";
import type { DashboardData } from "../_lib/types";

const DASHBOARD_CACHE_MAX_AGE_MS = 45_000;
let dashboardCache: { userId: string; data: DashboardData; storedAt: number } | null = null;
let dashboardRequest: { userId: string; promise: Promise<DashboardData> } | null = null;

async function requestDashboard(userId: string, token: string) {
  if (dashboardRequest?.userId === userId) return dashboardRequest.promise;
  const promise = fetch("/api/admin/dashboard", { headers: { Authorization: `Bearer ${token}` } })
    .then(async (response) => {
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        const failure = new Error(json?.error || "Gagal memuat data admin.") as Error & { status?: number };
        failure.status = response.status;
        throw failure;
      }
      dashboardCache = { userId, data: json as DashboardData, storedAt: Date.now() };
      return json as DashboardData;
    })
    .finally(() => {
      if (dashboardRequest?.promise === promise) dashboardRequest = null;
    });
  dashboardRequest = { userId, promise };
  return promise;
}

export type AdminWorkspaceSection =
  | "Overview"
  | "Acquisition Control"
  | "Sales Pipeline"
  | "Assessment"
  | "Meeting"
  | "Kontak & Leads"
  | "Inquiry Masuk"
  | "Client & Delivery"
  | "Operations Control"
  | "Automation Center";

export function AdminWorkspace({ section }: { section: AdminWorkspaceSection }) {
  return <AdminAuthGate><AdminWorkspaceContent section={section} /></AdminAuthGate>;
}

function AdminWorkspaceContent({ section }: { section: AdminWorkspaceSection }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [assessmentCategory, setAssessmentCategory] = useState("Semua");
  const [assessmentEmployeeRange, setAssessmentEmployeeRange] = useState("Semua");
  const [assessmentMinScore, setAssessmentMinScore] = useState("0");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (force = false) => {
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        router.replace("/login");
        return;
      }

      const cached = dashboardCache?.userId === session.user.id ? dashboardCache : null;
      if (cached) {
        setData(cached.data);
        setLoading(false);
        if (!force && Date.now() - cached.storedAt < DASHBOARD_CACHE_MAX_AGE_MS) return;
      } else {
        setLoading(true);
      }

      const json = await requestDashboard(session.user.id, session.access_token);
      setData(json);
    } catch (fetchError) {
      const status = (fetchError as Error & { status?: number }).status;
      if (status === 401 || status === 403) {
        dashboardCache = null;
        setData(null);
        router.replace(status === 401 ? "/login" : "/access-denied");
      }
      setError(fetchError instanceof Error ? fetchError.message : "Gagal memuat data admin.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void Promise.resolve().then(() => fetchDashboard(false)); }, [fetchDashboard]);

  const refreshDashboard = useCallback(async () => {
    await fetchDashboard(true);
  }, [fetchDashboard]);

  const filteredAssessments = useMemo(() => {
    const search = query.toLocaleLowerCase("id-ID");
    return (data?.assessments || []).filter((item) =>
      [item.name, item.email, item.company, item.role, item.category, item.assessmentStatus, item.proposalStatus]
        .join(" ").toLocaleLowerCase("id-ID").includes(search) &&
      (assessmentCategory === "Semua" || item.category === assessmentCategory) &&
      (assessmentEmployeeRange === "Semua" || item.employees === assessmentEmployeeRange) &&
      item.overallScore >= Number(assessmentMinScore || 0)
    );
  }, [assessmentCategory, assessmentEmployeeRange, assessmentMinScore, data, query]);

  const adminRequest = useCallback(async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.replace("/login");
      throw new Error("Sesi admin tidak ditemukan.");
    }
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(url, {
      ...init,
      headers,
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.success) throw new Error(json?.error || "Aksi admin gagal.");
    return json;
  }, [router]);

  const meta = TAB_META[section];
  const refreshAction = (
    <button type="button" onClick={() => void refreshDashboard()} disabled={loading} aria-label={loading ? "Sedang memperbarui data" : "Perbarui data"} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-blue-950 disabled:cursor-wait disabled:opacity-60">
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
      <span className="hidden sm:inline">Perbarui</span>
    </button>
  );

  return (
    <AdminShell eyebrow={meta.eyebrow} title={meta.title} description={meta.description} actions={refreshAction}>
      {error && <div role="alert" aria-live="assertive" className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800"><p className="font-semibold">Data belum dapat dimuat</p><p className="mt-1 text-xs leading-5 text-red-700">{error}</p></div>}
      {loading || !data ? <DashboardSkeleton /> : (
        <div className="admin-workspace-content">
          {section === "Overview" && <Overview data={data} />}
          {section === "Acquisition Control" && <AcquisitionControlPanel onAction={adminRequest} />}
          {section === "Sales Pipeline" && <PipelinePanel data={data} onAction={adminRequest} onRefresh={refreshDashboard} />}
          {section === "Client & Delivery" && <ClientDeliveryPanel data={data} onAction={adminRequest} onRefresh={refreshDashboard} />}
          {section === "Operations Control" && <OperationsControlPanel onAction={adminRequest} />}
          {section === "Automation Center" && <SmartCenterPanel data={data} onAction={adminRequest} onRefresh={refreshDashboard} />}
          {section === "Assessment" && <AssessmentPanel data={data} records={filteredAssessments} query={query} setQuery={setQuery} category={assessmentCategory} setCategory={setAssessmentCategory} employeeRange={assessmentEmployeeRange} setEmployeeRange={setAssessmentEmployeeRange} minScore={assessmentMinScore} setMinScore={setAssessmentMinScore} expandedId={expandedId} setExpandedId={setExpandedId} onAction={adminRequest} onRefresh={refreshDashboard} />}
          {section === "Meeting" && <MeetingsPanel bookings={data.calendarBookings || []} />}
          {section === "Kontak & Leads" && <ContactsPanel contacts={data.contacts} onAction={adminRequest} onRefresh={refreshDashboard} />}
          {section === "Inquiry Masuk" && <InquiriesPanel inquiries={data.inquiries} onAction={adminRequest} onRefresh={refreshDashboard} />}
        </div>
      )}
    </AdminShell>
  );
}
