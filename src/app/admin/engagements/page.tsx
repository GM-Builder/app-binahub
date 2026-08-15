"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Settings, ArrowUpRight, KeyRound, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import { useEngagements } from "@/hooks/use-transformation-data";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { StatusPill, ProgressBar, ConfirmDialog } from "@/components/ui";
import { AppShell } from "@/components/app-shell";

function AdminEngagementsPageContent() {
  const { engagements, loading } = useEngagements();
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; title: string } | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const grouped = useMemo(() => {
    const groups: Record<string, typeof engagements> = { active: [], draft: [], completed: [], archived: [] };
    engagements.forEach((e) => {
      if (e.status === "draft") groups.draft.push(e);
      else if (e.status === "active" || e.status === "in_progress" || e.status === "review") groups.active.push(e);
      else if (e.status === "completed") groups.completed.push(e);
      else groups.archived.push(e);
    });
    return groups;
  }, [engagements]);

  const deleteProgram = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      const response = await fetch(`/api/engagements/${target.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        toast.error(result.error || "Program tidak dapat dihapus.", result.canArchive ? {
          action: { label: "Arsipkan", onClick: () => setArchiveTarget(target) },
        } : undefined);
        return;
      }
      toast.success("Program berhasil dihapus.");
      window.location.reload();
    } catch {
      toast.error("Gagal menghubungi server. Coba lagi.");
    } finally {
      setDeleting(false);
    }
  };

  const archiveProgram = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const response = await fetch(`/api/engagements/${archiveTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        toast.error(result.error || "Gagal mengarsipkan program.");
        return;
      }
      toast.success("Program diarsipkan");
      window.location.reload();
    } catch {
      toast.error("Gagal mengarsipkan program.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Organization Core</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Program</h1>
        </div>
        <Link
          href="/admin/engagements/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]"
        >
          <Plus size={18} /> Buat Program
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat...</div>
      ) : (
        <>
          {["active", "draft", "completed", "archived"].map((group) => {
            const items = grouped[group];
            if (!items.length) return null;
            return (
              <section key={group} className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-[#0B2C6B] capitalize">{group} ({items.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((e) => (
                    <div key={e.id} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#D9A441]">{e.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                          <h3 className="mt-1 truncate text-base font-semibold text-[#0B2C6B]">{e.title}</h3>
                        </div>
                        <StatusPill status={e.status} />
                      </div>
                      <div className="mt-4">
                        <ProgressBar value={e.progress ?? 0} />
                        <p className="mt-1 text-xs text-[#4A4C54]/50">{e.progress ?? 0}% selesai</p>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div><dt className="text-[#4A4C54]/50">Peserta</dt><dd className="font-semibold text-[#0B2C6B]">{e.participants ?? 0}</dd></div>
                        <div><dt className="text-[#4A4C54]/50">Dibuat</dt><dd className="font-semibold text-[#0B2C6B]">{new Date(e.created_at).toLocaleDateString("id-ID")}</dd></div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`/admin/engagements/access-codes?engagement_id=${e.id}&title=${encodeURIComponent(e.title)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9A441]/30 bg-[#D9A441]/10 px-3 py-1.5 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/20">
                          <KeyRound size={12} /> Kode
                        </Link>
                        <Link href={`/admin/engagements/manage?id=${e.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2C6B]/15 px-3 py-1.5 text-xs font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]">
                          <Settings size={12} /> Kelola
                        </Link>
                        {e.status !== "archived" && (
                          <button type="button" onClick={() => setArchiveTarget({ id: e.id, title: e.title })} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100">
                            <Archive size={12} /> Arsipkan
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleteTarget({ id: e.id, title: e.title })} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                          <Trash2 size={12} /> Hapus
                        </button>
                        <div className="flex-1" />
                        <Link href={`/client/engagements/detail?id=${e.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A]">
                          Lihat <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          {engagements.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-sm text-[#4A4C54]/60">Belum ada program. Buat program pertama.</p>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={archiveProgram}
        title="Arsipkan Program?"
        description={archiveTarget ? `Program "${archiveTarget.title}" tidak lagi muncul di daftar aktif. Data observasi tetap dipertahankan.` : undefined}
        confirmLabel={archiving ? "Mengarsipkan..." : "Ya, Arsipkan"}
        variant="warning"
        loading={archiving}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        onConfirm={deleteProgram}
        title="Hapus Program?"
        description={deleteTarget ? `Program "${deleteTarget.title}" beserta tim kosongnya akan dihapus permanen. Program yang memiliki histori observasi atau LEP harus diarsipkan.` : undefined}
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

export default function AdminEngagementsPage() {
  return (
    <AdminAuthGate>
      <AppShell role="admin" title="Program Engagements" eyebrow="Organization Core">
        <AdminEngagementsPageContent />
      </AppShell>
    </AdminAuthGate>
  );
}
