"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Settings, ArrowUpRight, Trash2, Loader2, X, CheckCircle2, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useEngagements } from "@/hooks/use-transformation-data";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { StatusPill, Breadcrumb, EmptyState } from "@/components/ui";

type ModuleKey = "tbos" | "lep";

const MODULE_OPTIONS: { key: ModuleKey; label: string; description: string }[] = [
  { key: "tbos", label: "T-BOS", description: "Observasi kompetensi berbasis pos & dimensi" },
  { key: "lep", label: "LEP", description: "Lembar Evaluasi Program peserta" },
];

interface ProgramModuleRow {
  program_id: string;
  module_key: ModuleKey;
  enabled: boolean;
}

function CreateProgramModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [enabledModules, setEnabledModules] = useState<ModuleKey[]>(["tbos"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/organizations")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setOrganizations(json.organizations || []);
          if (!json.organizations?.[0]?.id) {
            setError("Belum ada perusahaan terdaftar. Buat program dari halaman Program terlebih dahulu.");
          } else {
            setOrganizationId(json.organizations[0].id);
          }
        }
      })
      .catch(() => setError("Gagal memuat daftar perusahaan."));
  }, []);

  const toggleModule = (key: ModuleKey) => {
    setEnabledModules((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !organizationId) {
      setError("Nama program dan perusahaan wajib diisi.");
      return;
    }
    if (enabledModules.length === 0) {
      setError("Pilih minimal satu modul.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const code = `PROG-${new Date().getFullYear()}-${name.trim().replace(/\s+/g, "-").slice(0, 30).toUpperCase()}`;
      const res = await fetch("/api/engagements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          code,
          title: name.trim(),
          type: "assessment",
          status: "draft",
          modules: MODULE_OPTIONS.map((module) => ({ moduleKey: module.key, enabled: enabledModules.includes(module.key) })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal membuat program.");

      toast.success("Program berhasil dibuat");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat program.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-program-title">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-[#0B2C6B]" />
            <h3 id="create-program-title" className="text-base font-bold text-[#0B2C6B]">Buat Program Baru</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/[0.04] text-[#4A4C54]" aria-label="Tutup">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Nama Program
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Leadership Program Batch Agustus 2026"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] focus:ring-1 focus:ring-[#0B2C6B]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Perusahaan
            </label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm bg-white focus:outline-none focus:border-[#0B2C6B]"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1.5">
              Modul Program
            </span>
            <div className="space-y-2">
              {MODULE_OPTIONS.map((mod) => {
                const checked = enabledModules.includes(mod.key);
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => toggleModule(mod.key)}
                    aria-pressed={checked}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                      checked ? "border-[#0B2C6B] bg-[#0B2C6B]/[0.04]" : "border-black/10 hover:border-[#0B2C6B]/30"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      checked ? "bg-[#0B2C6B] border-[#0B2C6B] text-white" : "border-black/20 text-transparent"
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#0B2C6B]">{mod.label}</span>
                      <span className="block text-xs text-[#4A4C54]/70">{mod.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-semibold text-[#4A4C54] hover:bg-black/[0.02] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#0B2C6B] text-white text-sm font-semibold hover:bg-[#071B3D] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Buat Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminProgramsPageContent() {
  const { engagements, loading, error } = useEngagements();
  const [modulesByProgram, setModulesByProgram] = useState<Record<string, ProgramModuleRow[]>>({});
  const [showCreate, setShowCreate] = useState(false);

  const loadModules = () => {
    void fetch("/api/program-modules")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const map: Record<string, ProgramModuleRow[]> = {};
          for (const row of json.modules || []) {
            map[row.program_id] = map[row.program_id] || [];
            map[row.program_id].push(row);
          }
          setModulesByProgram(map);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadModules();
  }, []);

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

  const enabledLabels = (programId: string) => {
    const rows = modulesByProgram[programId] || [];
    return rows.filter((r) => r.enabled).map((r) => MODULE_OPTIONS.find((m) => m.key === r.module_key)?.label || r.module_key);
  };

  const deleteProgram = async (id: string, title: string) => {
    if (!window.confirm(`Hapus program ${title}? Program dengan observasi hanya dapat diarsipkan.`)) return;
    const response = await fetch(`/api/engagements/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) window.alert(result.error || "Program tidak dapat dihapus.");
    else window.location.reload();
  };

  return (
    <div className="p-6 lg:p-8">
      <Breadcrumb items={[{ label: "Admin" }, { label: "Program" }]} />

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Program & Modul</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Program</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]"
        >
          <Plus size={18} /> Buat Program
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat...</div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : (
        <>
          {["active", "draft", "completed", "archived"].map((group) => {
            const items = grouped[group];
            if (!items.length) return null;
            return (
              <section key={group} className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-[#0B2C6B] capitalize">{group} ({items.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((e) => {
                    const labels = enabledLabels(e.id);
                    return (
                      <div key={e.id} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#D9A441]">{e.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                            <h3 className="mt-1 truncate text-base font-semibold text-[#0B2C6B]">{e.title}</h3>
                          </div>
                          <StatusPill status={e.status} />
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Modul Aktif</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {labels.length === 0 ? (
                              <span className="rounded-full bg-[#E6EAF0] px-2.5 py-1 text-xs font-semibold text-[#4A4C54]/60">Belum ada modul</span>
                            ) : (
                              labels.map((label) => (
                                <span key={label} className="inline-flex items-center gap-1 rounded-full bg-[#0B2C6B]/[0.06] px-2.5 py-1 text-xs font-semibold text-[#0B2C6B]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#D9A441]" />
                                  {label}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link href={`/admin/engagements/manage?id=${e.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2C6B]/15 px-3 py-1.5 text-xs font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]">
                            <Settings size={12} /> Kelola
                          </Link>
                          <button type="button" onClick={() => void deleteProgram(e.id, e.title)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">
                            <Trash2 size={12} /> Hapus
                          </button>
                          <div className="flex-1" />
                          <Link href={`/client/engagements/detail?id=${e.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0A255A]">
                            Lihat <ArrowUpRight size={12} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {engagements.length === 0 && (
            <EmptyState
              title="Belum ada program"
              description="Buat program pertama lalu aktifkan modul T-BOS / LEP sesuai kebutuhan."
              action={
                <button onClick={() => setShowCreate(true)} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]">
                  <Plus size={18} /> Buat Program
                </button>
              }
            />
          )}
        </>
      )}

      {showCreate && (
        <CreateProgramModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadModules();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default function AdminProgramsPage() {
  return <AdminAuthGate><AdminProgramsPageContent /></AdminAuthGate>;
}
