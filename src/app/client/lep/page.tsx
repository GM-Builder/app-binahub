"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientAuthGate } from "@/components/client-auth-gate";
import { AppShell } from "@/components/app-shell";
import { PesertaLepContent } from "@/app/peserta/lep/page";

export default function ClientLepPage() {
  return (
    <ClientAuthGate>
      <AppShell role="client" title="Evaluasi Program" eyebrow="Lembar Evaluasi Program">
        <Link href="/client/program" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#0B2C6B]">
          <ArrowLeft className="h-4 w-4" /> Kembali ke program
        </Link>
        <PesertaLepContent accessPath="/client/access" />
      </AppShell>
    </ClientAuthGate>
  );
}
