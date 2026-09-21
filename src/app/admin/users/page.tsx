"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Users, Mail, Plus, RefreshCw, AlertCircle, Loader2, ShieldCheck, BriefcaseBusiness, GraduationCap, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { EmptyState, SearchInput, ConfirmDialog } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { AdminShell } from "@/components/admin-shell";
import { apiFetch } from "@/lib/api-fetch";

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  facilitator: "Fasilitator",
  client: "Klien",
  peserta: "Peserta",
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "facilitator", label: "Fasilitator" },
  { value: "client", label: "Klien" },
  { value: "peserta", label: "Peserta" },
] as const;

function UserManagementContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("client");
  const [inviting, setInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const inviteDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = inviteDialogRef.current;
    if (!dialog) return;
    if (showInviteModal && !dialog.open) dialog.showModal();
    if (!showInviteModal && dialog.open) dialog.close();
  }, [showInviteModal]);

  const fetchUsers = async () => {
    try {
      setError("");
      const response = await apiFetch("/api/users");

      const json = await response.json();
      if (json.success) {
        setUsers((json.users || []).map((user: UserRecord) => ({
          ...user,
          role: user.role === "participant" ? "peserta" : user.role,
        })));
      } else {
        setError(json.error || "Gagal memuat data pengguna.");
      }
    } catch {
      setError("Gagal memuat data pengguna.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (u.email.toLowerCase().includes(keyword) ||
          u.full_name?.toLowerCase().includes(keyword) ||
          (ROLE_LABEL[u.role] || u.role).toLowerCase().includes(keyword))
    );
  }, [users, search, roleFilter]);

  const roleCounts = useMemo(() => ({
    all: users.length,
    admin: users.filter((user) => user.role === "admin").length,
    facilitator: users.filter((user) => user.role === "facilitator").length,
    client: users.filter((user) => user.role === "client").length,
    peserta: users.filter((user) => user.role === "peserta").length,
  }), [users]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);

    try {
      const response = await apiFetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const json = await response.json();
      if (json.success) {
        toast.success(`Undangan terkirim ke ${inviteEmail}`);
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteRole("client");
        void fetchUsers();
      } else {
        toast.error(json.error || "Gagal mengirim undangan.");
      }
    } catch {
      toast.error("Gagal mengirim undangan.");
    }
    setInviting(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const previousRole = users.find((user) => user.id === userId)?.role;
    if (!previousRole || previousRole === newRole) return;
    setUpdatingUserId(userId);
    try {
      const response = await apiFetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      const json = await response.json();
      if (json.success) {
        setUsers((current) => current.map((user) => user.id === userId ? { ...user, role: newRole } : user));
        toast.success(`Peran diperbarui menjadi ${ROLE_LABEL[newRole] || newRole}.`);
      } else {
        toast.error(json.error || "Gagal memperbarui role.");
      }
    } catch {
      toast.error("Gagal memperbarui role.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const response = await apiFetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Pengguna berhasil dihapus.");
        void fetchUsers();
      } else {
        toast.error(json.error || "Gagal menghapus pengguna.");
      }
    } catch {
      toast.error("Gagal menghapus pengguna.");
    }
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div role="status" aria-live="polite" className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat data pengguna...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={AlertCircle}
          title="Gagal memuat data"
          description={error}
          action={
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A255A]"
            >
              <RefreshCw size={14} /> Coba Lagi
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#0B2C6B]">Akses tim dalam satu tampilan</p>
          <p className="mt-1 text-sm text-[#4A4C54]/65">Cari akun, periksa aktivitas, lalu ubah peran tanpa memuat ulang halaman.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]"
        >
          <Plus size={18} /> Undang Pengguna
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RoleMetric icon={ShieldCheck} label="Admin" value={roleCounts.admin} tone="navy" />
        <RoleMetric icon={Users} label="Fasilitator" value={roleCounts.facilitator} tone="gold" />
        <RoleMetric icon={BriefcaseBusiness} label="Klien" value={roleCounts.client} tone="blue" />
        <RoleMetric icon={GraduationCap} label="Peserta" value={roleCounts.peserta} tone="slate" />
      </div>

      <div className="mb-6 rounded-2xl border border-[#0B2C6B]/10 bg-white p-3 shadow-[0_16px_44px_-38px_rgba(11,44,107,0.42)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, email, atau peran..." />
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-[#F5F7FA] p-1" aria-label="Filter peran">
            {[{ value: "all", label: "Semua" }, ...ROLE_OPTIONS].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setRoleFilter(role.value)}
                aria-pressed={roleFilter === role.value}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${roleFilter === role.value ? "bg-white text-[#0B2C6B] shadow-sm" : "text-[#4A4C54]/65 hover:text-[#0B2C6B]"}`}
              >
                {role.label} <span className="ml-1 text-[10px] opacity-60">{roleCounts[role.value as keyof typeof roleCounts]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada pengguna"
          description={search ? "Tidak ada pengguna yang cocok dengan pencarian." : "Belum ada pengguna terdaftar."}
        />
      ) : (
        <div className="rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="divide-y divide-[#0B2C6B]/8 sm:hidden">
            {filteredUsers.map((user) => (
              <article key={user.id} className="space-y-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EEF3FA] text-[#0B2C6B]">
                    <Mail size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-[#0B2C6B]">{user.full_name || user.email.split("@")[0]}</h2>
                    <p className="mt-0.5 truncate text-xs text-[#4A4C54]/60">{user.email}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[#EEF3FA] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0B2C6B]">{ROLE_LABEL[user.role] || user.role}</span>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 rounded-xl bg-[#F7F9FC] p-3 text-xs">
                  <div><dt className="text-[#4A4C54]/55">Terdaftar</dt><dd className="mt-1 font-semibold text-[#0B2C6B]">{new Date(user.created_at).toLocaleDateString("id-ID")}</dd></div>
                  <div><dt className="text-[#4A4C54]/55">Masuk terakhir</dt><dd className="mt-1 font-semibold text-[#0B2C6B]">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("id-ID") : "Belum pernah"}</dd></div>
                </dl>
                <div className="flex items-center gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">Ubah peran {user.email}</span>
                    <select value={user.role} disabled={updatingUserId === user.id} onChange={(event) => void handleRoleChange(user.id, event.target.value)} className="h-10 w-full rounded-xl border border-[#0B2C6B]/15 bg-white px-3 text-xs font-semibold text-[#0B2C6B] disabled:cursor-wait disabled:opacity-60">
                      {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </label>
                  {updatingUserId === user.id && <Loader2 className="h-4 w-4 animate-spin text-[#D9A441]" aria-label="Menyimpan peran" />}
                  <button type="button" onClick={() => setConfirmDelete(user.id)} className="h-10 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 hover:bg-red-50">Hapus</button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Daftar pengguna dan pengaturan peran</caption>
              <thead>
                <tr className="border-b border-[#0B2C6B]/10 bg-[#F5F7FA]">
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Pengguna</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Peran</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Terdaftar</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Masuk Terakhir</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#0B2C6B]/5 transition hover:bg-[#F5F7FA]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#4A4C54]/40" />
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EEF3FA] text-xs font-bold uppercase text-[#0B2C6B]">{userInitials(user)}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-[#0B2C6B]">{user.full_name || user.email.split("@")[0]}</span>
                          <span className="block truncate text-xs text-[#4A4C54]/55">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={updatingUserId === user.id}
                        onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                        aria-label={`Ubah peran ${user.email}`}
                        className="rounded-lg border border-[#0B2C6B]/15 bg-white px-2 py-1 text-xs font-semibold text-[#0B2C6B] outline-none focus:border-[#D9A441]"
                      >
                        {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                      </select>
                      {updatingUserId === user.id && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-[#D9A441]" aria-label="Menyimpan peran" />}
                    </td>
                    <td className="px-4 py-3 text-[#4A4C54]/60">
                      {new Date(user.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-[#4A4C54]/60">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(user.id)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <dialog
        ref={inviteDialogRef}
        onCancel={(event) => { event.preventDefault(); if (!inviting) setShowInviteModal(false); }}
        onClose={() => setShowInviteModal(false)}
        aria-labelledby="invite-user-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border-0 bg-white p-6 text-slate-700 shadow-xl backdrop:bg-black/45 backdrop:backdrop-blur-sm"
      >
            <h2 id="invite-user-title" className="mb-4 text-lg font-semibold text-[#0B2C6B]">Undang Pengguna Baru</h2>
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void handleInvite(); }}>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#4A4C54]/60">Email</span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  className="h-10 w-full rounded-lg border border-[#0B2C6B]/15 px-3 text-sm outline-none focus:border-[#D9A441]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-[#4A4C54]/60">Peran</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#0B2C6B]/15 px-3 text-sm outline-none focus:border-[#D9A441]"
                >
                  <option value="client">Klien</option>
                  <option value="facilitator">Fasilitator</option>
                  <option value="peserta">Peserta</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="rounded-lg bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A255A] disabled:opacity-50"
                >
                  {inviting ? "Mengirim..." : "Kirim Undangan"}
                </button>
              </div>
            </form>
      </dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void handleDelete(confirmDelete)}
        title="Hapus Pengguna"
        description="Pengguna ini akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}

function RoleMetric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: "navy" | "gold" | "blue" | "slate" }) {
  const tones = {
    navy: "bg-[#EEF3FA] text-[#0B2C6B]",
    gold: "bg-[#FFF7E7] text-[#9A6A12]",
    blue: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#0B2C6B]/10 bg-white p-4 shadow-[0_14px_36px_-34px_rgba(11,44,107,0.45)]">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4A4C54]/50">{label}</p><p className="mt-0.5 text-xl font-bold text-[#0B2C6B]">{value}</p></div>
    </div>
  );
}

function userInitials(user: UserRecord) {
  const source = user.full_name?.trim() || user.email.split("@")[0];
  return source.split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("");
}

export default function AdminUsersPage() {
  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <AdminShell title="Pengguna & Peran" eyebrow="Manajemen Akses" description="Kelola akun, peran, dan status akses seluruh pengguna platform.">
          <UserManagementContent />
        </AdminShell>
      </ErrorBoundary>
    </AdminAuthGate>
  );
}
