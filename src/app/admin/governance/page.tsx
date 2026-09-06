"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Gauge,
  RadioTower,
  Rocket,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/lib/supabase";
import { LaunchControlPanel } from "../_components/launch-control-panel";
import { OperationalAssurancePanel } from "../_components/operational-assurance-panel";
import { PilotCertificationPanel } from "../_components/pilot-certification-panel";
import { PilotOperationsPanel } from "../_components/pilot-operations-panel";
import { PilotReadinessPanel } from "../_components/pilot-readiness-panel";

type GovernanceSection = "readiness" | "uat" | "assurance" | "certification" | "operations";

type GovernanceTab = {
  id: GovernanceSection;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

const GOVERNANCE_TABS: GovernanceTab[] = [
  {
    id: "readiness",
    label: "Kesiapan",
    shortLabel: "1",
    description: "Baca konfigurasi, evidence, dan blocker sebelum mengambil keputusan.",
    icon: Gauge,
  },
  {
    id: "uat",
    label: "Human UAT",
    shortLabel: "2",
    description: "Pastikan seluruh skenario wajib memiliki hasil dan bukti manusia.",
    icon: ClipboardCheck,
  },
  {
    id: "assurance",
    label: "Assurance",
    shortLabel: "3",
    description: "Tinjau monitoring, incident, dan rekomendasi go atau no-go.",
    icon: ShieldCheck,
  },
  {
    id: "certification",
    label: "Rehearsal & Acceptance",
    shortLabel: "4",
    description: "Catat delapan langkah rehearsal dan keputusan acceptance.",
    icon: RadioTower,
  },
  {
    id: "operations",
    label: "Release & Runtime",
    shortLabel: "5",
    description: "Jadwalkan change window, batasi workflow, dan siapkan kill switch.",
    icon: Rocket,
  },
];

export default function AdminGovernancePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<GovernanceSection>("readiness");

  const adminRequest = useCallback(async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      router.replace("/login");
      throw new Error("Sesi administrator tidak ditemukan.");
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      if (response.status === 401 || response.status === 403) {
        router.replace(response.status === 401 ? "/login" : "/access-denied");
      }
      throw new Error(payload?.error || "Control plane belum dapat diakses.");
    }
    return payload;
  }, [router]);

  const activeTab = GOVERNANCE_TABS.find((tab) => tab.id === activeSection) || GOVERNANCE_TABS[0];

  const moveTabFocus = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? GOVERNANCE_TABS.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + GOVERNANCE_TABS.length) % GOVERNANCE_TABS.length;
    const nextTab = GOVERNANCE_TABS[nextIndex];
    setActiveSection(nextTab.id);
    window.requestAnimationFrame(() => document.getElementById(`governance-tab-${nextTab.id}`)?.focus());
  };

  return (
    <AdminShell
      eyebrow="Tata Kelola Operasional"
      title="Kesiapan & Pilot"
      description="Selesaikan gate secara berurutan sebelum membuka change window. Halaman ini mencatat keputusan dan batas operasi; backend tetap menolak aktivasi yang belum memenuhi syarat."
    >
      <section className="mb-6 border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" aria-label="Status keamanan control plane">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Control plane tidak menjalankan workflow dengan sendirinya</p>
            <p className="mt-1 text-xs leading-5 text-amber-900/75">
              Ikuti urutan 1–5. Requested mode hanya menjadi efektif ketika release, window, approval, monitoring, dan environment guard seluruhnya sesuai.
            </p>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200" role="tablist" aria-label="Tahapan kesiapan pilot">
        <div className="flex min-w-max gap-1 overflow-x-auto pb-px">
          {GOVERNANCE_TABS.map((tab, index) => {
            const Icon = tab.icon;
            const selected = tab.id === activeSection;
            return (
              <button
                key={tab.id}
                id={`governance-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`governance-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveSection(tab.id)}
                onKeyDown={(event) => moveTabFocus(event, index)}
                className={`group relative flex min-h-14 items-center gap-3 border-b-2 px-4 text-left transition ${selected ? "border-[#0B2C6B] text-[#0B2C6B]" : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"}`}
              >
                <span className={`grid h-7 w-7 place-items-center border text-[10px] font-bold ${selected ? "border-[#0B2C6B] bg-[#0B2C6B] text-white" : "border-slate-300 bg-white text-slate-500"}`}>{tab.shortLabel}</span>
                <span className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4" aria-hidden="true" />{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-xs leading-5 text-slate-600"><strong className="text-slate-900">Tahap {activeTab.shortLabel}:</strong> {activeTab.description}</p>
      </div>

      <section
        id={`governance-panel-${activeSection}`}
        role="tabpanel"
        aria-labelledby={`governance-tab-${activeSection}`}
      >
        {activeSection === "readiness" && <LaunchControlPanel onAction={adminRequest} />}
        {activeSection === "uat" && <PilotReadinessPanel onAction={adminRequest} />}
        {activeSection === "assurance" && <OperationalAssurancePanel onAction={adminRequest} />}
        {activeSection === "certification" && <PilotCertificationPanel onAction={adminRequest} />}
        {activeSection === "operations" && <PilotOperationsPanel onAction={adminRequest} />}
      </section>
    </AdminShell>
  );
}
