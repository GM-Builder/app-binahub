import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { ParticipantDashboard } from "@/components/participant-dashboard";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ClientDashboardPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" eyebrow="Ruang Peserta" title="Dashboard">
        <ErrorBoundary>
          <ParticipantDashboard />
        </ErrorBoundary>
      </AppShell>
    </ClientAuthGate>
  );
}
