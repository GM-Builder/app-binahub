"use client";

import { AppShell } from "@/components/app-shell";
import { PesertaAuthGate } from "@/components/peserta-auth-gate";
import { PesertaLepContent } from "./_components/peserta-lep-content";

export default function PesertaLepPage() {
  return (
    <PesertaAuthGate>
      <AppShell role="peserta" title="Evaluasi Program" eyebrow="Lembar Evaluasi Program">
        <PesertaLepContent />
      </AppShell>
    </PesertaAuthGate>
  );
}
