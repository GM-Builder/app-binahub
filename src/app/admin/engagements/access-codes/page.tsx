"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, KeyRound, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { Breadcrumb } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/lib/supabase";

interface AccessCode {
  id: string;
  access_code: string;
  participant_id: string | null;
  participant_name: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

function AccessCodesContent() {
  const searchParams = useSearchParams();
  const engagementId = searchParams.get("engagement_id") || "";
  const engagementTitle = searchParams.get("title") || "Program";
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchCodes = async () => {
    if (!engagementId) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setLoading(false); return; }

      const res = await fetch(`/api/engagements/access-codes?engagement_id=${engagementId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setCodes(json.accessCodes || []);
    } catch {
      toast.error("Gagal mengambil kode akses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCodes(); }, [engagementId]);

  const handleCopy = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ${name} disalin`);
  };

  const handleCopyAll = () => {
    const all = codes.map((c) => `${c.participant_name || "Peserta"}: ${c.access_code}`).join("\n");
    navigator.clipboard.writeText(all);
    toast.success("Semua kode disalin");
  };

  if (!engagementId) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-lg py-16 text-center">
          <p className="text-sm text-[#4A4C54]/60">Pilih program terlebih dahulu.</p>
          <Link href="/admin/engagements" className="mt-4 inline-block text-sm font-semibold text-[#0B2C6B] hover:text-[#D9A441]">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/engagements" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2C6B]/70 hover:text-[#D9A441]">
        <ArrowLeft size={16} /> Kembali ke Program
      </Link>

      <div className="mx-auto mt-6 max-w-2xl">
        <Breadcrumb
          items={[
            { label: "Program", href: "/admin/engagements" },
            { label: engagementTitle },
            { label: "Kode Akses" },
          ]}
        />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0B2C6B]">Kode Akses Klien</h1>
            <p className="mt-1 text-sm text-[#4A4C54]/60">Bagikan kode ini kepada klien untuk login.</p>
          </div>
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={codes.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA] disabled:opacity-40"
          >
            <Copy size={14} /> Salin Semua
          </button>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 size={24} className="animate-spin text-[#D9A441]" />
          </div>
        ) : codes.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-[#0B2C6B]/15 py-12 text-center">
            <KeyRound size={32} className="mx-auto text-[#4A4C54]/30" />
            <p className="mt-3 text-sm text-[#4A4C54]/60">Belum ada kode akses untuk program ini.</p>
            <p className="mt-1 text-xs text-[#4A4C54]/40">Kode akan dibuat otomatis saat program dibuat dengan peserta.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {codes.map((ac) => (
              <div
                key={ac.id}
                className={`flex items-center justify-between rounded-xl border p-4 transition ${
                  ac.is_active ? "border-[#0B2C6B]/10 bg-white" : "border-[#4A4C54]/10 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D9A441]/10">
                    <KeyRound size={18} className="text-[#D9A441]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0B2C6B]">{ac.participant_name || "Peserta"}</p>
                    <p className="font-mono text-lg font-bold tracking-widest text-[#0B2C6B]">{ac.access_code}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#4A4C54]/40">
                      <span>Dibuat: {new Date(ac.created_at).toLocaleDateString("id-ID")}</span>
                      {ac.last_used_at && <span>Dipakai: {new Date(ac.last_used_at).toLocaleDateString("id-ID")}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ac.is_active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                    {ac.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(ac.access_code, ac.participant_name || "Peserta")}
                    className="rounded-lg p-2 text-[#4A4C54]/40 hover:bg-[#0B2C6B]/5 hover:text-[#0B2C6B]"
                    title="Salin kode"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccessCodesPage() {
  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <Suspense fallback={<div className="flex min-h-[400px] items-center justify-center"><Loader2 size={24} className="animate-spin text-[#D9A441]" /></div>}>
          <AccessCodesContent />
        </Suspense>
      </ErrorBoundary>
    </AdminAuthGate>
  );
}
