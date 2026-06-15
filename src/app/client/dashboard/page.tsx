import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { ServiceMegaGrid } from "@/components/service-mega-grid";
import { StatCard } from "@/components/stat-card";

export default function ClientDashboardPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Client Workspace" title="Dashboard Klien">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Layanan" value="8" detail="Pilih layanan dari launcher." />
          <StatCard label="Assessment" value="1/2" detail="Lanjutkan assessment yang tersedia." />
          <StatCard label="Laporan" value="1" detail="Lihat hasil dan dokumen Anda." />
        </div>

        <section className="mt-8 rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">
                Service Launcher
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">
                Layanan BinaHub
              </h2>
            </div>
            <p className="text-sm text-[#4A4C54]/64">Pilih icon layanan.</p>
          </div>
          <ServiceMegaGrid />
        </section>
      </AppShell>
    </ClientAuthGate>
  );
}
