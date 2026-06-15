import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { FacilitatorScoringForm } from "@/components/facilitator-scoring-form";

export default function FacilitatorScoringPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Fasilitator" title="Penilaian Tim">
        <FacilitatorScoringForm />
      </AppShell>
    </FacilitatorAuthGate>
  );
}
