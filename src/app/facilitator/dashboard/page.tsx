import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { ServiceMegaGrid } from "@/components/service-mega-grid";
import { StatCard } from "@/components/stat-card";
import { facilitatorReviews } from "@/lib/demo-data";

export default function FacilitatorDashboardPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Facilitator Workspace" title="Review Fasilitator">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Tim" value="3" detail="Tim Masmindo yang dinilai." />
        <StatCard label="Game" value="1" detail="Minefield Strategy." />
        <StatCard label="Skor Tertinggi" value="19" detail="Total sementara Tim A." />
      </div>

      <section className="mt-8 grid gap-4">
        {facilitatorReviews.map((review) => (
          <article key={`${review.client}-${review.module}`} className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">{review.module}</p>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#0B2C6B]">{review.client}</h2>
                <p className="mt-1 text-sm text-[#4A4C54]/70">{review.model}</p>
              </div>
              <span className="rounded-[10px] bg-[#F5F7FA] px-3 py-1 text-sm font-semibold text-[#0B2C6B]">
                {review.status}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] sm:p-6">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">
            Service Launcher
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">
            Layanan BinaHub
          </h2>
        </div>
        <ServiceMegaGrid />
      </section>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
