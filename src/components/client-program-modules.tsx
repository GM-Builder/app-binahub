"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Check, ClipboardCheck, FileQuestion, Gamepad2, Info, Layers3, LockKeyhole } from "lucide-react";
import { EmptyState, ModuleStatusBadge } from "@/components/ui";
import { PROGRAM_MODULE_META, type ProgramModuleKey } from "@/lib/program-modules";

export type ClientProgramModule = { key: ProgramModuleKey; enabled: boolean; clientAvailable: boolean; completed?: boolean };

const JOURNEY_ORDER: Record<ProgramModuleKey, number> = {
  binainsight: 0,
  pre_test: 1,
  tbos: 2,
  post_test: 3,
  lep: 4,
};

export function ClientProgramModules({ modules }: { modules: ClientProgramModule[] }) {
  const enabledModules = modules.filter((module) => module.enabled).sort((left, right) => JOURNEY_ORDER[left.key] - JOURNEY_ORDER[right.key]);
  const pendingActions = enabledModules.filter((module) => module.clientAvailable && !module.completed).length;

  if (enabledModules.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Layers3} title="Belum ada modul yang tersedia untuk program ini." description="Penyelenggara belum mengaktifkan modul untuk program ini." /></div>;
  }

  return (
    <section aria-labelledby="program-modules-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#80560F]">Aktivitas Anda</p>
          <h2 id="program-modules-title" className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#0B2C6B]">Modul program</h2>
        </div>
        <p className="text-xs font-semibold text-slate-500">{pendingActions ? `${pendingActions} aktivitas perlu Anda selesaikan` : "Tidak ada aktivitas mandiri yang tertunda"}</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-xs" aria-label="Perjalanan program">
        <ol className="flex min-w-max items-start" aria-label="Tahapan program">
          {enabledModules.map((module, index) => {
            const completed = Boolean(module.completed);
            const available = module.clientAvailable || module.key === "tbos";
            return (
              <li key={module.key} className="flex min-w-44 flex-1 items-start last:min-w-36">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${completed ? "bg-emerald-600 text-white" : available ? "bg-[#0B2C6B] text-white" : "bg-slate-100 text-slate-400"}`}>
                      {completed ? <Check size={15} aria-hidden="true" /> : available ? index + 1 : <LockKeyhole size={13} aria-hidden="true" />}
                    </span>
                    {index < enabledModules.length - 1 && <span className={`h-px flex-1 ${completed ? "bg-emerald-300" : "bg-slate-200"}`} aria-hidden="true" />}
                  </div>
                  <p className="mt-2 pr-4 text-xs font-bold text-slate-800">{PROGRAM_MODULE_META[module.key].label}</p>
                  <p className={`mt-0.5 text-[10px] font-semibold ${completed ? "text-emerald-700" : available ? "text-[#0B2C6B]" : "text-slate-400"}`}>{completed ? "Selesai" : available ? module.key === "tbos" ? "Dipandu fasilitator" : "Tersedia" : "Belum dibuka"}</p>
                </div>
              </li>
            );
          })}
        </ol>
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
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#80560F]">Lembar Evaluasi Program</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">LEP</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">Berikan evaluasi program dan penilaian pemateri setelah rangkaian kegiatan selesai.</p>
              <span className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-900 px-4 text-xs font-bold text-white">{module.completed ? "Lihat status evaluasi" : "Buka evaluasi"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ) : module.key === "binainsight" ? (
          <Link key={module.key} href="/client/program/test?kind=binainsight" prefetch className="group relative overflow-hidden rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(11,44,107,0.45)] transition hover:-translate-y-0.5 hover:border-[#D9A441]/70 hover:shadow-[0_24px_60px_-40px_rgba(11,44,107,0.55)] sm:p-6">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-9 -translate-y-9 rounded-full bg-[#EAF0F8]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><BarChart3 className="h-5 w-5" /></span>
                <ModuleStatusBadge tone="available" label={module.completed ? "Selesai" : "Tersedia"} />
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#80560F]">Diagnostik Performa 7 Dimensi</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">BinaInsight</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">Isi diagnostik yang disusun khusus untuk program ini. Hasil tetap terhubung ke identitas peserta dan program.</p>
              <span className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-900 px-4 text-xs font-bold text-white">{module.completed ? "Isi ulang assessment" : "Mulai assessment"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ) : module.key === "pre_test" || module.key === "post_test" ? (
          <Link key={module.key} href={`/client/program/test?kind=${module.key}`} className="group relative overflow-hidden rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(11,44,107,0.45)] transition hover:-translate-y-0.5 hover:border-[#D9A441]/70 hover:shadow-[0_24px_60px_-40px_rgba(11,44,107,0.55)] sm:p-6">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-9 -translate-y-9 rounded-full bg-[#FFF4D8]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><FileQuestion className="h-5 w-5" /></span>
                <ModuleStatusBadge tone="available" label={module.completed ? "Selesai" : "Tersedia"} />
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#80560F]">Pengukuran pembelajaran</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">{module.key === "pre_test" ? "Pre-test" : "Post-test"}</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">{module.key === "pre_test" ? "Ukur pemahaman awal sebelum rangkaian program dimulai." : "Ukur perkembangan setelah rangkaian program diselesaikan."}</p>
              <span className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-900 px-4 text-xs font-bold text-white">{module.completed ? "Lihat hasil" : "Mulai test"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
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
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#80560F]">Team Behavioral Observation System</p>
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
