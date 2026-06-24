import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { TransformationWorkspace } from "@/components/transformation-workspace";

export default function FacilitatorEngagementsPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell role="facilitator" eyebrow="Layanan" title="Program Saya">
        <TransformationWorkspace mode="facilitator-engagements" audience="facilitator" />
      </AppShell>
    </FacilitatorAuthGate>
  );
}
