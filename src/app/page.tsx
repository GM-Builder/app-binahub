import Image from "next/image";

import { LoginRoleDialog } from "@/components/login-role-dialog";
import { ServiceMegaGrid } from "@/components/service-mega-grid";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#4A4C54]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[24px] border border-[#0B2C6B]/10 bg-white px-5 py-4 shadow-[0_18px_60px_-48px_rgba(11,44,107,0.5)] sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/full-logo.png"
            alt="BinaHub"
            width={152}
            height={42}
            className="h-10 w-auto object-contain"
            priority
          />
          <LoginRoleDialog />
        </header>

        <section className="flex flex-1 items-center py-8">
          <div className="w-full rounded-[32px] border border-[#0B2C6B]/10 bg-white px-5 py-8 shadow-[0_28px_90px_-58px_rgba(11,44,107,0.52)] sm:px-8 lg:px-10">
            <div className="mb-8 flex items-end justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#D9A441]">
                  app.binahub.id
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#0B2C6B] sm:text-4xl">
                  Home
                </h1>
              </div>
            </div>
            <ServiceMegaGrid />
          </div>
        </section>
      </div>
    </main>
  );
}
