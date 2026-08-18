"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Gamepad2, Users } from "lucide-react";

export type ClientProgramModule = { key: "lep" | "tbos"; enabled: boolean; clientAvailable: boolean };

export function ClientProgramModules({ modules }: { modules: ClientProgramModule[] }) {
  const enabledModules = modules.filter((module) => module.enabled);

  if (enabledModules.length === 0) {
    return <div className="rounded-2xl border border-dashed border-[#0B2C6B]/15 bg-white p-8 text-center text-sm text-[#4A4C54]/60">Belum ada modul yang tersedia untuk program ini.</div>;
  }

  return (
    <section aria-labelledby="program-modules-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Aktivitas Anda</p>
          <h2 id="program-modules-title" className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#0B2C6B]">Modul program</h2>
        </div>
        <p className="text-xs text-[#4A4C54]/55">Hanya modul yang dipilih penyelenggara yang ditampilkan.</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {enabledModules.map((module) => module.key === "lep" ? (
          <Link key={module.key} href="/client/lep" className="group relative overflow-hidden rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(11,44,107,0.45)] transition hover:-translate-y-0.5 hover:border-[#D9A441]/70 hover:shadow-[0_24px_60px_-40px_rgba(11,44,107,0.55)] sm:p-6">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-9 -translate-y-9 rounded-full bg-[#FFF4D8]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2C6B] text-[#F3CE7A]"><ClipboardCheck className="h-5 w-5" /></span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Tersedia</span>
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Lembar Evaluasi Program</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">LEP</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">Berikan evaluasi program dan penilaian pemateri setelah rangkaian kegiatan selesai.</p>
              <span className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-bold text-white">Buka evaluasi <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ) : (
          <article key={module.key} className="relative overflow-hidden rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(11,44,107,0.45)] sm:p-6">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-9 -translate-y-9 rounded-full bg-[#EAF0F8]" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0F8] text-[#0B2C6B]"><Gamepad2 className="h-5 w-5" /></span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700"><Users className="h-3 w-3" /> Terpandu</span>
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Team Behavioral Observation System</p>
              <h3 className="mt-1 text-lg font-bold text-[#0B2C6B]">Game T-BOS</h3>
              <p className="mt-2 text-sm leading-6 text-[#4A4C54]/68">Ikuti permainan dan rotasi pos sesuai arahan fasilitator. Observasi serta penilaian dilakukan oleh fasilitator di setiap pos.</p>
              <div className="mt-5 rounded-xl bg-[#F5F7FA] p-3 text-xs leading-5 text-[#4A4C54]/65">Tidak ada formulir yang perlu Anda isi pada modul ini.</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
