import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";

export default function FacilitatorBinaImpactPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="BinaImpact" title="BinaImpact Fasilitator">
        <section className="grid gap-4 md:grid-cols-2">
          <a
            href="/facilitator/scoring"
            className="rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] transition hover:-translate-y-1 hover:border-[#D9A441]/70"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Penilaian</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0B2C6B]">Scoring Tim</h2>
          </a>
          <a
            href="/facilitator/statistics"
            className="rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)] transition hover:-translate-y-1 hover:border-[#D9A441]/70"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Dashboard</p>
            <h2 className="mt-2 text-xl font-semibold text-[#0B2C6B]">Statistik Tim</h2>
          </a>
        </section>
      </AppShell>
    </FacilitatorAuthGate>
  );
}
