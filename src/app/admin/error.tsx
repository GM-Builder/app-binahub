"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { captureError } from "@/lib/error-tracking";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { captureError(error); }, [error]);
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section role="alert" aria-labelledby="admin-error-title" className="w-full max-w-lg border border-red-200 bg-white p-7 shadow-sm sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">Terjadi kendala</p>
        <h1 id="admin-error-title" className="mt-2 text-xl font-bold text-slate-900">Halaman tidak dapat dimuat</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Data Anda tidak berubah. Coba muat ulang halaman ini; bila masalah berulang, catat waktu kejadian untuk tim teknis.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <Link href="/admin/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Kembali ke dashboard</Link>
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white hover:bg-[#071B3D]"><RefreshCw size={16} aria-hidden="true" /> Coba lagi</button>
        </div>
      </section>
    </main>
  );
}
