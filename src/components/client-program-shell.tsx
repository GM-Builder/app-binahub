"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, LogOut, MapPin } from "lucide-react";
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
  variant = "landing",
  taskTitle = "Aktivitas program",
}: {
  program: ClientProgramSummary;
  participantName: string;
  children: React.ReactNode;
  variant?: "landing" | "task";
  taskTitle?: string;
}) {
  const router = useRouter();
  const schedule = dateRange(program);
  const initials = participantName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace(programAccessPath(program.id));
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Image src="/full-logo.png" alt="BinaHub" width={150} height={42} className="h-9 w-auto object-contain" priority />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">{initials}</span>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-44 truncate text-xs font-bold text-slate-900">{participantName}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Peserta</p>
              </div>
            </div>
            <button type="button" onClick={() => void logout()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700" aria-label="Keluar dari program">
              <LogOut className="h-4 w-4" /> <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {variant === "landing" ? <section className="relative overflow-hidden rounded-2xl bg-blue-900 p-5 text-white shadow-xl shadow-blue-950/10 sm:p-7">
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
        </section> : <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <Link href="/client/program" className="inline-flex min-h-9 items-center gap-2 rounded-xl text-xs font-bold text-blue-900"><ArrowLeft className="h-4 w-4" /> Kembali ke program</Link>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">{program.title}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{taskTitle}</h1>
        </section>}

        <div className="mt-5 sm:mt-7">{children}</div>
      </main>
    </div>
  );
}
