import { useState } from "react";
import { ClientDeliveryPanel } from "@/app/admin/_components/client-delivery-panel";
import { PipelineDrawer } from "@/app/admin/_components/pipeline-drawer";
import { clientJourneyFixture } from "@/test/fixtures/client-journey";

const fixture = clientJourneyFixture();
const noAction = async () => { throw new Error("Preview baca-saja; tidak ada data yang dikirim."); };
const noRefresh = async () => {};

export function ClientJourneyPreview() {
  const [showOpportunity, setShowOpportunity] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const data = handoff ? { ...fixture.data, clientAccounts: [], deliveryProjects: [] } : fixture.data;
  return (
    <div className="admin-ui-v2 min-h-screen bg-[#F5F7FB] p-4 text-slate-900 sm:p-8">
      <main className="mx-auto max-w-7xl space-y-5">
        <h1 className="text-xl font-semibold">Perjalanan klien · preview sintetis</h1>
        <p className="text-sm text-slate-600">Data contoh lokal. Tidak ada koneksi ke API, database, atau email produksi.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="min-h-11 rounded-lg bg-[#0B2C6B] px-4 text-sm text-white" onClick={() => setShowOpportunity(true)}>Buka detail peluang</button>
          <button type="button" className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm" onClick={() => setHandoff((value) => !value)}>{handoff ? "Lihat akun klien" : "Coba serah terima"}</button>
        </div>
        <ClientDeliveryPanel key={String(handoff)} data={data} onAction={noAction} onRefresh={noRefresh} />
        {showOpportunity && <PipelineDrawer lead={fixture.lead} data={fixture.data} onClose={() => setShowOpportunity(false)} onAction={noAction} onRefresh={noRefresh} onSaved={() => {}} />}
      </main>
    </div>
  );
}
