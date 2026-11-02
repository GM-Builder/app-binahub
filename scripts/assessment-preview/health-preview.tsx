import { useCallback, useState } from "react";
import { ObservabilityPanel } from "@/app/admin/_components/observability-panel";
import { syntheticServiceHealth } from "@/test/fixtures/service-health";

export function HealthPreview() {
  const [state, setState] = useState("healthy");
  const action = useCallback(
    async (url: string) => {
      if (state === "offline") throw new Error("Synthetic offline");
      if (url.endsWith("service-health")) return syntheticServiceHealth(state);
      return { success: true, openCount: 0, events: [] };
    },
    [state],
  );
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-blue-950">
          Monitoring operasional
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Preview lokal · Data sintetis · Tanpa koneksi API, database, AI atau
          email
        </p>
      </header>
      <label className="mb-6 block text-sm text-slate-700">
        Skenario uji{" "}
        <select
          className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
          value={state}
          onChange={(event) => setState(event.target.value)}
        >
          <option value="healthy">Normal</option>
          <option value="attention">Antrean terlambat</option>
          <option value="never_seen">Worker belum tercatat</option>
          <option value="setup_required">SQL belum tersedia</option>
          <option value="offline">Tidak terhubung</option>
        </select>
      </label>
      <ObservabilityPanel key={state} onAction={action} />
    </main>
  );
}
