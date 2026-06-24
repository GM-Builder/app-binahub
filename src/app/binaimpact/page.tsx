"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function BinaImpactEntryPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    let timeout: NodeJS.Timeout;

    async function checkAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!alive) return;

        const role = session?.user?.app_metadata?.role || session?.user?.user_metadata?.role;

        if (role === "client") {
          router.replace("/client/binaimpact");
          return;
        }

        if (role === "facilitator" || role === "admin") {
          router.replace("/facilitator/binaimpact");
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      }

      if (alive) setChecking(false);
    }

    timeout = setTimeout(() => {
      if (alive) setChecking(false);
    }, 5000);

    void checkAccess();

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0B2C6B] border-t-transparent"></div>
          <p>Memeriksa akses...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-6 py-12 text-[#0B2C6B]">
      <section className="w-full max-w-2xl rounded-[24px] border border-[#0B2C6B]/10 bg-white p-7 shadow-[0_28px_90px_-58px_rgba(11,44,107,0.52)]">
        <Image src="/full-logo.png" alt="BinaHub" width={150} height={42} className="h-10 w-auto object-contain" />
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">
          BinaImpact
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Pilih akses</h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <AccessCard
            href="/client/access?next=/client/binaimpact"
            icon={<UserRound size={24} />}
            label="Client"
          />
          <AccessCard
            href="/facilitator/login?next=/facilitator/binaimpact"
            icon={<UsersRound size={24} />}
            label="Fasilitator"
          />
        </div>
      </section>
    </main>
  );
}

function AccessCard({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col items-center justify-center rounded-[18px] border border-[#0B2C6B]/10 bg-[#F5F7FA] p-5 text-center text-[#0B2C6B] transition hover:-translate-y-1 hover:border-[#D9A441]/70 hover:bg-white hover:shadow-[0_18px_52px_-42px_rgba(11,44,107,0.55)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-[#D9A441] shadow-sm transition group-hover:bg-[#0B2C6B] group-hover:text-white">
        {icon}
      </div>
      <span className="mt-4 text-base font-semibold tracking-[-0.02em]">{label}</span>
      <ArrowRight size={16} className="mt-3 opacity-60 transition group-hover:translate-x-1" />
    </Link>
  );
}
