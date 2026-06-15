import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { TeamStatisticsDashboard } from "@/components/team-statistics-dashboard";

export default function FacilitatorStatisticsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Fasilitator" title="Statistik Tim">
        <TeamStatisticsDashboard />
      </AppShell>
    </FacilitatorAuthGate>
  );
}
