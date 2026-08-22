"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2, Copy, KeyRound, Loader2, RotateCcw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { Breadcrumb, ConfirmDialog, EmptyState, StatusPill } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/lib/supabase";

interface AccessCode {
  id: string;
  participant_id: string | null;
  participant_name: string;
  code_hint: string | null;
  is_active: boolean;
  created_at: string;
  issued_at: string | null;
  rotated_at: string | null;
  last_used_at: string | null;
  identity_review_required: boolean;
  identity_review_note: string | null;
}

type MutationAction = "regenerate" | "deactivate" | "resolve_review";

function AccessCodesContent() {
  const searchParams = useSearchParams();
  const engagementId = searchParams.get("engagement_id") || "";
  const engagementTitle = searchParams.get("title") || "Program";
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutationTarget, setMutationTarget] = useState<{ access: AccessCode; action: MutationAction } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [generated, setGenerated] = useState<{ name: string; code: string } | null>(null);

  const fetchCodes = useCallback(async () => {
    if (!engagementId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi admin tidak tersedia.");
      const response = await fetch(`/api/engagements/access-codes?engagement_id=${encodeURIComponent(engagementId)}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Gagal mengambil kode peserta.");
      setCodes(body.accessCodes || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil kode peserta.");
    } finally {
      setLoading(false);
    }
  }, [engagementId]);

  useEffect(() => { void Promise.resolve().then(fetchCodes); }, [fetchCodes]);

  const mutateAccess = async (access: AccessCode, action: MutationAction) => {
    setMutating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi admin tidak tersedia.");
      const response = await fetch("/api/engagements/access-codes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId, accessId: access.id, action }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error || "Perubahan akses gagal.");
      if (action === "regenerate" && body.participantCode) {
        setGenerated({ name: access.participant_name, code: body.participantCode });
        toast.success("Kode peserta baru berhasil dibuat.");
      } else if (action === "deactivate") toast.success("Akses peserta dinonaktifkan.");
      else toast.success("Pemeriksaan nama ditandai selesai.");
      await fetchCodes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Perubahan akses gagal.");
    } finally {
      setMutating(false);
      setMutationTarget(null);
    }
  };

  if (!engagementId) return <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={KeyRound} title="Program belum dipilih" description="Buka halaman Kelola Program lalu pilih Kode Peserta." /></div>;

  return <div>
    <Breadcrumb items={[{ label: "Program", href: "/admin/programs" }, { label: engagementTitle, href: `/admin/engagements/manage?id=${engagementId}` }, { label: "Kode Peserta" }]} />
    <Link href={`/admin/engagements/manage?id=${engagementId}`} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-bold text-blue-900"><ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Program</Link>

    <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">Keamanan Peserta</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Kode Peserta</h2><p className="mt-1 text-sm text-slate-600">Kode asli hanya tampil saat dibuat atau diregenerasi. Database hanya menyimpan hash.</p></div>
      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-900">{codes.length} peserta</span>
    </div>

    {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Memuat peserta...</div> : codes.length === 0 ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white"><EmptyState icon={KeyRound} title="Belum ada peserta terdaftar" description="Peserta akan muncul setelah mendaftar melalui kode program." /></div> : <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {codes.map((access) => <article key={access.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${access.identity_review_required ? "border-amber-300" : "border-slate-200"}`}>
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{access.participant_name}</h3><p className="mt-1 font-mono text-xs font-bold tracking-[0.12em] text-slate-500">Kode ••••-{access.code_hint || "BELUM"}</p></div><StatusPill status={access.is_active ? "active" : "locked"} /></div>
        {access.identity_review_required && <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-bold">Periksa kemungkinan nama duplikat</p><p>{access.identity_review_note || "Nama peserta mirip dengan data yang sudah ada."}</p><button type="button" onClick={() => void mutateAccess(access, "resolve_review")} disabled={mutating} className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 font-bold text-amber-800"><CheckCircle2 className="h-3.5 w-3.5" /> Tandai sudah diperiksa</button></div></div>}
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs"><div><dt className="text-slate-500">Dibuat</dt><dd className="mt-0.5 font-semibold text-slate-800">{new Date(access.created_at).toLocaleDateString("id-ID")}</dd></div><div><dt className="text-slate-500">Terakhir masuk</dt><dd className="mt-0.5 font-semibold text-slate-800">{access.last_used_at ? new Date(access.last_used_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Belum pernah"}</dd></div></dl>
        <div className="mt-4 flex gap-2"><button type="button" onClick={() => setMutationTarget({ access, action: "regenerate" })} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-900 px-3 text-xs font-bold text-white"><RotateCcw className="h-4 w-4" /> {access.code_hint ? "Buat ulang kode" : "Buat kode"}</button>{access.is_active && <button type="button" onClick={() => setMutationTarget({ access, action: "deactivate" })} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" aria-label={`Nonaktifkan ${access.participant_name}`}><Ban className="h-4 w-4" /></button>}</div>
      </article>)}
    </div>}

    <ConfirmDialog open={Boolean(mutationTarget)} onClose={() => { if (!mutating) setMutationTarget(null); }} onConfirm={() => { if (mutationTarget) void mutateAccess(mutationTarget.access, mutationTarget.action); }} title={mutationTarget?.action === "deactivate" ? "Nonaktifkan Akses Peserta?" : "Buat Ulang Kode Peserta?"} description={mutationTarget?.action === "deactivate" ? "Peserta langsung kehilangan akses. Data dan hasil evaluasi tetap tersimpan." : "Kode lama dan sesi lama langsung tidak berlaku. Kode baru hanya ditampilkan satu kali."} confirmLabel={mutationTarget?.action === "deactivate" ? "Ya, Nonaktifkan" : "Buat Kode Baru"} variant={mutationTarget?.action === "deactivate" ? "danger" : "warning"} loading={mutating} />

    {generated && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="generated-code-title"><section className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"><button type="button" onClick={() => setGenerated(null)} aria-label="Tutup" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><KeyRound className="h-5 w-5" /></span><h2 id="generated-code-title" className="mt-4 text-xl font-bold text-slate-900">Kode baru untuk {generated.name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Salin dan berikan langsung kepada peserta. Setelah dialog ditutup, kode tidak dapat dilihat kembali.</p><div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center font-mono text-2xl font-black tracking-[0.12em] text-slate-900">{generated.code}</div><button type="button" onClick={() => { void navigator.clipboard.writeText(generated.code); toast.success("Kode peserta disalin."); }} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-900 text-sm font-bold text-white"><Copy className="h-4 w-4" /> Salin kode peserta</button></section></div>}
  </div>;
}

export default function AccessCodesPage() {
  return <AdminAuthGate><AppShell role="admin" title="Kode Peserta" eyebrow="Keamanan Program"><ErrorBoundary><Suspense fallback={<div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-900" /></div>}><AccessCodesContent /></Suspense></ErrorBoundary></AppShell></AdminAuthGate>;
}
