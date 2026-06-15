import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck, UserRound, UsersRound } from "lucide-react";

import { roleHome } from "@/lib/roles";

const roleOptions = [
  {
    role: "client" as const,
    label: "Client",
    icon: <UserRound size={22} />,
    note: "Assessment dan laporan",
  },
  {
    role: "admin" as const,
    label: "Admin",
    icon: <ShieldCheck size={22} />,
    note: "Operasional platform",
  },
  {
    role: "facilitator" as const,
    label: "Fasilitator",
    icon: <UsersRound size={22} />,
    note: "Review dan penilaian",
  },
];

export function RolePickerCard() {
  return (
    <section className="w-full max-w-3xl overflow-hidden rounded-[20px] border border-[#0B2C6B]/10 bg-white shadow-[0_24px_80px_-48px_rgba(11,44,107,0.52)]">
      <div className="border-b border-[#0B2C6B]/8 px-6 py-6 sm:px-8">
        <Image
          src="/full-logo.png"
          alt="BinaHub"
          width={150}
          height={42}
          className="h-10 w-auto object-contain"
          priority
        />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">
              app.binahub.id
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">
              Pilih akses
            </h1>
          </div>
          <Link
            href="/insight"
            className="inline-flex w-fit items-center gap-2 rounded-[12px] bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#071A33]"
          >
            BinaInsight Publik
            <ClipboardCheck size={16} />
          </Link>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
        {roleOptions.map((option) => (
          <Link
            key={option.role}
            href={roleHome[option.role]}
            className="group flex min-h-40 flex-col justify-between rounded-[16px] border border-[#0B2C6B]/10 bg-[#F5F7FA] p-5 text-[#0B2C6B] transition hover:border-[#D9A441]/70 hover:bg-white hover:shadow-[0_18px_52px_-42px_rgba(11,44,107,0.55)]"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white text-[#D9A441] shadow-sm">
                {option.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em]">
                {option.label}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#4A4C54]/68">{option.note}</p>
            </div>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Masuk
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      <div className="border-t border-[#0B2C6B]/8 px-6 py-4 text-xs leading-5 text-[#4A4C54]/62 sm:px-8">
        Pilih role untuk masuk ke workspace.
      </div>
    </section>
  );
}
