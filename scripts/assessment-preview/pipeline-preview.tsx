import { useState } from "react";
import { PipelinePanel } from "@/app/admin/_components/pipeline-panel";
import { funnelPreviewData } from "@/test/fixtures/sales-funnel";

export function PipelinePreview() {
  const [data, setData] = useState(funnelPreviewData);
  return (
    <div className="admin-ui-v2 min-h-screen bg-[#F5F7FB] text-slate-900">
      <div className="border-b border-slate-200 bg-white px-5 py-3 text-xs text-slate-500">
        Preview lokal · Data contoh · Perubahan hanya simulasi, tanpa API atau
        email
      </div>
      <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-8">
        <header>
          <p className="text-xs text-slate-500">Akuisisi & Penjualan</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Pipeline penjualan
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Lihat setiap peluang, tentukan prioritas, dan dorong percakapan
            menjadi kerja sama.
          </p>
        </header>
        <PipelinePanel
          data={data}
          onRefresh={async () => {}}
          onAction={async (_url, init) => {
            const input = JSON.parse(String(init?.body));
            await new Promise((resolve) => setTimeout(resolve, 600));
            setData((current) => ({
              ...current,
              pipelineLeads: current.pipelineLeads?.map((lead) =>
                lead.id !== input.leadId
                  ? lead
                  : {
                      ...lead,
                      opportunityStage: input.stage,
                      opportunityOwner: input.owner,
                      nextAction: input.nextAction,
                      nextActionDueAt: input.nextActionDueAt,
                      opportunityValue: input.opportunityValue,
                      leadTimeZone: input.leadTimeZone,
                      lostReason: input.lostReason,
                      outreachPaused: input.outreachPaused,
                      outreachPauseReason: input.outreachPauseReason,
                    },
              ),
            }));
            return { success: true };
          }}
        />
      </main>
    </div>
  );
}
