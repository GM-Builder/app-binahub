"use client";

import Image from "next/image";
import { CalendarDays, LogOut, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { programAccessPath } from "@/lib/program-access-link";

export interface ClientProgramSummary {
  id: string;
  code: string;
  title: string;
  companyName: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
}

function dateRange(program: ClientProgramSummary) {
  const format = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (program.startDate && program.endDate) return `${format(program.startDate)} – ${format(program.endDate)}`;
  if (program.startDate) return `Mulai ${format(program.startDate)}`;
  if (program.endDate) return `Sampai ${format(program.endDate)}`;
  return null;
}

export function ClientProgramShell({
  program,
  participantName,
  children,
}: {
  program: ClientProgramSummary;
  participantName: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const schedule = dateRange(program);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace(programAccessPath(program.id));
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0B2C6B]">
      <header className="border-b border-[#0B2C6B]/8 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Image src="/full-logo.png" alt="BinaHub" width={150} height={42} className="h-9 w-auto object-contain" priority />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4A4C54]/50">Peserta</p>
              <p className="max-w-44 truncate text-xs font-bold text-[#0B2C6B]">{participantName}</p>
            </div>
            <button type="button" onClick={() => void logout()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#0B2C6B]/10 px-3 text-xs font-bold text-[#0B2C6B] hover:bg-red-50 hover:text-red-700" aria-label="Keluar dari program">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-2xl bg-[#0B2C6B] p-5 text-white shadow-[0_24px_70px_-44px_rgba(11,44,107,0.7)] sm:p-7">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#17447F]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F3CE7A]">{program.code}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/75">{program.companyName}</span>
            </div>
            <h1 className="mt-4 max-w-3xl text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{program.title}</h1>
            <p className="mt-2 text-sm text-white/70">Halo, {participantName}. Semua aktivitas program Anda tersedia di halaman ini.</p>
            {(program.location || schedule) && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
                {program.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#F3CE7A]" /> {program.location}</span>}
                {schedule && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#F3CE7A]" /> {schedule}</span>}
              </div>
            )}
          </div>
        </section>

        <div className="mt-5 sm:mt-7">{children}</div>
      </main>
    </div>
  );
}
