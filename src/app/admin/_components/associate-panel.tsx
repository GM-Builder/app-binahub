"use client";

import { useMemo, useState } from "react";
import { AlertCircle, BriefcaseBusiness, CheckCircle2, Eye, Layers3, Mail, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AdminInput,
  AdminModal,
  AdminNotice,
  AdminSearch,
  AdminSelect,
  AdminTextarea,
  Badge,
  CollapsibleModule,
  ConfirmDialog,
  EmptyState,
  FieldLabel,
  FormSection,
  GuidancePanel,
  HrmItem,
  HrmList,
  Panel,
  PresetButtons,
  StatCard,
} from "./shared";
import {
  ADMIN_SERVICE_OPTIONS,
  ASSOCIATE_CATEGORIES,
  ASSOCIATE_FIELD_OPTIONS,
  AVAILABILITY_OPTIONS,
  DURATION_OPTIONS,
  NOTE_PRESETS,
  TIME_WINDOW_OPTIONS,
} from "../_lib/constants";
import { isProjectCompleted, uniqueOptions } from "../_lib/utils";
import type {
  CoachAssignmentRecord,
  CoachAvailabilityRecord,
  CoachDocumentRecord,
  CoachRecord,
  CoachSessionRecord,
  ConfirmAction,
  ProjectAssignmentSmartRecord,
  ProjectRecord,
} from "../_lib/types";

type DeliveryAssignmentRecord = {
  id?: string;
  source: "manual" | "automation" | "mixed";
  coach_id?: string;
  client_name?: string;
  program_name?: string;
  service?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  project_id?: string;
  assignment_count?: number;
  associate_names?: string[];
  source_label: string;
};

export function AssociatePanel({
  mode,
  coaches,
  assignments = [],
  projects = [],
  projectAssignments = [],
  sessions = [],
  availability = [],
  documents = [],
  onAction,
  onRefresh,
}: {
  mode: "coach" | "hrm";
  coaches: CoachRecord[];
  assignments?: CoachAssignmentRecord[];
  projects?: ProjectRecord[];
  projectAssignments?: ProjectAssignmentSmartRecord[];
  sessions?: CoachSessionRecord[];
  availability?: CoachAvailabilityRecord[];
  documents?: CoachDocumentRecord[];
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const emptyCoach = {
    name: "",
    email: "",
    phone: "",
    expertise: "",
    field: "",
    category: "Assessor (Insight)",
    rate: "",
    availability: "",
    cvUrl: "",
    linkedinUrl: "",
    linkedinSummary: "",
    status: "active",
    bio: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyCoach);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [opsModalOpen, setOpsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const [extractingLinkedIn, setExtractingLinkedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("Semua");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [opsError, setOpsError] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    coach_id: "",
    client_name: "",
    program_name: "",
    service: "",
    status: "Planned",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    coach_id: "",
    day_of_week: "Senin",
    time_window: "",
    mode: "Hybrid",
    status: "Available",
    notes: "",
  });
  const [sessionForm, setSessionForm] = useState({
    coach_id: "",
    assignment_id: "",
    session_date: "",
    duration_minutes: "90",
    topic: "",
    rating: "5",
    evaluation: "",
    notes: "",
  });
  const [documentForm, setDocumentForm] = useState({
    coach_id: "",
    title: "",
    document_type: "Kontrak",
    document_url: "",
    status: "Active",
    expiry_date: "",
    notes: "",
  });

  const filteredCoaches = useMemo(() => {
    const keyword = search.toLowerCase();
    return coaches.filter((coach) =>
      [
        coach.name,
        coach.email,
        coach.phone,
        coach.expertise,
        coach.field,
        coach.category,
        coach.status,
        coach.availability,
        coach.cvUrl,
        coach.linkedinUrl,
        coach.linkedinSummary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword) &&
      (fieldFilter === "Semua" || coach.field === fieldFilter) &&
      (categoryFilter === "Semua" || coach.category === categoryFilter) &&
      (statusFilter === "Semua" || coach.status === statusFilter)
    );
  }, [categoryFilter, coaches, fieldFilter, search, statusFilter]);

  const fieldOptions = uniqueOptions(coaches, (coach) => coach.field);
  const categoryOptions = Array.from(
    new Set([...ASSOCIATE_CATEGORIES, ...uniqueOptions(coaches, (coach) => coach.category)])
  );
  const statusOptions = uniqueOptions(coaches, (coach) => coach.status);
  const coachOptions: Array<[string, string]> = coaches
    .filter((coach) => coach.id)
    .map((coach) => [coach.id || "", coach.name || "Associate BinaHub"]);
  const assignmentOptions: Array<[string, string]> = assignments
    .filter((assignment) => assignment.id)
    .map((assignment) => [
      assignment.id || "",
      `${assignment.program_name || "Program"} - ${assignment.client_name || "Klien"}`,
    ]);
  const normalizedDeliveryAssignments = useMemo(() => {
    const normalize = (value?: string | null) => (value || "").trim().toLowerCase().replace(/\s+/g, " ");
    const makeKey = (item: Pick<DeliveryAssignmentRecord, "client_name" | "program_name" | "service" | "id" | "project_id">) => {
      const client = normalize(item.client_name);
      const program = normalize(item.program_name);
      const service = normalize(item.service);
      if (client || program) return [client, program, service].join("|");
      return item.project_id ? `project:${item.project_id}` : `assignment:${item.id || "unknown"}`;
    };

    const byProject = new Map<string, ProjectAssignmentSmartRecord[]>();
    projectAssignments.forEach((assignment) => {
      if (!assignment.project_id) return;
      const current = byProject.get(assignment.project_id) || [];
      byProject.set(assignment.project_id, [...current, assignment]);
    });

    const automationItems: DeliveryAssignmentRecord[] = projects.filter((project) => !isProjectCompleted(project)).map((project) => {
      const relatedAssignments = project.id ? byProject.get(project.id) || [] : [];
      const associateNames = Array.from(
        new Set(relatedAssignments.map((assignment) => assignment.associate_name).filter(Boolean) as string[])
      );
      const sentCount = relatedAssignments.filter((assignment) => assignment.invitation_sent_at).length;
      const draftCount = relatedAssignments.filter((assignment) => (assignment.status || "").toLowerCase() === "draft").length;
      const status =
        project.status ||
        (sentCount ? "Invitation Sent" : draftCount ? "Draft" : relatedAssignments[0]?.status || "Automation");

      return {
        id: project.id,
        source: "automation",
        client_name: project.client_name,
        program_name: project.program_name,
        service: project.service || project.project_type,
        status,
        start_date: project.start_date,
        end_date: project.end_date,
        notes: project.ai_summary || relatedAssignments[0]?.match_reason || project.scope,
        project_id: project.id,
        assignment_count: relatedAssignments.length,
        associate_names: associateNames,
        source_label: "Automation Center",
      };
    });

    const manualItems: DeliveryAssignmentRecord[] = assignments
      .filter((assignment) => !isProjectCompleted({ status: assignment.status }))
      .map((assignment) => ({
        ...assignment,
        source: "manual",
        assignment_count: 1,
        source_label: "Manual",
      }));

    return [...automationItems, ...manualItems].reduce<DeliveryAssignmentRecord[]>((items, item) => {
      const key = makeKey(item);
      const existingIndex = items.findIndex((existing) => makeKey(existing) === key);
      if (existingIndex === -1) return [...items, item];

      const existing = items[existingIndex];
      const merged: DeliveryAssignmentRecord = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(item).filter(([, value]) => value !== undefined && value !== null && value !== "")
        ),
        id: existing.id || item.id,
        source: existing.source === item.source ? existing.source : "mixed",
        source_label: existing.source === item.source ? existing.source_label : "Manual + Automation Center",
        assignment_count: Math.max(existing.assignment_count || 0, item.assignment_count || 0),
        associate_names: Array.from(new Set([...(existing.associate_names || []), ...(item.associate_names || [])])),
        notes: existing.notes || item.notes,
      };
      return items.map((existingItem, index) => (index === existingIndex ? merged : existingItem));
    }, []);
  }, [assignments, projectAssignments, projects]);
  const coachName = (id?: string) => coaches.find((coach) => coach.id === id)?.name || "Associate";
  const activeAssociateCount = coaches.filter((coach) => (coach.status || "").toLowerCase() === "active").length;
  const prospectAssociateCount = coaches.filter((coach) => (coach.status || "").toLowerCase() === "prospect").length;

  const submitCoachOp = async (
    resource: "assignments" | "availability" | "sessions" | "documents",
    payload: Record<string, string>
  ) => {
    setOpsError("");
    try {
      await onAction(`/api/admin/coach-ops?resource=${resource}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setOpsModalOpen(false);
      await onRefresh();
    } catch (error) {
      setOpsError(error instanceof Error ? error.message : "Gagal menyimpan data Project Assignment.");
    }
  };

  const deleteCoachOp = async (
    resource: "assignments" | "availability" | "sessions" | "documents",
    id?: string
  ) => {
    if (!id) return;
    setConfirmAction({
      title: "Hapus data Project Assignment?",
      description: "Data ini akan dihapus dari modul assignment terkait. Pastikan data memang tidak lagi dibutuhkan.",
      confirmLabel: "Hapus Data",
      tone: "danger",
      onConfirm: async () => {
        setOpsError("");
        try {
          await onAction(`/api/admin/coach-ops?resource=${resource}&id=${id}`, { method: "DELETE" });
          await onRefresh();
        } catch (error) {
          setOpsError(error instanceof Error ? error.message : "Gagal menghapus data Project Assignment.");
        }
      },
    });
    return;
  };

  const submitCoach = async () => {
    setSaving(true);
    setActionError("");
    try {
      await onAction("/api/admin/coaches", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(editingId ? { id: editingId, ...form } : form),
      });
      setForm(emptyCoach);
      setEditingId(null);
      setAssociateModalOpen(false);
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyimpan data associate.");
    } finally {
      setSaving(false);
    }
  };

  const uploadCv = async (file?: File | null) => {
    if (!file) return;
    setUploadingCv(true);
    setActionError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Sesi admin tidak ditemukan.");

      const payload = new FormData();
      payload.append("file", file);
      payload.append("associateId", editingId || form.name || "new-associate");

      const response = await fetch("/api/admin/associate-documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Gagal upload CV.");
      }
      setForm((current) => ({ ...current, cvUrl: `${json.bucket}/${json.path}` }));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal upload CV.");
    } finally {
      setUploadingCv(false);
    }
  };

  const extractLinkedIn = async () => {
    setExtractingLinkedIn(true);
    setActionError("");
    try {
      const result = await onAction("/api/admin/linkedin-extract", {
        method: "POST",
        body: JSON.stringify({
          linkedinUrl: form.linkedinUrl,
          profileText: form.linkedinSummary,
        }),
      }) as { extracted?: { summary?: string; recommendedCategory?: string; headline?: string; experienceSummary?: string } };

      const extracted = result.extracted || {};
      setForm((current) => ({
        ...current,
        category: extracted.recommendedCategory || current.category,
        linkedinSummary: extracted.summary || [extracted.headline, extracted.experienceSummary].filter(Boolean).join("\n") || current.linkedinSummary,
      }));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal ekstrak LinkedIn.");
    } finally {
      setExtractingLinkedIn(false);
    }
  };

  const editCoach = (coach: CoachRecord) => {
    setEditingId(coach.id || null);
    setAssociateModalOpen(true);
    setForm({
      name: coach.name || "",
      email: coach.email || "",
      phone: coach.phone || "",
      expertise: coach.expertise || "",
      field: coach.field || "",
      category: coach.category || "Assessor (Insight)",
      rate: coach.rate || "",
      availability: coach.availability || "",
      cvUrl: coach.cvUrl || "",
      linkedinUrl: coach.linkedinUrl || "",
      linkedinSummary: coach.linkedinSummary || "",
      status: coach.status || "active",
      bio: coach.bio || "",
      notes: coach.notes || "",
    });
  };

  const deleteCoach = async (coach: CoachRecord) => {
    if (!coach.id) return;
    setConfirmAction({
      title: `Hapus associate ${coach.name || ""}?`,
      description: "Data associate akan dihapus dari daftar. Pastikan associate tidak sedang dipakai dalam assignment aktif.",
      confirmLabel: "Hapus Associate",
      tone: "danger",
      details: [coach.email || "Email tidak tersedia", coach.category || "Kategori belum diisi"],
      onConfirm: async () => {
        setActionError("");
        try {
          await onAction(`/api/admin/coaches?id=${coach.id}`, { method: "DELETE" });
          await onRefresh();
        } catch (error) {
          setActionError(error instanceof Error ? error.message : "Gagal menghapus data associate.");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
      <div className="rounded-[8px] border border-[#D9A441]/25 bg-[#FFF8EA] p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B6C17]">
          {mode === "coach" ? "Associate Network" : "Project Assignment"}
        </p>
        <h3 className="mt-3 text-3xl font-light tracking-[-0.04em] text-[#0B2C6B]">
          {mode === "coach"
            ? "Pool associate disiapkan sebagai fondasi matching dan invitation."
            : "Delivery tracker menghubungkan associate, program, sesi, dan dokumen."}
        </h3>
        <p className="mt-4 max-w-3xl text-sm font-light leading-relaxed text-black/58">
          {mode === "coach"
            ? "Lengkapi data inti sebelum associate dipakai untuk automation. Kategori sudah mencakup assessor, facilitator, trainer, project manager, coach, travel, event, dan konsultan spesialis."
            : "Gunakan modul ini setelah project bergerak ke delivery agar assignment, availability, histori sesi, evaluasi, dan kontrak tidak tercecer."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Associate" value={coaches.length} icon={BriefcaseBusiness} />
        <StatCard label="Active" value={activeAssociateCount} icon={CheckCircle2} tone="success" />
        <StatCard label="Prospect" value={prospectAssociateCount} icon={AlertCircle} tone="gold" />
        <StatCard
          label={mode === "coach" ? "Filter aktif" : "Data assignment"}
          value={mode === "coach" ? filteredCoaches.length : normalizedDeliveryAssignments.length + sessions.length + availability.length + documents.length}
          icon={Layers3}
        />
      </div>

      <GuidancePanel
        title={mode === "coach" ? "Panduan Associate Network" : "Panduan Project Assignment"}
        items={
          mode === "coach"
            ? [
                "Lengkapi nama, bidang, kategori, availability, CV, LinkedIn, dan catatan sebelum associate dipakai untuk matching.",
                "Gunakan status prospect untuk kandidat baru dan active untuk associate yang siap diundang.",
                "Hapus data hanya jika tidak terhubung ke assignment aktif.",
              ]
            : [
                "Assignment mencatat pasangan associate, klien, program, sesi, availability, dan dokumen kerja sama.",
                "Gunakan modul ini untuk tracking delivery setelah project masuk tahap eksekusi.",
                "Penghapusan assignment/dokumen selalu melewati konfirmasi agar tidak salah hapus data operasional.",
              ]
        }
      />

      {mode === "coach" && (
      <div className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_16px_50px_-44px_rgba(11,44,107,0.28)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Associate Input</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#0B2C6B]">Tambah associate dari modal.</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/52">
              Form profil, CV, LinkedIn, dan catatan disimpan di pop-up agar daftar associate tetap mudah discan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyCoach);
              setAssociateModalOpen(true);
            }}
            className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            <Plus size={15} /> Tambah Associate
          </button>
        </div>
      </div>
      )}

      {mode === "coach" && associateModalOpen && (
      <AdminModal
        title={editingId ? "Edit Data Associate" : "Tambah Associate Manual"}
        eyebrow="Associate input"
        onClose={() => {
          setAssociateModalOpen(false);
          setEditingId(null);
          setForm(emptyCoach);
        }}
      >
        {actionError && <AdminNotice>{actionError}</AdminNotice>}
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <FormSection
            title="1. Profil dasar"
            description="Data inti untuk pencarian, filtering, dan matching associate ke project."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <AdminInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Contoh: Andi Pratama" help="Wajib diisi. Nama ini tampil di kartu associate dan daftar pilihan assignment." />
              <AdminInput label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="andi@email.com" type="email" help="Dipakai untuk invitation, komunikasi project, dan tombol email cepat." />
              <AdminInput label="Telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="+62 812..." type="tel" help="Nomor kontak internal untuk koordinasi cepat." />
              <label className="block">
                <FieldLabel label="Bidang" help="Bidang besar associate, misalnya People Development, AI, Project Management, atau Event." />
                <AdminSelect value={form.field} onChange={(value) => setForm({ ...form, field: value })} options={[["", "Pilih bidang"], ...ASSOCIATE_FIELD_OPTIONS]} ariaLabel="Pilih bidang associate" />
              </label>
              <AdminInput label="Keahlian" value={form.expertise} onChange={(value) => setForm({ ...form, expertise: value })} placeholder="Contoh: leadership, OKR, change adoption" help="Gunakan kata kunci spesifik agar pencarian dan matching lebih akurat." />
              <label className="block">
                <FieldLabel label="Kategori" help="Kategori operasional menentukan peran associate dalam delivery." />
                <AdminSelect value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categoryOptions} ariaLabel="Pilih kategori associate" />
              </label>
              <AdminInput label="Rate" value={form.rate} onChange={(value) => setForm({ ...form, rate: value })} placeholder="Contoh: Rp3.500.000/sesi" help="Catatan rate internal. Format bebas agar fleksibel mengikuti skema kerja sama." />
              <label className="block">
                <FieldLabel label="Availability" help="Ketersediaan umum associate untuk screening awal sebelum invitation." />
                <AdminSelect value={form.availability} onChange={(value) => setForm({ ...form, availability: value })} options={[["", "Pilih availability"], ...AVAILABILITY_OPTIONS]} ariaLabel="Pilih availability associate" />
              </label>
            </div>
          </FormSection>

          <FormSection
            title="2. Status dan positioning"
            description="Gunakan status untuk membedakan associate siap jalan, prospect, atau arsip."
          >
            <div className="grid gap-3">
              <label className="block">
                <FieldLabel label="Status" help="Active siap dimatching, prospect masih kandidat, inactive/archived tidak diprioritaskan." />
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className="h-11 w-full rounded-[10px] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#D9A441]"
                  aria-label="Pilih status associate"
                >
                  <option value="active">Active</option>
                  <option value="prospect">Prospect</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <AdminInput
                label="Bio singkat"
                value={form.bio}
                onChange={(value) => setForm({ ...form, bio: value })}
                placeholder="Contoh: Facilitator senior untuk leadership dan culture activation."
                help="Ringkasan pendek yang tampil di kartu associate."
              />
              <AdminInput
                label="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={(value) => setForm({ ...form, linkedinUrl: value })}
                placeholder="https://linkedin.com/in/..."
                type="url"
                help="URL profil untuk referensi manual dan ekstraksi ringkasan."
              />
            </div>
          </FormSection>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <FormSection
            title="3. CV dan LinkedIn"
            description="Lampiran dan ringkasan profil membantu admin melakukan review sebelum matching."
          >
            <div className="grid gap-3">
              <label className="block rounded-[10px] border border-dashed border-black/12 bg-white px-3 py-3">
                <FieldLabel label="Upload Lampiran CV" help="File disimpan ke storage privat dan path-nya dipakai sebagai referensi internal associate." />
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => uploadCv(event.target.files?.[0])}
                  className="block w-full text-xs text-black/58 file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#0B2C6B] file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.12em] file:text-white"
                />
                {form.cvUrl && <span className="mt-2 block break-all text-xs text-[#0B2C6B]/70">{form.cvUrl}</span>}
              </label>
              <div className="flex h-12 items-center rounded-[10px] border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#0B2C6B]">
                {uploadingCv ? "Uploading..." : form.cvUrl ? "CV Tersimpan" : "Belum Ada CV"}
              </div>
              <button
                type="button"
                onClick={extractLinkedIn}
                disabled={extractingLinkedIn || !form.linkedinUrl}
                title="Mengambil ringkasan dari URL/teks LinkedIn yang diberikan admin."
                className="h-11 rounded-[10px] border border-[#D9A441]/40 bg-[#FFF8EA] px-4 text-xs font-bold uppercase tracking-[0.14em] text-[#9B6C17] disabled:opacity-50"
              >
                {extractingLinkedIn ? "Mengekstrak..." : "Ekstrak LinkedIn"}
              </button>
            </div>
          </FormSection>

          <FormSection
            title="4. Catatan profil"
            description="Simpan konteks yang biasanya tidak ada di CV, seperti preferensi project dan catatan kerja sama."
          >
            <AdminTextarea
              label="Ringkasan LinkedIn"
              value={form.linkedinSummary}
              onChange={(value) => setForm({ ...form, linkedinSummary: value })}
              placeholder="Tempel teks profil/export LinkedIn di sini, lalu klik Ekstrak LinkedIn untuk mengisi field otomatis..."
              help="Bisa diisi manual atau dari hasil ekstraksi. Informasi ini ikut muncul pada kartu associate jika bio kosong."
              minHeight="min-h-24"
            />
            <div className="mt-3">
              <AdminTextarea
                label="Catatan internal"
                value={form.notes}
                onChange={(value) => setForm({ ...form, notes: value })}
                placeholder="Catatan internal associate, preferensi penugasan, histori kerja sama..."
                help="Catatan operasional untuk tim internal. Tidak dikirim ke associate atau klien."
                minHeight="min-h-24"
              />
              <PresetButtons options={NOTE_PRESETS} onPick={(value) => setForm({ ...form, notes: value })} />
            </div>
          </FormSection>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={submitCoach}
            disabled={saving || !form.name}
            title={editingId ? "Menyimpan perubahan data associate." : "Menambahkan associate baru ke pool internal."}
            className="flex h-11 items-center gap-2 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
          >
            {editingId ? <Save size={15} /> : <Plus size={15} />} {editingId ? "Simpan Associate" : "Tambah Associate"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm(emptyCoach);
                setAssociateModalOpen(false);
              }}
              className="h-11 rounded-[10px] border border-black/10 bg-white px-4 text-xs font-bold uppercase tracking-[0.14em]"
            >
              Batal Edit
            </button>
          )}
        </div>
      </AdminModal>
      )}

      {mode === "hrm" && (
      <>
      <div className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_16px_50px_-44px_rgba(11,44,107,0.28)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Project Assignment</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#0B2C6B]">Tambah data delivery dari modal.</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/52">
              Assignment, availability, sesi, dan dokumen tetap tersedia, tetapi formnya tidak memenuhi dashboard utama.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpsModalOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            <Plus size={15} /> Tambah Data Assignment
          </button>
        </div>
      </div>

      {opsModalOpen && (
      <AdminModal
        title="Project Assignment"
        eyebrow="Assignment, availability, session, contract"
        onClose={() => setOpsModalOpen(false)}
      >
        {opsError && <AdminNotice>{opsError}</AdminNotice>}
        <div className="grid gap-4 xl:grid-cols-2">
          <CollapsibleModule title="Assignment ke Program" defaultOpen>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <FieldLabel label="Associate" help="Pilih associate yang bertanggung jawab pada program atau delivery ini." />
                <AdminSelect value={assignmentForm.coach_id} onChange={(value) => setAssignmentForm({ ...assignmentForm, coach_id: value })} options={[["", "Pilih associate"], ...coachOptions]} ariaLabel="Pilih associate assignment" />
              </label>
              <AdminInput label="Klien" value={assignmentForm.client_name} onChange={(value) => setAssignmentForm({ ...assignmentForm, client_name: value })} placeholder="Contoh: PT Nusantara Energi" help="Wajib diisi. Nama klien menjadi identitas utama assignment." />
              <AdminInput label="Program" value={assignmentForm.program_name} onChange={(value) => setAssignmentForm({ ...assignmentForm, program_name: value })} placeholder="Contoh: Culture Sprint Batch 1" help="Nama program membantu tracking sesi dan dokumen terkait." />
              <label className="block">
                <FieldLabel label="Layanan" help="Layanan membantu membedakan jenis delivery dalam daftar assignment." />
                <AdminSelect value={assignmentForm.service} onChange={(value) => setAssignmentForm({ ...assignmentForm, service: value })} options={[["", "Pilih layanan"], ...ADMIN_SERVICE_OPTIONS]} ariaLabel="Pilih layanan assignment" />
              </label>
              <AdminInput label="Mulai" value={assignmentForm.start_date} onChange={(value) => setAssignmentForm({ ...assignmentForm, start_date: value })} type="date" help="Tanggal mulai delivery untuk planning internal." />
              <AdminInput label="Selesai" value={assignmentForm.end_date} onChange={(value) => setAssignmentForm({ ...assignmentForm, end_date: value })} type="date" help="Tanggal target selesai atau akhir periode assignment." />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
              <label className="block">
                <FieldLabel label="Status" help="Gunakan Active untuk assignment berjalan dan Completed saat delivery selesai." />
                <AdminSelect value={assignmentForm.status} onChange={(value) => setAssignmentForm({ ...assignmentForm, status: value })} options={["Planned", "Active", "Completed", "Paused", "Cancelled"]} ariaLabel="Pilih status assignment" />
              </label>
              <AdminTextarea label="Catatan assignment" value={assignmentForm.notes} onChange={(value) => setAssignmentForm({ ...assignmentForm, notes: value })} placeholder="Catatan assignment..." help="Catatan konteks delivery, risiko, atau kebutuhan koordinasi." minHeight="min-h-20" />
            </div>
            <PresetButtons options={NOTE_PRESETS} onPick={(value) => setAssignmentForm({ ...assignmentForm, notes: value })} />
            <button onClick={() => submitCoachOp("assignments", assignmentForm)} disabled={!assignmentForm.coach_id || !assignmentForm.client_name} title="Menyimpan hubungan associate dengan klien/program." className="mt-3 h-11 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
              Simpan Assignment
            </button>
          </CollapsibleModule>

          <CollapsibleModule title="Availability Associate">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <FieldLabel label="Associate" help="Pilih associate yang availability-nya akan dicatat." />
                <AdminSelect value={availabilityForm.coach_id} onChange={(value) => setAvailabilityForm({ ...availabilityForm, coach_id: value })} options={[["", "Pilih associate"], ...coachOptions]} ariaLabel="Pilih associate availability" />
              </label>
              <label className="block">
                <FieldLabel label="Hari" help="Hari ketersediaan umum untuk planning project." />
                <AdminSelect value={availabilityForm.day_of_week} onChange={(value) => setAvailabilityForm({ ...availabilityForm, day_of_week: value })} options={["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]} ariaLabel="Pilih hari availability" />
              </label>
              <label className="block">
                <FieldLabel label="Jam" help="Slot waktu yang bisa digunakan untuk sesi atau delivery." />
                <AdminSelect value={availabilityForm.time_window} onChange={(value) => setAvailabilityForm({ ...availabilityForm, time_window: value })} options={[["", "Pilih jam"], ...TIME_WINDOW_OPTIONS]} ariaLabel="Pilih jam availability" />
              </label>
              <label className="block">
                <FieldLabel label="Mode" help="Mode delivery yang tersedia untuk slot ini." />
                <AdminSelect value={availabilityForm.mode} onChange={(value) => setAvailabilityForm({ ...availabilityForm, mode: value })} options={["Online", "Offline", "Hybrid"]} ariaLabel="Pilih mode availability" />
              </label>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
              <label className="block">
                <FieldLabel label="Status" help="Limited berarti masih bisa dipakai, tetapi perlu konfirmasi lebih dulu." />
                <AdminSelect value={availabilityForm.status} onChange={(value) => setAvailabilityForm({ ...availabilityForm, status: value })} options={["Available", "Limited", "Unavailable"]} ariaLabel="Pilih status availability" />
              </label>
              <AdminTextarea label="Catatan availability" value={availabilityForm.notes} onChange={(value) => setAvailabilityForm({ ...availabilityForm, notes: value })} placeholder="Catatan availability..." help="Catatan batasan jadwal, preferensi lokasi, atau kebutuhan konfirmasi." minHeight="min-h-20" />
            </div>
            <PresetButtons options={["Tersedia untuk project prioritas.", "Perlu konfirmasi H-7 sebelum sesi.", "Prefer online untuk minggu ini.", "Slot terbatas karena project berjalan."]} onPick={(value) => setAvailabilityForm({ ...availabilityForm, notes: value })} />
            <button onClick={() => submitCoachOp("availability", availabilityForm)} disabled={!availabilityForm.coach_id || !availabilityForm.time_window} title="Menyimpan slot availability associate." className="mt-3 h-11 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
              Simpan Availability
            </button>
          </CollapsibleModule>

          <CollapsibleModule title="Histori Sesi & Evaluasi">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <FieldLabel label="Associate" help="Associate yang menjalankan atau memfasilitasi sesi." />
                <AdminSelect value={sessionForm.coach_id} onChange={(value) => setSessionForm({ ...sessionForm, coach_id: value })} options={[["", "Pilih associate"], ...coachOptions]} ariaLabel="Pilih associate sesi" />
              </label>
              <label className="block">
                <FieldLabel label="Assignment" help="Hubungkan sesi ke assignment jika sudah tersedia." />
                <AdminSelect value={sessionForm.assignment_id} onChange={(value) => setSessionForm({ ...sessionForm, assignment_id: value })} options={[["", "Tanpa assignment"], ...assignmentOptions]} ariaLabel="Pilih assignment sesi" />
              </label>
              <AdminInput label="Tanggal & Jam sesi" value={sessionForm.session_date} onChange={(value) => setSessionForm({ ...sessionForm, session_date: value })} type="datetime-local" help="Wajib diisi untuk histori sesi." />
              <label className="block">
                <FieldLabel label="Durasi" help="Durasi sesi dalam menit." />
                <AdminSelect value={sessionForm.duration_minutes} onChange={(value) => setSessionForm({ ...sessionForm, duration_minutes: value })} options={DURATION_OPTIONS.map((value) => [value, `${value} menit`] as [string, string])} ariaLabel="Pilih durasi sesi" />
              </label>
              <AdminInput label="Topik" value={sessionForm.topic} onChange={(value) => setSessionForm({ ...sessionForm, topic: value })} placeholder="Contoh: Alignment sponsor dan adoption blocker" help="Topik membantu membaca histori sesi tanpa membuka detail panjang." />
              <label className="block">
                <FieldLabel label="Rating" help="Rating internal 1-5 untuk kualitas sesi atau kepuasan delivery." />
                <AdminSelect value={sessionForm.rating} onChange={(value) => setSessionForm({ ...sessionForm, rating: value })} options={["1", "2", "3", "4", "5"]} ariaLabel="Pilih rating sesi" />
              </label>
            </div>
            <div className="mt-3">
              <AdminTextarea label="Evaluasi sesi" value={sessionForm.evaluation} onChange={(value) => setSessionForm({ ...sessionForm, evaluation: value })} placeholder="Ringkasan evaluasi sesi..." help="Ringkasan outcome, blocker, dan rekomendasi tindak lanjut setelah sesi." minHeight="min-h-20" />
            </div>
            <PresetButtons options={["Sesi berjalan baik, perlu follow up materi.", "Klien butuh keputusan sponsor sebelum lanjut.", "Ada blocker eksekusi yang perlu diprioritaskan.", "Rekomendasi lanjut ke workshop berikutnya."]} onPick={(value) => setSessionForm({ ...sessionForm, evaluation: value })} />
            <button onClick={() => submitCoachOp("sessions", sessionForm)} disabled={!sessionForm.coach_id || !sessionForm.session_date} title="Menyimpan histori sesi dan evaluasi delivery." className="mt-3 h-11 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
              Simpan Sesi
            </button>
          </CollapsibleModule>

          <CollapsibleModule title="Dokumen & Kontrak">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <FieldLabel label="Associate" help="Associate yang terkait dengan dokumen ini." />
                <AdminSelect value={documentForm.coach_id} onChange={(value) => setDocumentForm({ ...documentForm, coach_id: value })} options={[["", "Pilih associate"], ...coachOptions]} ariaLabel="Pilih associate dokumen" />
              </label>
              <label className="block">
                <FieldLabel label="Jenis Dokumen" help="Kategori dokumen untuk memudahkan tracking kontrak, NDA, invoice, atau sertifikat." />
                <AdminSelect value={documentForm.document_type} onChange={(value) => setDocumentForm({ ...documentForm, document_type: value })} options={["Kontrak", "NDA", "CV", "LinkedIn Export", "Sertifikat", "Invoice", "Lainnya"]} ariaLabel="Pilih jenis dokumen" />
              </label>
              <AdminInput label="Judul" value={documentForm.title} onChange={(value) => setDocumentForm({ ...documentForm, title: value })} placeholder="Contoh: PKS Facilitator Batch 1" help="Wajib diisi. Judul akan tampil di daftar dokumen associate." />
              <AdminInput label="Link dokumen" value={documentForm.document_url} onChange={(value) => setDocumentForm({ ...documentForm, document_url: value })} placeholder="https://..." type="url" help="Gunakan URL penyimpanan internal/drive yang bisa diakses tim terkait." />
              <AdminInput label="Masa berlaku" value={documentForm.expiry_date} onChange={(value) => setDocumentForm({ ...documentForm, expiry_date: value })} type="date" help="Isi jika dokumen memiliki tanggal kedaluwarsa atau review." />
              <label className="block">
                <FieldLabel label="Status" help="Gunakan Review untuk dokumen yang belum final, Active untuk dokumen siap pakai." />
                <AdminSelect value={documentForm.status} onChange={(value) => setDocumentForm({ ...documentForm, status: value })} options={["Active", "Review", "Expired", "Archived"]} ariaLabel="Pilih status dokumen" />
              </label>
            </div>
            <div className="mt-3">
              <AdminTextarea label="Catatan dokumen" value={documentForm.notes} onChange={(value) => setDocumentForm({ ...documentForm, notes: value })} placeholder="Catatan dokumen..." help="Catatan legal, status tanda tangan, atau kebutuhan update dokumen." minHeight="min-h-20" />
            </div>
            <PresetButtons options={["Perlu review legal sebelum dikirim.", "Dokumen siap dikirim ke associate.", "Menunggu tanda tangan pihak terkait.", "Perlu diperbarui sebelum project mulai."]} onPick={(value) => setDocumentForm({ ...documentForm, notes: value })} />
            <button onClick={() => submitCoachOp("documents", documentForm)} disabled={!documentForm.coach_id || !documentForm.title} title="Menyimpan metadata dokumen associate." className="mt-3 h-11 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50">
              Simpan Dokumen
            </button>
          </CollapsibleModule>
        </div>
      </AdminModal>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Assignment Aktif" action={`${normalizedDeliveryAssignments.length} project`}>
          <HrmList
            items={normalizedDeliveryAssignments}
            empty="Belum ada assignment."
            render={(item) => (
              <HrmItem
                title={`${item.program_name || "Program"} - ${item.client_name || "Klien"}`}
                meta={[
                  item.source_label,
                  item.source === "manual" ? coachName(item.coach_id) : `${item.assignment_count || 0} assignment AI`,
                  item.service || "Layanan",
                  item.status || "Planned",
                ].join(" / ")}
                detail={
                  item.associate_names?.length
                    ? `${item.notes || "Project dari Automation Center."} Associate: ${item.associate_names.join(", ")}.`
                    : item.notes
                }
                onDelete={item.source === "manual" ? () => deleteCoachOp("assignments", item.id) : undefined}
              />
            )}
          />
        </Panel>

        <Panel title="Availability" action={`${availability.length} records`}>
          <HrmList
            items={availability}
            empty="Belum ada availability."
            render={(item) => (
              <HrmItem
                title={`${coachName(item.coach_id)} - ${item.day_of_week || "Hari"}`}
                meta={`${item.time_window || "-"} / ${item.mode || "Mode"} / ${item.status || "Available"}`}
                detail={item.notes}
                onDelete={() => deleteCoachOp("availability", item.id)}
              />
            )}
          />
        </Panel>

        <Panel title="Histori Sesi" action={`${sessions.length} records`}>
          <HrmList
            items={sessions}
            empty="Belum ada histori sesi."
            render={(item) => (
              <HrmItem
                title={`${coachName(item.coach_id)} - ${item.topic || "Sesi"}`}
                meta={`${item.session_date || "-"} / ${item.duration_minutes || 0} menit / Rating ${item.rating || "-"}`}
                detail={item.evaluation || item.notes}
                onDelete={() => deleteCoachOp("sessions", item.id)}
              />
            )}
          />
        </Panel>

        <Panel title="Dokumen Associate" action={`${documents.length} records`}>
          <HrmList
            items={documents}
            empty="Belum ada dokumen."
            render={(item) => (
              <HrmItem
                title={item.title || "Dokumen"}
                meta={`${coachName(item.coach_id)} / ${item.document_type || "Dokumen"} / ${item.status || "Active"}`}
                detail={item.document_url || item.notes}
                onDelete={() => deleteCoachOp("documents", item.id)}
              />
            )}
          />
        </Panel>
      </div>
      </>
      )}

      {mode === "coach" && (
      <Panel title="Daftar Associate" action={`${filteredCoaches.length}/${coaches.length} records`}>
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px_160px]">
          <AdminSearch value={search} onChange={setSearch} placeholder="Cari nama, email, bidang, keahlian, LinkedIn..." />
          <AdminSelect value={fieldFilter} onChange={setFieldFilter} options={["Semua", ...fieldOptions]} />
          <AdminSelect value={categoryFilter} onChange={setCategoryFilter} options={["Semua", ...categoryOptions]} />
          <AdminSelect value={statusFilter} onChange={setStatusFilter} options={["Semua", ...statusOptions]} />
        </div>
        {filteredCoaches.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCoaches.map((coach, index) => (
              <div key={coach.id || index} className="rounded-[12px] border border-black/[0.05] bg-[#FCFCFB] p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#0B2C6B] text-[#D9A441]">
                  <BriefcaseBusiness size={19} />
                </div>
                <p className="text-base font-semibold">{coach.name || "Associate BinaHub"}</p>
                <p className="mt-1 text-sm text-black/48">{coach.expertise || coach.field || "Bidang belum diisi"}</p>
                <p className="mt-4 text-xs leading-relaxed text-black/48">{coach.bio || coach.linkedinSummary || "Profil associate akan tampil di sini setelah data dilengkapi."}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge>{coach.category || "Associate"}</Badge>
                  <Badge tone="gold">{coach.status || "active"}</Badge>
                  {coach.availability && <Badge>{coach.availability}</Badge>}
                </div>
                <div className="mt-5 flex gap-2">
                  <button onClick={() => editCoach(coach)} className="h-10 flex-1 rounded-[10px] border border-black/10 bg-white text-xs font-bold uppercase tracking-[0.12em]">
                    Edit
                  </button>
                  {coach.email && (
                    <a
                      href={`mailto:${coach.email}`}
                      className="grid h-10 w-10 place-items-center rounded-[10px] border border-black/10 bg-white"
                      aria-label={`Email ${coach.name || "associate"}`}
                    >
                      <Mail size={14} />
                    </a>
                  )}
                  {coach.linkedinUrl && (
                    <a
                      href={coach.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-10 w-10 place-items-center rounded-[10px] border border-black/10 bg-white"
                      aria-label={`Buka LinkedIn ${coach.name || "associate"}`}
                    >
                      <Eye size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => deleteCoach(coach)}
                    className="grid h-10 w-10 place-items-center rounded-[10px] border border-red-100 bg-red-50 text-red-600"
                    aria-label={`Hapus ${coach.name || "associate"}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tidak ada associate yang cocok."
            description="Reset pencarian atau ubah filter bidang, kategori, dan status. Jika database masih kosong, tambahkan associate dari form manual di atas."
            action={{
              label: "Reset Filter",
              onClick: () => {
                setSearch("");
                setFieldFilter("Semua");
                setCategoryFilter("Semua");
                setStatusFilter("Semua");
              },
            }}
          />
        )}
      </Panel>
      )}
    </div>
  );
}
