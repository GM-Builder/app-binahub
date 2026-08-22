"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, CalendarDays, MapPin, Plus, Send, Settings, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useEngagements } from "@/hooks/use-transformation-data";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { AppShell } from "@/components/app-shell";
import { Breadcrumb, ConfirmDialog, EmptyState, FilterTabs, ModuleChip, SearchInput, StatusPill } from "@/components/ui";
import { ProgramShareCard } from "@/components/program-share-card";
import type { Engagement } from "@/lib/transformation-types";

type ModuleKey = "tbos" | "lep";

interface ProgramModuleRow {
  program_id: string;
  module_key: ModuleKey;
  enabled: boolean;
}

function AdminProgramsPageContent() {
  const { engagements, loading, error } = useEngagements();
  const [modulesByProgram, setModulesByProgram] = useState<Record<string, ProgramModuleRow[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState<Engagement | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    void fetch("/api/program-modules")
      .then((response) => response.json())
      .then((result) => {
        if (!result.success) return;
        const grouped: Record<string, ProgramModuleRow[]> = {};
        for (const row of result.modules || []) {
          grouped[row.program_id] = grouped[row.program_id] || [];
          grouped[row.program_id].push(row);
        }
        setModulesByProgram(grouped);
      })
      .catch(() => {});
  }, []);

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    return engagements.filter((program) => {
      const matchesStatus = statusFilter === "active"
        ? !["completed", "archived"].includes(program.status)
        : program.status === statusFilter;
      const matchesSearch = !query || [program.title, program.code, program.organization?.name]
        .some((value) => value?.toLocaleLowerCase("id-ID").includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [engagements, search, statusFilter]);

  const deleteProgram = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/engagements/${deleteTarget.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Program tidak dapat dihapus.");
      toast.success("Program berhasil dihapus.");
      window.location.reload();
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : "Gagal menghapus program.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin" }, { label: "Program" }]} />
      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Program & Modul</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Program</h1>
          <p className="mt-1 text-sm text-[#4A4C54]/65">Kode program wajib dan menjadi pintu masuk peserta tanpa login.</p>
        </div>
        <Link href="/admin/engagements/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white hover:bg-[#0A255A]">
          <Plus size={18} /> Buat Program
        </Link>
      </div>

      {!loading && !error && engagements.length > 0 && <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari nama atau kode program" className="w-full lg:max-w-md" />
          <FilterTabs active={statusFilter} onChange={setStatusFilter} tabs={[
            { key: "active", label: "Aktif", count: engagements.filter((program) => !["completed", "archived"].includes(program.status)).length },
            { key: "completed", label: "Selesai", count: engagements.filter((program) => program.status === "completed").length },
            { key: "archived", label: "Arsip", count: engagements.filter((program) => program.status === "archived").length },
          ]} />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Menampilkan {filteredPrograms.length} program {statusFilter === "active" ? "aktif" : statusFilter === "completed" ? "selesai" : "arsip"}</p>
      </section>}

      {loading ? <div className="py-20 text-center text-sm text-slate-500">Memuat...</div> : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : engagements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState title="Belum ada program" description="Buat program pertama lalu pilih modul LEP dan/atau T-BOS." action={<Link href="/admin/engagements/new" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white"><Plus size={18} /> Buat Program</Link>} /></div>
      ) : filteredPrograms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState title="Program tidak ditemukan" description="Ubah kata pencarian atau pilih status lain." /></div>
      ) : (
          <section className="mb-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPrograms.map((program) => {
                const modules = (modulesByProgram[program.id] || []).filter((module) => module.enabled);
                return (
                  <article key={program.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-900/25 hover:shadow-lg hover:shadow-slate-900/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-amber-700">{program.code || "Tanpa kode"}</p>
                      </div>
                      <StatusPill status={program.status} />
                    </div>
                    <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">{program.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {modules.map((module) => <ModuleChip key={module.module_key} moduleKey={module.module_key} />)}
                      {modules.length === 0 && <span className="text-xs text-slate-500">Belum ada modul aktif</span>}
                    </div>
                    <dl className="mt-4 space-y-2 border-t border-[#0B2C6B]/[0.07] pt-4 text-xs text-[#4A4C54]/65">
                      <div className="flex items-center gap-2"><Building2 size={14} className="shrink-0 text-[#D9A441]" /><dt className="sr-only">Perusahaan</dt><dd className="truncate">{program.organization?.name || "Perusahaan belum tercatat"}</dd></div>
                      {program.location && <div className="flex items-center gap-2"><MapPin size={14} className="shrink-0 text-[#D9A441]" /><dt className="sr-only">Lokasi</dt><dd className="truncate">{program.location}</dd></div>}
                      {(program.start_date || program.end_date) && <div className="flex items-center gap-2"><CalendarDays size={14} className="shrink-0 text-[#D9A441]" /><dt className="sr-only">Periode</dt><dd>{program.start_date ? new Date(program.start_date).toLocaleDateString("id-ID") : "–"} – {program.end_date ? new Date(program.end_date).toLocaleDateString("id-ID") : "–"}</dd></div>}
                    </dl>
                    <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                      <Link href={`/admin/engagements/manage?id=${program.id}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-900 px-3 text-xs font-semibold text-white"><Settings size={13} /> Kelola</Link>
                      <button type="button" onClick={() => setShareTarget(program)} disabled={!program.code} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-900 disabled:cursor-not-allowed disabled:opacity-45"><Send size={13} /> Bagikan</button>
                      <button type="button" onClick={() => setDeleteTarget({ id: program.id, title: program.title })} aria-label={`Hapus ${program.title}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
      )}

      <ConfirmDialog open={Boolean(deleteTarget)} onClose={() => { if (!deleting) setDeleteTarget(null); }} onConfirm={deleteProgram} title="Hapus Program?" description={deleteTarget ? `Program "${deleteTarget.title}" beserta tim kosongnya akan dihapus permanen. Program yang memiliki histori observasi atau LEP harus diarsipkan.` : undefined} confirmLabel="Ya, Hapus" variant="danger" loading={deleting} />

      {shareTarget?.code && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#071B3D]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Bagikan ${shareTarget.title}`} onMouseDown={(event) => { if (event.currentTarget === event.target) setShareTarget(null); }}>
          <div className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#F7F8FA] p-4 shadow-2xl sm:rounded-3xl sm:p-5">
            <button type="button" onClick={() => setShareTarget(null)} aria-label="Tutup" className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0B2C6B] shadow-sm"><X size={17} /></button>
            <ProgramShareCard programId={shareTarget.id} code={shareTarget.code} title={shareTarget.title} status={shareTarget.status} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProgramsPage() {
  return <AdminAuthGate><AppShell role="admin" title="Program" eyebrow="Program & Modul"><AdminProgramsPageContent /></AppShell></AdminAuthGate>;
}
