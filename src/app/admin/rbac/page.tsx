"use client";

import { Shield, ShieldCheck, ShieldX, User, Users, UserCog, Eye, EyeOff, Pen, Trash2, Plus, FileText } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { ErrorBoundary } from "@/components/error-boundary";

type Permission = {
  id: string;
  label: string;
  description: string;
  admin: boolean;
  facilitator: boolean;
  client: boolean;
};

const PERMISSIONS: Permission[] = [
  { id: "engagement:create", label: "Buat Engagement", description: "Membuat engagement baru", admin: true, facilitator: false, client: false },
  { id: "engagement:read", label: "Lihat Engagement", description: "Melihat daftar & detail engagement", admin: true, facilitator: true, client: true },
  { id: "engagement:update", label: "Ubah Engagement", description: "Mengedit status & data engagement", admin: true, facilitator: false, client: false },
  { id: "engagement:delete", label: "Hapus Engagement", description: "Menghapus engagement", admin: true, facilitator: false, client: false },
  { id: "evidence:create", label: "Buat Evidence", description: "Menambahkan evidence baru", admin: true, facilitator: true, client: true },
  { id: "evidence:read", label: "Lihat Evidence", description: "Melihat daftar evidence", admin: true, facilitator: true, client: true },
  { id: "evidence:update", label: "Ubah Evidence", description: "Mengedit tag & data evidence", admin: true, facilitator: true, client: true },
  { id: "evidence:delete", label: "Hapus Evidence", description: "Menghapus evidence", admin: true, facilitator: false, client: false },
  { id: "action:create", label: "Buat Action", description: "Menambahkan action baru", admin: true, facilitator: true, client: true },
  { id: "action:read", label: "Lihat Action", description: "Melihat daftar action", admin: true, facilitator: true, client: true },
  { id: "action:update", label: "Ubah Action", description: "Mengedit status, progress, prioritas action", admin: true, facilitator: true, client: true },
  { id: "action:delete", label: "Hapus Action", description: "Menghapus action", admin: true, facilitator: false, client: false },
  { id: "participant:read", label: "Lihat Partisipan", description: "Melihat data partisipan", admin: true, facilitator: true, client: false },
  { id: "participant:update", label: "Kelola Partisipan", description: "Menambah/menghapus partisipan", admin: true, facilitator: false, client: false },
  { id: "facilitator:read", label: "Lihat Fasilitator", description: "Melihat daftar fasilitator", admin: true, facilitator: false, client: false },
  { id: "facilitator:assign", label: "Atur Fasilitator", description: "Menugaskan fasilitator ke engagement", admin: true, facilitator: false, client: false },
  { id: "report:create", label: "Buat Report", description: "Membuat laporan engagement", admin: true, facilitator: true, client: false },
  { id: "report:read", label: "Lihat Report", description: "Melihat laporan", admin: true, facilitator: true, client: true },
  { id: "admin:access", label: "Akses Admin", description: "Mengakses panel admin", admin: true, facilitator: false, client: false },
  { id: "rbac:view", label: "Lihat RBAC", description: "Melihat matriks izin ini", admin: true, facilitator: false, client: false },
];

const ROLE_CONFIG = {
  admin: { label: "Admin", icon: <UserCog size={14} />, tone: "text-indigo-600" },
  facilitator: { label: "Facilitator", icon: <Users size={14} />, tone: "text-amber-600" },
  client: { label: "Client", icon: <User size={14} />, tone: "text-emerald-600" },
};

function RoleHeader({ role }: { role: keyof typeof ROLE_CONFIG }) {
  const c = ROLE_CONFIG[role];
  return (
    <th className={`px-3 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] ${c.tone}`}>
      <div className="flex items-center justify-center gap-1.5">{c.icon} {c.label}</div>
    </th>
  );
}

export default function RBACPage() {
  const adminCount = PERMISSIONS.filter((p) => p.admin).length;
  const facilitatorCount = PERMISSIONS.filter((p) => p.facilitator).length;
  const clientCount = PERMISSIONS.filter((p) => p.client).length;

  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
          <div className="mx-auto max-w-5xl">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Kontrol Peran & Akses</div>
            <h1 className="text-3xl font-light tracking-[-0.04em]">Matriks Izin</h1>
          <p className="mt-2 text-sm text-[#4A4C54]/70">
            Setiap role memiliki izin yang berbeda. Izin ditentukan oleh role pengguna dan tidak dapat diubah secara manual — mengikuti prinsip <strong>derived capability</strong>.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {(["admin", "facilitator", "client"] as const).map((role) => {
              const count = role === "admin" ? adminCount : role === "facilitator" ? facilitatorCount : clientCount;
              const c = ROLE_CONFIG[role];
              return (
                <section key={role} className="rounded-xl border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
                  <div className={`flex items-center gap-2 ${c.tone}`}>{c.icon}<p className="text-[10px] font-bold uppercase tracking-[0.16em]">Peran {c.label}</p></div>
                  <p className="mt-3 text-3xl font-semibold">{count}<span className="ml-1 text-base font-normal text-[#4A4C54]/50">izin</span></p>
                  <p className="mt-1 text-xs text-[#4A4C54]/60">{role === "admin" ? "Akses penuh ke seluruh sistem." : role === "facilitator" ? "Fokus pada observasi, penilaian, dan laporan." : "Akses terbatas pada data milik sendiri."}</p>
                </section>
              );
            })}
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-[#0B2C6B]/10 bg-white shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0B2C6B]/10">
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Izin</th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/50">Deskripsi</th>
                  <RoleHeader role="admin" />
                  <RoleHeader role="facilitator" />
                  <RoleHeader role="client" />
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="border-b border-[#0B2C6B]/5 last:border-0 hover:bg-[#F5F7FA]/50">
                    <td className="px-3 py-3">
                      <code className="rounded bg-[#F5F7FA] px-1.5 py-0.5 text-[11px] font-medium text-[#0B2C6B]">{perm.id}</code>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#4A4C54]/70">{perm.description}</td>
                    <td className={`px-3 py-3 text-center ${perm.admin ? "text-emerald-500" : "text-red-300"}`}>{perm.admin ? <ShieldCheck size={16} className="mx-auto" /> : <ShieldX size={16} className="mx-auto" />}</td>
                    <td className={`px-3 py-3 text-center ${perm.facilitator ? "text-emerald-500" : "text-red-300"}`}>{perm.facilitator ? <ShieldCheck size={16} className="mx-auto" /> : <ShieldX size={16} className="mx-auto" />}</td>
                    <td className={`px-3 py-3 text-center ${perm.client ? "text-emerald-500" : "text-red-300"}`}>{perm.client ? <ShieldCheck size={16} className="mx-auto" /> : <ShieldX size={16} className="mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="mt-8 rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9A441]">Arsitektur RBAC</p>
            <h3 className="mt-2 text-base font-semibold">Bagaimana akses ditentukan</h3>
            <div className="mt-4 space-y-3 text-sm text-[#4A4C54]/80">
              <p><strong className="text-[#0B2C6B]">1. Role disimpan di Supabase Auth</strong> — metadata pengguna (`app_metadata.role`) menentukan role: `admin`, `facilitator`, atau `client`.</p>
              <p><strong className="text-[#0B2C6B]">2. Auth Gate memeriksa session endpoint</strong> — setiap halaman di-bungkus oleh `AdminAuthGate`, `FacilitatorAuthGate`, atau `ClientAuthGate` yang memanggil `/api/[role]/session` untuk validasi.</p>
              <p><strong className="text-[#0B2C6B]">3. PermissionGate untuk UI granular</strong> — `PermissionGate` memungkinkan render kondisional komponen berdasarkan role pengguna saat ini.</p>
              <p><strong className="text-[#0B2C6B]">4. API Server memvalidasi via middleware</strong> — endpoint server menggunakan `requireAdmin()` / `requireFacilitator()` untuk memastikan hanya akses yang sah.</p>
              <p className="mt-4 rounded-lg bg-[#F5F7FA] p-3 text-xs">
                <strong>Prinsip:</strong> Capability adalah derived, bukan manual. Izin tidak pernah disetel secara langsung — selalu berasal dari role pengguna yang terautentikasi.
              </p>
            </div>
          </section>
        </div>
      </main>
      </ErrorBoundary>
    </AdminAuthGate>
  );
}
