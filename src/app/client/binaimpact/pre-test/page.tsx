import { AppShell } from "@/components/app-shell";
import { ClientAuthGate } from "@/components/client-auth-gate";

export default function BinaImpactPreTestPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="BinaImpact" title="Pre-Test">
        <section className="rounded-[20px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <p className="text-sm font-semibold text-[#0B2C6B]">Form pre-test disiapkan untuk tahap berikutnya.</p>
        </section>
      </AppShell>
    </ClientAuthGate>
  );
}
