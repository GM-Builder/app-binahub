"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, UserRound, UsersRound, X } from "lucide-react";
import { useState } from "react";

const roleLinks = [
  { label: "Client", href: "/client/access", icon: <UserRound size={24} /> },
  { label: "Admin", href: "/admin/login", icon: <ShieldCheck size={24} /> },
  { label: "Fasilitator", href: "/facilitator/login", icon: <UsersRound size={24} /> },
];

export function LoginRoleDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_42px_-28px_rgba(11,44,107,0.72)] transition hover:bg-[#071A33]"
      >
        Login
        <ArrowRight size={16} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            aria-label="Tutup pilihan login"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#0B2C6B]/45 backdrop-blur-sm"
          />
          <section className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/50 bg-white shadow-[0_32px_90px_-44px_rgba(11,44,107,0.72)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#0B2C6B]/8 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">
                  Login sebagai
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#0B2C6B]">
                  Pilih role
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F7FA] text-[#0B2C6B] transition hover:bg-[#0B2C6B] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
              {roleLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-36 flex-col items-center justify-center rounded-[18px] border border-[#0B2C6B]/10 bg-[#F5F7FA] p-5 text-center text-[#0B2C6B] transition hover:-translate-y-1 hover:border-[#D9A441]/70 hover:bg-white hover:shadow-[0_18px_52px_-42px_rgba(11,44,107,0.55)]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-[#D9A441] shadow-sm transition group-hover:bg-[#0B2C6B] group-hover:text-white">
                    {item.icon}
                  </div>
                  <span className="mt-4 text-base font-semibold tracking-[-0.02em]">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
