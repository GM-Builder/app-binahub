"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Mail, Shield, Calendar, Search, Plus, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { StatusPill, Breadcrumb, EmptyState, SearchInput, ConfirmDialog } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/lib/supabase";

interface UserRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  facilitator: "Fasilitator",
  client: "Klien",
  participant: "Peserta",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-[#0B2C6B] text-white",
  facilitator: "bg-[#D9A441] text-white",
  client: "bg-[#16A34A] text-white",
  participant: "bg-[#6B7280] text-white",
};

function UserManagementContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("client");
  const [inviting, setInviting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Sesi tidak valid.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();
      if (json.success) {
        setUsers(json.users || []);
      } else {
        setError(json.error || "Gagal memuat data pengguna.");
      }
    } catch {
      setError("Gagal memuat data pengguna.");
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(keyword) ||
        u.role.toLowerCase().includes(keyword)
    );
  }, [users, search]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error("Sesi tidak valid.");
        setInviting(false);
        return;
      }

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      const json = await response.json();
      if (json.success) {
        toast.success("Role berhasil diperbarui.");
        void fetchUsers();
      } else {
        toast.error(json.error || "Gagal memperbarui role.");
      }
    } catch {
      toast.error("Gagal memperbarui role.");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
        <div className="py-20 text-center text-sm text-[#4A4C54]/60">Memuat data pengguna...</div>
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
    <div className="p-6 lg:p-8">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Pengguna" }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">User Management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">Pengguna</h1>
          <p className="mt-1 text-sm text-[#4A4C54]/60">{users.length} pengguna terdaftar</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A255A]"
        >
          <Plus size={18} /> Undang Pengguna
        </button>
      </div>

      <div className="mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari pengguna..." />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada pengguna"
          description={search ? "Tidak ada pengguna yang cocok dengan pencarian." : "Belum ada pengguna terdaftar."}
        />
      ) : (
        <div className="rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#0B2C6B]/10 bg-[#F5F7FA]">
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Email</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Role</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Terdaftar</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Login Terakhir</th>
                  <th className="px-4 py-3 font-semibold text-[#0B2C6B]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#0B2C6B]/5 transition hover:bg-[#F5F7FA]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#4A4C54]/40" />
                        <span className="font-medium text-[#0B2C6B]">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                        className="rounded-lg border border-[#0B2C6B]/15 bg-white px-2 py-1 text-xs font-semibold text-[#0B2C6B] outline-none focus:border-[#D9A441]"
                      >
                        <option value="admin">Admin</option>
                        <option value="facilitator">Fasilitator</option>
                        <option value="client">Klien</option>
                        <option value="participant">Peserta</option>
                      </select>
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

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-[#0B2C6B]">Undang Pengguna Baru</h2>
            <div className="space-y-4">
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
                <span className="mb-1 block text-xs font-semibold text-[#4A4C54]/60">Role</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#0B2C6B]/15 px-3 text-sm outline-none focus:border-[#D9A441]"
                >
                  <option value="client">Klien</option>
                  <option value="facilitator">Fasilitator</option>
                  <option value="participant">Peserta</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA]"
                >
                  Batal
                </button>
                <button
                  onClick={() => void handleInvite()}
                  disabled={inviting || !inviteEmail}
                  className="rounded-lg bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A255A] disabled:opacity-50"
                >
                  {inviting ? "Mengirim..." : "Kirim Undangan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default function AdminUsersPage() {
  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <UserManagementContent />
      </ErrorBoundary>
    </AdminAuthGate>
  );
}
