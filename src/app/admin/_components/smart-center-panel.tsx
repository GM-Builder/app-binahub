"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, Layers3, MailWarning, ShieldAlert } from "lucide-react";
import {
  AdminInput,
  AdminModal,
  AdminNotice,
  AdminSelect,
  AdminTextarea,
  Badge,
  CollapsibleModule,
  CompactStatusPill,
  ConfirmDialog,
  EmptyState,
  FieldLabel,
  FormSection,
  Panel,
  PresetButtons,
} from "./shared";
import {
  ADMIN_SERVICE_OPTIONS,
  BUDGET_NOTE_OPTIONS,
  PROJECT_SCOPE_PRESETS,
  PROJECT_TYPE_OPTIONS,
} from "../_lib/constants";
import { formatDate, isProjectCompleted } from "../_lib/utils";
import type { ConfirmAction, DashboardData, ProjectAssignmentSmartRecord, ProjectRecord, SmartActionRecord } from "../_lib/types";

export function SmartCenterPanel({
  data,
  onAction,
  onRefresh,
}: {
  data: DashboardData;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
}) {
  const projects = data.projects || [];
  const projectAssignments = data.projectAssignments || [];
  const smartActions = data.smartActions || [];
  const completedProjects = projects.filter(isProjectCompleted);
  const activeProjects = projects.filter((project) => !isProjectCompleted(project));
  const pendingActions = smartActions.filter((action) => (action.status || "").toLowerCase() === "pending");
  const activeSmartActions = smartActions.filter((action) => /pending|in progress/i.test(action.status || "Pending"));
  const activeProjectIds = new Set(activeProjects.map((project) => project.id).filter(Boolean));
  const activeProjectAssignments = projectAssignments.filter((assignment) => activeProjectIds.has(assignment.project_id));
  const sentInvitations = activeProjectAssignments.filter((assignment) => assignment.invitation_sent_at).length;
  const failedInvitations = activeProjectAssignments.filter((assignment) => /failed|gagal/i.test(assignment.status || "")).length;
  const runningProjects = projects.filter((project) => /running/i.test(project.status || "")).length;
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    contact_name: "",
    contact_email: "",
    service: "",
    program_name: "",
    project_type: "Transformation",
    scope: "",
    budget_note: "",
    start_date: "",
    end_date: "",
    automation_mode: "autopilot",
    status: "Draft",
  });

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const confirmAndRun = (action: ConfirmAction) => setConfirmAction(action);
  const isEmailValid = !form.contact_email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim());
  const isProjectFormReady = Boolean(
    form.client_name.trim() &&
    form.program_name.trim() &&
    form.contact_email.trim() &&
    form.service.trim() &&
    isEmailValid
  );
  const projectAssignmentsFor = (projectId?: string) =>
    projectAssignments.filter((assignment) => assignment.project_id === projectId);
  const projectSmartActionsFor = (projectId?: string) =>
    smartActions.filter((action) => action.target_type === "project" && action.target_id === projectId);
  const hasSentInvitation = (projectId?: string) =>
    projectAssignmentsFor(projectId).some((assignment) => Boolean(assignment.invitation_sent_at));
  const getProject = (projectId?: string) => projects.find((project) => project.id === projectId);
  const getAssignmentSummary = (items: ProjectAssignmentSmartRecord[]) => {
    const draft = items.filter((assignment) => (assignment.status || "").toLowerCase() === "draft").length;
    const sent = items.filter((assignment) => assignment.invitation_sent_at).length;
    const failed = items.filter((assignment) => /failed|gagal/i.test(assignment.status || "")).length;
    return { draft, sent, failed, total: items.length };
  };
  const formatAutopilotResult = (result: unknown, fallback: string) => {
    const payload = result as { matches?: unknown[]; sent?: unknown[] };
    const matchCount = Array.isArray(payload.matches) ? payload.matches.length : 0;
    const sentCount = Array.isArray(payload.sent) ? payload.sent.length : 0;
    if (sentCount) return `${sentCount} undangan terkirim. ${matchCount || sentCount} penugasan diproses.`;
    if (matchCount) return `${matchCount} draf penugasan sudah dibuat.`;
    return fallback;
  };

  const createProject = async (mode: "save" | "draft" | "send") => {
    try {
      setNotice("");
      setBusy(mode);
      const response = (await onAction("/api/admin/projects", {
        method: "POST",
        body: JSON.stringify(form),
      })) as { project?: ProjectRecord };

      if (mode !== "save" && response.project?.id) {
        const autopilotResult = await onAction("/api/admin/project-autopilot", {
          method: "POST",
          body: JSON.stringify({ projectId: response.project.id, sendInvitations: mode === "send" }),
        });
        setNotice(
          formatAutopilotResult(
            autopilotResult,
            mode === "send"
              ? "Proyek dibuat dan undangan diproses."
              : "Proyek dibuat dan draf penugasan sudah disiapkan."
          )
        );
      }

      setForm({
        client_name: "",
        contact_name: "",
        contact_email: "",
        service: "",
        program_name: "",
        project_type: "Transformation",
        scope: "",
        budget_note: "",
        start_date: "",
        end_date: "",
        automation_mode: "autopilot",
        status: "Draft",
      });
      if (mode === "save") {
        setNotice("Proyek tersimpan dan masuk antrean tinjauan.");
      }
      setProjectModalOpen(false);
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Tindakan pada pusat otomasi gagal.");
    } finally {
      setBusy("");
    }
  };

  const runProjectAutopilot = async (projectId?: string, sendInvitations = false) => {
    if (!projectId) return;
    try {
      setNotice("");
      setBusy(`${projectId}-${sendInvitations ? "send" : "draft"}`);
      const result = await onAction("/api/admin/project-autopilot", {
        method: "POST",
        body: JSON.stringify({ projectId, sendInvitations }),
      });
      setNotice(formatAutopilotResult(result, sendInvitations ? "Undangan associate sudah dikirim." : "Draf penugasan sudah diperbarui."));
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Rekomendasi penugasan gagal dijalankan.");
      throw error;
    } finally {
      setBusy("");
    }
  };

  const updateSmartAction = async (action: SmartActionRecord, status: string) => {
    if (!action.id) return;
    try {
      setNotice("");
      setBusy(`${action.id}-${status}`);
      await onAction("/api/admin/smart-actions", {
        method: "PATCH",
        body: JSON.stringify({ id: action.id, status }),
      });
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Status tindakan gagal diubah.");
    } finally {
      setBusy("");
    }
  };

  const executeSmartAction = async (action: SmartActionRecord) => {
    if (!action.target_id) return;
    const shouldSend = action.action_type === "send_associate_invitations";
    if (shouldSend && hasSentInvitation(action.target_id)) {
      setNotice("Undangan untuk proyek ini sudah tercatat terkirim. Tindakan dibatalkan untuk mencegah email ganda.");
      return;
    }
    await runProjectAutopilot(action.target_id, shouldSend);
    await updateSmartAction(action, "Completed");
  };

  const updateProjectStatus = async (projectId: string | undefined, status: string) => {
    if (!projectId) return;
    try {
      setNotice("");
      setBusy(`${projectId}-${status}`);
      await onAction("/api/admin/projects", {
        method: "PATCH",
        body: JSON.stringify({ id: projectId, status }),
      });
      setNotice(status === "Completed" ? "Proyek dipindahkan ke daftar proyek selesai." : "Proyek dikembalikan ke daftar aktif.");
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Status proyek gagal diubah.");
    } finally {
      setBusy("");
    }
  };

  const metrics = [
    { label: "Proyek Aktif", value: activeProjects.length },
    { label: "Menunggu Tinjauan", value: pendingActions.length },
    { label: "Penugasan Aktif", value: activeProjectAssignments.length },
    { label: "Undangan Terkirim", value: sentInvitations },
    { label: "Proses Berjalan", value: runningProjects },
    { label: "Undangan Bermasalah", value: failedInvitations },
  ];

  return (
    <div className="space-y-6">
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {notice && <AdminNotice>{notice}</AdminNotice>}

      <div className="rounded-[8px] border border-[#0B2C6B]/10 bg-white px-4 py-3 shadow-[0_16px_50px_-44px_rgba(11,44,107,0.28)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Kontrol pengiriman</p>
            <p className="mt-1 text-sm leading-relaxed text-[#0B2C6B]/58">
              Hanya proyek aktif yang tampil di ruang kerja. Proyek selesai tetap tersimpan beserta riwayatnya.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {metrics.map((metric) => (
              <CompactStatusPill
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={
                  metric.label === "Menunggu Tinjauan"
                    ? AlertCircle
                    : metric.label === "Undangan Terkirim"
                      ? CheckCircle2
                      : metric.label === "Proses Berjalan"
                        ? ShieldAlert
                        : metric.label === "Undangan Bermasalah"
                          ? MailWarning
                        : metric.label === "Penugasan Aktif"
                          ? Layers3
                          : ClipboardList
                }
                tone={
                  metric.label === "Undangan Bermasalah" && metric.value > 0
                    ? "danger"
                    : metric.label === "Proses Berjalan" && metric.value > 0
                      ? "gold"
                      : metric.label === "Menunggu Tinjauan" && metric.value > 0
                        ? "gold"
                        : "default"
                }
              />
            ))}
            <CompactStatusPill
              label="Draf Aktif"
              value={activeProjectAssignments.filter((assignment) => (assignment.status || "").toLowerCase() === "draft").length}
              icon={Layers3}
            />
            <CompactStatusPill
              label="Menunggu Dikirim"
              value={activeProjectAssignments.filter((assignment) => /pending/i.test(assignment.status || "")).length}
              icon={MailWarning}
              tone="gold"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[#0B2C6B]/10 bg-white p-5 shadow-[0_16px_50px_-44px_rgba(11,44,107,0.28)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Penugasan Proyek</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#0B2C6B]">Buat proyek dan siapkan timnya.</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/52">
              Formulir dibuka saat diperlukan agar ruang kerja tetap fokus pada proyek dan tindakan aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProjectModalOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            + Buat Proyek
          </button>
        </div>
      </div>

      {projectModalOpen && (
      <AdminModal
        title="Buat Proyek & Penugasan"
        eyebrow="Perencanaan tim"
        onClose={() => setProjectModalOpen(false)}
      >
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <FormSection
            title="1. Identitas klien"
            description="Informasi ini menjadi acuan utama untuk proyek dan undangan tim."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Nama Klien"
                value={form.client_name}
                onChange={(value) => setField("client_name", value)}
                placeholder="Contoh: PT Nusantara Energi"
                help="Wajib diisi. Nama ini digunakan pada proyek, penugasan, dan ringkasan undangan."
              />
              <AdminInput
                label="Kontak Utama"
                value={form.contact_name}
                onChange={(value) => setField("contact_name", value)}
                placeholder="Contoh: Ibu Rani, HR Director"
                help="PIC utama klien. Isi nama dan jabatan jika tersedia agar tindak lanjut lebih kontekstual."
              />
              <AdminInput
                label="Email Kontak"
                value={form.contact_email}
                onChange={(value) => setField("contact_email", value)}
                placeholder="nama@perusahaan.com"
                type="email"
                help="Wajib diisi. Email ini digunakan untuk validasi sebelum undangan dikirim."
              />
              <label className="block">
                <FieldLabel label="Layanan" help="Wajib diisi. Layanan membantu sistem menyarankan peran associate dan ruang lingkup yang sesuai." />
                <AdminSelect
                  value={form.service}
                  onChange={(value) => setField("service", value)}
                  options={[["", "Pilih layanan"], ...ADMIN_SERVICE_OPTIONS]}
                  ariaLabel="Pilih layanan proyek"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            title="2. Detail program"
            description="Lengkapi konteks agar peran, jadwal, dan anggaran mudah dipahami."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Nama Program"
                value={form.program_name}
                onChange={(value) => setField("program_name", value)}
                placeholder="Contoh: Leadership Acceleration Q3"
                help="Nama program yang akan muncul di daftar proyek dan undangan associate."
              />
              <label className="block">
                <FieldLabel label="Tipe Proyek" help="Pilih tipe yang paling sesuai agar rekomendasi penugasan lebih tepat." />
                <AdminSelect
                  value={form.project_type}
                  onChange={(value) => setField("project_type", value)}
                  options={PROJECT_TYPE_OPTIONS}
                  ariaLabel="Pilih tipe proyek"
                />
              </label>
              <AdminInput label="Mulai" value={form.start_date} onChange={(value) => setField("start_date", value)} type="date" help="Tanggal mulai bersifat opsional, tetapi membantu associate membaca kesiapan jadwal." />
              <AdminInput label="Selesai" value={form.end_date} onChange={(value) => setField("end_date", value)} type="date" help="Tanggal selesai membantu memperkirakan durasi dan intensitas penugasan." />
              <label className="block md:col-span-2">
                <FieldLabel label="Catatan Anggaran" help="Catatan anggaran membantu menentukan prioritas proyek dan ekspektasi pelaksanaan." />
                <AdminSelect value={form.budget_note} onChange={(value) => setField("budget_note", value)} options={BUDGET_NOTE_OPTIONS} ariaLabel="Pilih catatan anggaran" />
              </label>
            </div>
          </FormSection>
        </div>

        <div className="mt-4">
          <AdminTextarea
            label="3. Ruang Lingkup Proyek"
            value={form.scope}
            onChange={(value) => setField("scope", value)}
            placeholder="Contoh: Self Diagnostic kesiapan, workshop alignment, pendampingan eksekusi, dan pengukuran adoption."
            help="Tuliskan ruang lingkup kerja, hasil yang diharapkan, batasan, dan konteks klien. Informasi yang jelas menghasilkan rekomendasi tim yang lebih tepat."
            minHeight="min-h-32"
          />
          <PresetButtons options={PROJECT_SCOPE_PRESETS} onPick={(value) => setField("scope", value)} />
        </div>

        <div className="mt-5 rounded-[12px] border border-[#0B2C6B]/8 bg-[#F8FAFC] p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-[#0B2C6B]">4. Pilih aksi</p>
            <p className="mt-1 text-xs leading-relaxed text-black/48">
              Simpan untuk ditinjau, atau siapkan rekomendasi penugasan setelah semua kolom wajib terisi.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => createProject("save")}
            disabled={Boolean(busy) || !isProjectFormReady}
            title="Simpan proyek untuk ditinjau terlebih dahulu."
            className="rounded-full border border-[#0B2C6B]/18 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#0B2C6B] disabled:opacity-45"
          >
            Simpan Proyek
          </button>
          <button
            type="button"
            onClick={() =>
              confirmAndRun({
                title: "Siapkan rekomendasi penugasan?",
                description: "Sistem akan membuat draf peran dan rekomendasi associate untuk proyek ini. Belum ada email yang dikirim.",
                confirmLabel: "Siapkan Rekomendasi",
                details: [form.client_name || "Klien belum diisi", form.program_name || "Program belum diisi"],
                onConfirm: () => createProject("draft"),
              })
            }
            disabled={Boolean(busy) || !isProjectFormReady}
            title="Membuat draf peran dan rekomendasi associate tanpa mengirim email."
            className="rounded-full bg-[#0B2C6B] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-45"
          >
            Siapkan Rekomendasi
          </button>
          <button
            type="button"
            onClick={() =>
              confirmAndRun({
                title: "Kirim undangan ke associate?",
                description: "Sistem akan membuat proyek, menyiapkan penugasan, lalu mengirim email undangan ke associate yang direkomendasikan.",
                confirmLabel: "Kirim Undangan",
                tone: "gold",
                details: [
                  `Klien: ${form.client_name || "belum diisi"}`,
                  `Program: ${form.program_name || "belum diisi"}`,
                  `Kontak: ${form.contact_email || "email kontak belum diisi"}`,
                ],
                onConfirm: () => createProject("send"),
              })
            }
            disabled={Boolean(busy) || !isProjectFormReady}
            title="Siapkan penugasan lalu kirim undangan setelah dikonfirmasi."
            className="rounded-full bg-[#D9A441] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#071B3D] disabled:opacity-45"
          >
            Tinjau & Kirim Undangan
          </button>
          </div>
        {!isProjectFormReady && (
          <p className="mt-3 text-xs leading-relaxed text-black/45">
            Isi nama klien, nama program, email kontak yang valid, dan layanan sebelum melanjutkan.
          </p>
        )}
        {!isEmailValid && (
          <p className="mt-2 text-xs font-medium text-red-600">
            Format email kontak belum valid.
          </p>
        )}
        </div>
      </AdminModal>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Tindakan yang Disarankan" action={`${activeSmartActions.length} aktif`}>
          <div className="space-y-3">
            {activeSmartActions.slice(0, 6).map((action) => {
              const actionProject = getProject(action.target_id);
              const actionAssignments = projectAssignmentsFor(action.target_id);
              const actionSummary = getAssignmentSummary(actionAssignments);
              const isSendAction = action.action_type === "send_associate_invitations";
              const canRunAction = action.target_type === "project" && !/completed|dismissed/i.test(action.status || "");
              const blocksDuplicateSend = isSendAction && actionSummary.sent > 0;

              return (
                <CompactSmartActionCard
                  key={action.id || action.title}
                  action={action}
                  project={actionProject}
                  summary={actionSummary}
                  blocked={blocksDuplicateSend}
                  busy={Boolean(busy)}
                  canRun={canRunAction}
                  onRun={() =>
                    confirmAndRun({
                      title: "Jalankan tindakan ini?",
                      description: action.action_type === "send_associate_invitations"
                        ? "Tindakan ini dapat mengirim undangan ke associate. Pastikan proyek dan draf penugasan sudah sesuai."
                        : "Tindakan ini akan menjalankan rekomendasi untuk proyek terkait.",
                      confirmLabel: "Jalankan",
                      tone: action.action_type === "send_associate_invitations" ? "gold" : "navy",
                      details: [
                        action.title || action.action_type || "Tindakan",
                        action.description || "",
                        actionProject ? `Proyek: ${actionProject.program_name || "Proyek baru"} - ${actionProject.client_name || "Tanpa klien"}` : "",
                        `Penugasan saat ini: ${actionSummary.total} total, ${actionSummary.draft} draf, ${actionSummary.sent} terkirim`,
                      ].filter(Boolean),
                      onConfirm: () => executeSmartAction(action),
                    })
                  }
                  onComplete={() => updateSmartAction(action, "Completed")}
                />
              );
            })}
            {activeSmartActions.length === 0 && (
              <EmptyState
                title="Tidak ada tindakan aktif."
                description="Tindakan yang sudah selesai tetap tersimpan pada riwayat masing-masing proyek."
              />
            )}
          </div>
        </Panel>

        <Panel title="Daftar Proyek" action={`${activeProjects.length} aktif / ${completedProjects.length} selesai`}>
          <div className="space-y-3">
            {activeProjects.slice(0, 8).map((project) => {
              const assignments = projectAssignmentsFor(project.id);
              const summary = getAssignmentSummary(assignments);
              const sentAlready = summary.sent > 0;

              return (
              <div key={project.id || project.client_name} className="rounded-[12px] border border-black/[0.06] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge tone="gold">{project.status || "Draft"}</Badge>
                      <Badge>{project.automation_mode || "manual"}</Badge>
                      <Badge>{summary.total} penugasan</Badge>
                      {summary.sent > 0 && <Badge tone="gold">{summary.sent} terkirim</Badge>}
                      {summary.failed > 0 && <Badge tone="gold">{summary.failed} perlu cek</Badge>}
                    </div>
                    <p className="font-semibold text-[#0B2C6B]">{project.program_name || project.service || "Proyek baru"}</p>
                    <p className="mt-1 text-sm text-[#0B2C6B]/60">{project.client_name || "Tanpa nama klien"} {project.contact_email ? `- ${project.contact_email}` : ""}</p>
                    {project.ai_summary && <p className="mt-2 text-sm leading-relaxed text-[#0B2C6B]/62">{project.ai_summary}</p>}
                    {summary.draft > 0 && (
                      <p className="mt-2 text-xs leading-relaxed text-[#0B2C6B]/45">
                        Memperbarui rekomendasi akan mengganti {summary.draft} draf penugasan lama pada proyek ini.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        confirmAndRun({
                          title: "Perbarui rekomendasi penugasan?",
                          description: summary.draft > 0
                            ? "Draf penugasan lama akan diganti dengan hasil terbaru. Data yang sudah terkirim tidak akan berubah."
                            : "Sistem akan membuat draf peran dan rekomendasi associate terbaru untuk proyek ini.",
                          confirmLabel: "Perbarui Rekomendasi",
                          details: [
                            project.program_name || "Proyek baru",
                            project.client_name || "Tanpa nama klien",
                            `${summary.draft} draf penugasan akan diganti`,
                            `${summary.sent} undangan sudah terkirim`,
                          ],
                          onConfirm: () => runProjectAutopilot(project.id, false),
                        })
                      }
                      disabled={Boolean(busy)}
                      className="rounded-full border border-[#0B2C6B]/14 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-45"
                    >
                      Perbarui Rekomendasi
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        confirmAndRun({
                          title: "Kirim undangan untuk proyek ini?",
                          description: sentAlready
                            ? "Undangan sudah tercatat terkirim. Tindakan ini diblokir agar tidak mengirim email ganda."
                            : "Sistem akan menyiapkan penugasan terbaru dan mengirim email ke associate yang sesuai.",
                          confirmLabel: "Kirim Undangan",
                          tone: "gold",
                          details: [
                            project.program_name || "Proyek baru",
                            project.contact_email || "Email kontak belum tersedia",
                            `${summary.total} penugasan saat ini`,
                            `${summary.sent} undangan sudah terkirim`,
                          ],
                          onConfirm: () => runProjectAutopilot(project.id, true),
                        })
                      }
                      disabled={Boolean(busy) || sentAlready}
                      className="rounded-full bg-[#D9A441] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#071B3D] disabled:opacity-45"
                    >
                      {sentAlready ? "Terkirim" : "Kirim"}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProjectStatus(project.id, "Completed")}
                      disabled={Boolean(busy)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 disabled:opacity-45"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
            {activeProjects.length === 0 && (
              <EmptyState
                title="Belum ada proyek aktif."
                description="Proyek yang disimpan akan tampil di sini sampai statusnya selesai."
              />
            )}
            {completedProjects.length > 0 && (
              <CollapsibleModule title={`Proyek selesai (${completedProjects.length})`}>
                <div className="space-y-3">
                  {completedProjects.slice(0, 12).map((project) => {
                    const assignments = projectAssignmentsFor(project.id);
                    return (
                      <CompletedProjectCard
                        key={project.id || project.client_name}
                        project={project}
                        assignments={assignments}
                        smartActions={projectSmartActionsFor(project.id)}
                        busy={Boolean(busy)}
                        onReactivate={() => updateProjectStatus(project.id, "Autopilot Drafted")}
                      />
                    );
                  })}
                </div>
              </CollapsibleModule>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CompletedProjectCard({
  project,
  assignments,
  smartActions,
  busy,
  onReactivate,
}: {
  project: ProjectRecord;
  assignments: ProjectAssignmentSmartRecord[];
  smartActions: SmartActionRecord[];
  busy: boolean;
  onReactivate: () => void;
}) {
  const notContinued = assignments.filter((assignment) =>
    /draft|pending|review|open/i.test(assignment.status || "")
  ).length;
  const sent = assignments.filter((assignment) => assignment.invitation_sent_at).length;
  const completedActions = smartActions.filter((action) => /completed|dismissed/i.test(action.status || ""));
  const openActions = smartActions.filter((action) => /pending|in progress/i.test(action.status || "Pending"));

  return (
    <div className="rounded-[12px] border border-dashed border-emerald-200 bg-emerald-50/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge tone="gold">{project.status || "Completed"}</Badge>
            <Badge>{project.automation_mode || "manual"}</Badge>
            <Badge>{assignments.length} penugasan</Badge>
            {smartActions.length > 0 && <Badge>{smartActions.length} tindakan</Badge>}
            {sent > 0 && <Badge tone="gold">{sent} terkirim</Badge>}
            {notContinued > 0 && <Badge>{notContinued} tidak dilanjutkan</Badge>}
            {openActions.length > 0 && <Badge tone="gold">{openActions.length} belum selesai</Badge>}
          </div>
          <p className="font-semibold text-[#0B2C6B]">{project.program_name || project.service || "Proyek selesai"}</p>
          <p className="mt-1 text-sm text-[#0B2C6B]/56">
            {project.client_name || "Tanpa nama klien"} {project.contact_email ? `- ${project.contact_email}` : ""}
          </p>
          {project.ai_summary && <p className="mt-2 text-sm leading-relaxed text-[#0B2C6B]/54">{project.ai_summary}</p>}
        </div>
        <button
          type="button"
          onClick={onReactivate}
          disabled={busy}
          className="rounded-full border border-[#0B2C6B]/14 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-45"
        >
          Aktifkan Lagi
        </button>
      </div>
      <div className="mt-4">
        <div className="grid gap-3">
          {smartActions.length > 0 ? (
            <CollapsibleModule title={`Riwayat tindakan (${smartActions.length})`}>
              <div className="grid gap-2">
                {smartActions.slice(0, 12).map((action) => (
                  <HistoryRow
                    key={action.id || action.title}
                    title={action.title || action.action_type || "Tindakan"}
                    meta={`${action.status || "Pending"} / ${action.priority || "Normal"} / ${formatDate(action.created_at || "")}`}
                    tone={completedActions.includes(action) ? "muted" : "active"}
                  />
                ))}
              </div>
            </CollapsibleModule>
          ) : (
            <p className="rounded-[10px] border border-emerald-200/70 bg-white/70 px-3 py-2 text-xs leading-relaxed text-[#0B2C6B]/50">
              Tidak ada tindakan tersimpan untuk proyek selesai ini.
            </p>
          )}
          {assignments.length > 0 ? (
            <CollapsibleModule title={`Riwayat penugasan (${assignments.length})`}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {assignments.slice(0, 12).map((assignment) => (
                  <FlipAssignmentCard
                    key={assignment.id || `${assignment.project_id}-${assignment.role_title}`}
                    assignment={assignment}
                    project={project}
                    isFailed={/failed|gagal/i.test(assignment.status || "")}
                    isSent={Boolean(assignment.invitation_sent_at)}
                    muted
                  />
                ))}
              </div>
            </CollapsibleModule>
          ) : (
            <p className="rounded-[10px] border border-emerald-200/70 bg-white/70 px-3 py-2 text-xs leading-relaxed text-[#0B2C6B]/50">
              Tidak ada penugasan tersimpan untuk proyek selesai ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactSmartActionCard({
  action,
  project,
  summary,
  blocked,
  busy,
  canRun,
  onRun,
  onComplete,
}: {
  action: SmartActionRecord;
  project?: ProjectRecord;
  summary: { draft: number; sent: number; failed: number; total: number };
  blocked: boolean;
  busy: boolean;
  canRun: boolean;
  onRun: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-black/[0.06] bg-[#F8FAFC] p-3 transition hover:border-[#D9A441]/40 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge tone={action.status === "Pending" ? "gold" : "navy"}>{action.status === "Pending" ? "Menunggu" : action.status || "Menunggu"}</Badge>
            <Badge>{action.priority === "High" ? "Tinggi" : action.priority === "Low" ? "Rendah" : "Normal"}</Badge>
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#0B2C6B]">
            {action.title || action.action_type}
          </p>
          <p className="mt-1 truncate text-xs text-[#0B2C6B]/45">
            {project?.program_name || "Proyek"} / {summary.total} penugasan
          </p>
        </div>
        <div className="grid min-w-12 place-items-center rounded-[10px] bg-white px-2 py-1 text-center">
          <span className="text-lg font-light tracking-[-0.04em] text-[#0B2C6B]">{summary.draft || summary.total}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/32">draf</span>
        </div>
      </div>
      {blocked && (
        <p className="mt-3 rounded-[9px] border border-[#D9A441]/20 bg-[#FFF8EA] px-3 py-2 text-xs leading-relaxed text-[#9B6C17]">
          Undangan sudah pernah terkirim. Pengiriman ulang diblokir untuk mencegah email ganda.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {canRun && (
          <button
            type="button"
            onClick={onRun}
            disabled={busy || blocked}
            className="rounded-full bg-[#0B2C6B] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-45"
          >
            Jalankan
          </button>
        )}
        <button
          type="button"
          onClick={onComplete}
          disabled={busy}
          className="rounded-full border border-[#0B2C6B]/14 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-45"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

function FlipAssignmentCard({
  assignment,
  project,
  isFailed,
  isSent,
  muted = false,
}: {
  assignment: ProjectAssignmentSmartRecord;
  project?: ProjectRecord;
  isFailed: boolean;
  isSent: boolean;
  muted?: boolean;
}) {
  return (
    <article className={`border p-4 shadow-[0_16px_38px_-34px_rgba(11,44,107,0.34)] ${muted ? "border-black/[0.05] bg-[#F8FAFC]" : "border-black/[0.08] bg-white"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-[#0B2C6B]">{assignment.role_title || "Peran proyek"}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B]/38">{project?.program_name || "Proyek"}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={isSent || isFailed ? "gold" : "navy"}>{assignment.status === "Draft" ? "Draf" : assignment.status || "Draf"}</Badge>
          {typeof assignment.match_score === "number" && <Badge>{assignment.match_score}% sesuai</Badge>}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="text-black/42">Associate</dt><dd className="mt-1 font-semibold text-[#0B2C6B]">{assignment.associate_name || "Belum dipilih"}</dd></div>
        <div><dt className="text-black/42">Klien</dt><dd className="mt-1 font-semibold text-[#0B2C6B]">{project?.client_name || "Belum tersedia"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-black/42">Alasan rekomendasi</dt><dd className="mt-1 leading-relaxed text-[#0B2C6B]/70">{assignment.match_reason || "Alasan rekomendasi belum tersedia."}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-black/[0.06] pt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/42">
        {assignment.agreement_status && <span>{assignment.agreement_status}</span>}
        {assignment.associate_email && <span className="truncate">{assignment.associate_email}</span>}
        {assignment.invitation_sent_at && <span>Dikirim {formatDate(assignment.invitation_sent_at)}</span>}
      </div>
    </article>
  );
}

function HistoryRow({ title, meta, tone = "muted" }: { title: string; meta: string; tone?: "muted" | "active" }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2 ${
        tone === "active"
          ? "border-[#D9A441]/22 bg-[#FFF8EA]"
          : "border-black/[0.05] bg-white"
      }`}
    >
      <p className="line-clamp-1 text-xs font-semibold text-[#0B2C6B]">{title}</p>
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-black/34">{meta}</p>
    </div>
  );
}
