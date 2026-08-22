"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Gamepad2, Info, Layers3 } from "lucide-react";
import { EmptyState, ModuleStatusBadge } from "@/components/ui";

export type ClientProgramModule = { key: "lep" | "tbos"; enabled: boolean; clientAvailable: boolean; completed?: boolean };

export function ClientProgramModules({ modules }: { modules: ClientProgramModule[] }) {
  const enabledModules = modules.filter((module) => module.enabled);

  if (enabledModules.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Layers3} title="Belum ada modul yang tersedia untuk program ini." description="Penyelenggara belum mengaktifkan modul untuk program ini." /></div>;
  }

  return (
    <section aria-labelledby="program-modules-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Aktivitas Anda</p>
          <h2 id="program-modules-title" className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#0B2C6B]">Modul program</h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">{enabledModules.filter((module) => module.clientAvailable && !module.completed).length} dari {enabledModules.length} modul perlu diisi</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {enabledModules.map((module) => module.key === "lep" ? (
          <Link key={module.key} href="/client/lep" className="group relative overflow-hidden rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(11,44,107,0.45)] transition hover:-translate-y-0.5 hover:border-[#D9A441]/70 hover:shadow-[0_24px_60px_-40px_rgba(11,44,107,0.55)] sm:p-6">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-9 -translate-y-9 rounded-full bg-[#FFF4D8]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><ClipboardCheck className="h-5 w-5" /></span>
                <ModuleStatusBadge tone="available" label={module.completed ? "Selesai" : "Tersedia"} />
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Lembar Evaluasi Program</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">LEP</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">Berikan evaluasi program dan penilaian pemateri setelah rangkaian kegiatan selesai.</p>
              <span className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-900 px-4 text-xs font-bold text-white">{module.completed ? "Lihat status evaluasi" : "Buka evaluasi"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ) : (
          <article key={module.key} className="relative overflow-hidden rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(11,44,107,0.45)] sm:p-6">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-9 -translate-y-9 rounded-full bg-[#EAF0F8]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0F8] text-[#0B2C6B]"><Gamepad2 className="h-5 w-5" /></span>
                <ModuleStatusBadge tone="guided" />
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Team Behavioral Observation System</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">Game T-BOS</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">Ikuti permainan dan rotasi pos sesuai arahan fasilitator. Observasi serta penilaian dilakukan oleh fasilitator di setiap pos.</p>
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-900" /> Tidak ada formulir yang perlu Anda isi pada modul ini.</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
