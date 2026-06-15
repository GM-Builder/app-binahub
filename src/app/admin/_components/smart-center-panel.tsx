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
    if (sentCount) return `${sentCount} invitation terkirim. ${matchCount || sentCount} assignment diproses.`;
    if (matchCount) return `${matchCount} draft assignment AI sudah dibuat.`;
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
              ? "Project dibuat dan invitation diproses."
              : "Project dibuat dan draft assignment AI sudah digenerate."
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
        setNotice("Project tersimpan dan masuk antrean smart action.");
      }
      setProjectModalOpen(false);
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Aksi Automation Center gagal.");
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
      setNotice(formatAutopilotResult(result, sendInvitations ? "Invitation associate sudah dikirim." : "Draft assignment AI sudah diperbarui."));
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Autopilot project gagal dijalankan.");
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
      setNotice(error instanceof Error ? error.message : "Status smart action gagal diubah.");
    } finally {
      setBusy("");
    }
  };

  const executeSmartAction = async (action: SmartActionRecord) => {
    if (!action.target_id) return;
    const shouldSend = action.action_type === "send_associate_invitations";
    if (shouldSend && hasSentInvitation(action.target_id)) {
      setNotice("Invitation untuk project ini sudah tercatat terkirim. Smart action tidak dijalankan untuk mencegah email ganda.");
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
      setNotice(status === "Completed" ? "Project masuk ke folder Project Selesai." : "Project dikembalikan ke pipeline aktif.");
      await onRefresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Status project gagal diubah.");
    } finally {
      setBusy("");
    }
  };

  const metrics = [
    { label: "Project Aktif", value: activeProjects.length },
    { label: "Smart Action Pending", value: pendingActions.length },
    { label: "Assignment Aktif", value: activeProjectAssignments.length },
    { label: "Invitation Terkirim", value: sentInvitations },
    { label: "Autopilot Running", value: runningProjects },
    { label: "Invitation Bermasalah", value: failedInvitations },
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
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Automation guardrail</p>
            <p className="mt-1 text-sm leading-relaxed text-[#0B2C6B]/58">
              Project aktif saja yang tampil di dashboard. History masuk ke masing-masing project selesai.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {metrics.map((metric) => (
              <CompactStatusPill
                key={metric.label}
                label={metric.label}
                value={metric.value}
                icon={
                  metric.label === "Smart Action Pending"
                    ? AlertCircle
                    : metric.label === "Invitation Terkirim"
                      ? CheckCircle2
                      : metric.label === "Autopilot Running"
                        ? ShieldAlert
                        : metric.label === "Invitation Bermasalah"
                          ? MailWarning
                        : metric.label === "Assignment Aktif"
                          ? Layers3
                          : ClipboardList
                }
                tone={
                  metric.label === "Invitation Bermasalah" && metric.value > 0
                    ? "danger"
                    : metric.label === "Autopilot Running" && metric.value > 0
                      ? "gold"
                      : metric.label === "Smart Action Pending" && metric.value > 0
                        ? "gold"
                        : "default"
                }
              />
            ))}
            <CompactStatusPill
              label="Draft Aktif"
              value={activeProjectAssignments.filter((assignment) => (assignment.status || "").toLowerCase() === "draft").length}
              icon={Layers3}
            />
            <CompactStatusPill
              label="Pending Send"
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
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D9A441]">Project Autopilot</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[#0B2C6B]">Buat project baru dari tombol aksi.</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-black/52">
              Form project disembunyikan agar dashboard tetap fokus ke project berjalan dan smart action aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProjectModalOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            + Buat Project
          </button>
        </div>
      </div>

      {projectModalOpen && (
      <AdminModal
        title="Project Autopilot"
        eyebrow="AI plan, matching, invitation"
        onClose={() => setProjectModalOpen(false)}
      >
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <FormSection
            title="1. Identitas klien"
            description="Field ini menjadi sumber data utama untuk project pipeline dan email invitation."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Nama Klien"
                value={form.client_name}
                onChange={(value) => setField("client_name", value)}
                placeholder="Contoh: PT Nusantara Energi"
                help="Wajib diisi. Nama ini dipakai pada project, assignment AI, dan ringkasan invitation."
              />
              <AdminInput
                label="Kontak Utama"
                value={form.contact_name}
                onChange={(value) => setField("contact_name", value)}
                placeholder="Contoh: Ibu Rani, HR Director"
                help="PIC utama klien. Isi nama dan jabatan jika tersedia agar follow-up lebih kontekstual."
              />
              <AdminInput
                label="Email Kontak"
                value={form.contact_email}
                onChange={(value) => setField("contact_email", value)}
                placeholder="nama@perusahaan.com"
                type="email"
                help="Wajib diisi. Sistem memakai email ini untuk konteks project dan validasi sebelum autopilot."
              />
              <label className="block">
                <FieldLabel label="Layanan" help="Wajib diisi. Layanan membantu AI menentukan role associate dan scope rekomendasi." />
                <AdminSelect
                  value={form.service}
                  onChange={(value) => setField("service", value)}
                  options={[["", "Pilih layanan"], ...ADMIN_SERVICE_OPTIONS]}
                  ariaLabel="Pilih layanan project"
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            title="2. Detail program"
            description="Lengkapi konteks agar draft role, jadwal, dan budget note tidak ambigu."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput
                label="Nama Program"
                value={form.program_name}
                onChange={(value) => setField("program_name", value)}
                placeholder="Contoh: Leadership Acceleration Q3"
                help="Nama program yang akan muncul di pipeline dan email invitation associate."
              />
              <label className="block">
                <FieldLabel label="Tipe Project" help="Pilih tipe paling dekat dengan delivery utama agar assignment lebih presisi." />
                <AdminSelect
                  value={form.project_type}
                  onChange={(value) => setField("project_type", value)}
                  options={PROJECT_TYPE_OPTIONS}
                  ariaLabel="Pilih tipe project"
                />
              </label>
              <AdminInput label="Mulai" value={form.start_date} onChange={(value) => setField("start_date", value)} type="date" help="Tanggal mulai bersifat opsional, tetapi membantu associate membaca kesiapan jadwal." />
              <AdminInput label="Selesai" value={form.end_date} onChange={(value) => setField("end_date", value)} type="date" help="Tanggal selesai membantu AI memperkirakan durasi dan intensitas assignment." />
              <label className="block md:col-span-2">
                <FieldLabel label="Budget Note" help="Catatan budget membantu admin memprioritaskan project dan ekspektasi delivery." />
                <AdminSelect value={form.budget_note} onChange={(value) => setField("budget_note", value)} options={BUDGET_NOTE_OPTIONS} ariaLabel="Pilih catatan budget" />
              </label>
            </div>
          </FormSection>
        </div>

        <div className="mt-4">
          <AdminTextarea
            label="3. Scope Project"
            value={form.scope}
            onChange={(value) => setField("scope", value)}
            placeholder="Contoh: Assessment kesiapan, workshop alignment, pendampingan eksekusi, dan pengukuran adoption."
            help="Tuliskan ruang lingkup kerja, output yang diharapkan, batasan, dan konteks klien. Semakin jelas scope, semakin baik matching AI."
            minHeight="min-h-32"
          />
          <PresetButtons options={PROJECT_SCOPE_PRESETS} onPick={(value) => setField("scope", value)} />
        </div>

        <div className="mt-5 rounded-[12px] border border-[#0B2C6B]/8 bg-[#F8FAFC] p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-[#0B2C6B]">4. Pilih aksi</p>
            <p className="mt-1 text-xs leading-relaxed text-black/48">
              Simpan dulu untuk review manual, atau jalankan autopilot setelah field wajib terisi.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
          <button
            onClick={() => createProject("save")}
            disabled={Boolean(busy) || !isProjectFormReady}
            title="Menyimpan project dan membuat smart action untuk direview manual."
            className="rounded-full border border-[#0B2C6B]/18 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#0B2C6B] disabled:opacity-45"
          >
            Simpan Project
          </button>
          <button
            onClick={() =>
              confirmAndRun({
                title: "Generate assignment AI?",
                description: "Sistem akan membuat draft role dan matching associate untuk project ini. Belum ada email yang dikirim.",
                confirmLabel: "Generate Assignment",
                details: [form.client_name || "Klien belum diisi", form.program_name || "Program belum diisi"],
                onConfirm: () => createProject("draft"),
              })
            }
            disabled={Boolean(busy) || !isProjectFormReady}
            title="Membuat draft role dan matching associate tanpa mengirim email."
            className="rounded-full bg-[#0B2C6B] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-45"
          >
            Generate Assignment
          </button>
          <button
            onClick={() =>
              confirmAndRun({
                title: "Kirim invitation ke associate?",
                description: "Sistem akan membuat project, generate assignment, lalu mengirim email invitation ke associate yang dipilih AI.",
                confirmLabel: "Kirim Invitation",
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
            title="Generate assignment lalu mengirim invitation setelah dialog konfirmasi."
            className="rounded-full bg-[#D9A441] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#071B3D] disabled:opacity-45"
          >
            Review & Kirim Invitation
          </button>
          </div>
        {!isProjectFormReady && (
          <p className="mt-3 text-xs leading-relaxed text-black/45">
            Isi minimal nama klien, nama program, email kontak valid, dan layanan sebelum menyimpan atau menjalankan autopilot.
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
        <Panel title="Smart Actions" action={`${activeSmartActions.length} aktif`}>
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
                      title: "Jalankan smart action ini?",
                      description: action.action_type === "send_associate_invitations"
                        ? "Aksi ini dapat mengirim invitation ke associate. Pastikan project dan draft assignment sudah sesuai."
                        : "Aksi ini akan menjalankan rekomendasi automation untuk target terkait.",
                      confirmLabel: "Jalankan",
                      tone: action.action_type === "send_associate_invitations" ? "gold" : "navy",
                      details: [
                        action.title || action.action_type || "Smart action",
                        action.description || "",
                        actionProject ? `Project: ${actionProject.program_name || "Project baru"} - ${actionProject.client_name || "Tanpa klien"}` : "",
                        `Assignment saat ini: ${actionSummary.total} total, ${actionSummary.draft} draft, ${actionSummary.sent} terkirim`,
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
                title="Tidak ada action aktif."
                description="Smart action yang sudah selesai dipindahkan ke masing-masing project agar workspace utama tetap fokus."
              />
            )}
          </div>
        </Panel>

        <Panel title="Project Pipeline" action={`${activeProjects.length} aktif / ${completedProjects.length} selesai`}>
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
                      <Badge>{summary.total} assignment</Badge>
                      {summary.sent > 0 && <Badge tone="gold">{summary.sent} sent</Badge>}
                      {summary.failed > 0 && <Badge tone="gold">{summary.failed} perlu cek</Badge>}
                    </div>
                    <p className="font-semibold text-[#0B2C6B]">{project.program_name || project.service || "Project baru"}</p>
                    <p className="mt-1 text-sm text-[#0B2C6B]/60">{project.client_name || "Tanpa nama klien"} {project.contact_email ? `- ${project.contact_email}` : ""}</p>
                    {project.ai_summary && <p className="mt-2 text-sm leading-relaxed text-[#0B2C6B]/62">{project.ai_summary}</p>}
                    {summary.draft > 0 && (
                      <p className="mt-2 text-xs leading-relaxed text-[#0B2C6B]/45">
                        Menjalankan Draft AI akan mengganti {summary.draft} draft assignment lama untuk project ini.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() =>
                        confirmAndRun({
                          title: "Perbarui draft assignment AI?",
                          description: summary.draft > 0
                            ? "Draft assignment lama akan diganti dengan hasil terbaru dari AI. Data yang sudah terkirim tidak akan disentuh oleh backend saat ini."
                            : "Sistem akan membuat draft role dan matching associate terbaru untuk project ini.",
                          confirmLabel: "Draft AI",
                          details: [
                            project.program_name || "Project baru",
                            project.client_name || "Tanpa nama klien",
                            `${summary.draft} draft assignment akan diganti`,
                            `${summary.sent} invitation sudah terkirim`,
                          ],
                          onConfirm: () => runProjectAutopilot(project.id, false),
                        })
                      }
                      disabled={Boolean(busy)}
                      className="rounded-full border border-[#0B2C6B]/14 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-45"
                    >
                      Draft AI
                    </button>
                    <button
                      onClick={() =>
                        confirmAndRun({
                          title: "Kirim invitation untuk project ini?",
                          description: sentAlready
                            ? "Invitation sudah tercatat terkirim. Aksi ini diblokir agar tidak mengirim email ganda."
                            : "Sistem akan generate assignment terbaru dan mengirim email ke associate yang cocok.",
                          confirmLabel: "Kirim Invitation",
                          tone: "gold",
                          details: [
                            project.program_name || "Project baru",
                            project.contact_email || "Email kontak belum tersedia",
                            `${summary.total} assignment saat ini`,
                            `${summary.sent} invitation sudah terkirim`,
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
                title="Belum ada project aktif."
                description="Project yang disimpan atau digenerate dari autopilot akan tampil di sini sampai statusnya selesai."
              />
            )}
            {completedProjects.length > 0 && (
              <CollapsibleModule title={`Project selesai (${completedProjects.length})`}>
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
            <Badge>{assignments.length} assignment</Badge>
            {smartActions.length > 0 && <Badge>{smartActions.length} smart action</Badge>}
            {sent > 0 && <Badge tone="gold">{sent} sent</Badge>}
            {notContinued > 0 && <Badge>{notContinued} tidak dilanjutkan</Badge>}
            {openActions.length > 0 && <Badge tone="gold">{openActions.length} belum selesai</Badge>}
          </div>
          <p className="font-semibold text-[#0B2C6B]">{project.program_name || project.service || "Project selesai"}</p>
          <p className="mt-1 text-sm text-[#0B2C6B]/56">
            {project.client_name || "Tanpa nama klien"} {project.contact_email ? `- ${project.contact_email}` : ""}
          </p>
          {project.ai_summary && <p className="mt-2 text-sm leading-relaxed text-[#0B2C6B]/54">{project.ai_summary}</p>}
        </div>
        <button
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
            <CollapsibleModule title={`Riwayat smart action (${smartActions.length})`}>
              <div className="grid gap-2">
                {smartActions.slice(0, 12).map((action) => (
                  <HistoryRow
                    key={action.id || action.title}
                    title={action.title || action.action_type || "Smart action"}
                    meta={`${action.status || "Pending"} / ${action.priority || "Normal"} / ${formatDate(action.created_at || "")}`}
                    tone={completedActions.includes(action) ? "muted" : "active"}
                  />
                ))}
              </div>
            </CollapsibleModule>
          ) : (
            <p className="rounded-[10px] border border-emerald-200/70 bg-white/70 px-3 py-2 text-xs leading-relaxed text-[#0B2C6B]/50">
              Tidak ada smart action tersimpan untuk project selesai ini.
            </p>
          )}
          {assignments.length > 0 ? (
            <CollapsibleModule title={`Riwayat assignment (${assignments.length})`}>
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
              Tidak ada assignment tersimpan untuk project selesai ini.
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
            <Badge tone={action.status === "Pending" ? "gold" : "navy"}>{action.status || "Pending"}</Badge>
            <Badge>{action.priority || "Normal"}</Badge>
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#0B2C6B]">
            {action.title || action.action_type}
          </p>
          <p className="mt-1 truncate text-xs text-[#0B2C6B]/45">
            {project?.program_name || "Project"} / {summary.total} assignment
          </p>
        </div>
        <div className="grid min-w-12 place-items-center rounded-[10px] bg-white px-2 py-1 text-center">
          <span className="text-lg font-light tracking-[-0.04em] text-[#0B2C6B]">{summary.draft || summary.total}</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-black/32">draft</span>
        </div>
      </div>
      {blocked && (
        <p className="mt-3 rounded-[9px] border border-[#D9A441]/20 bg-[#FFF8EA] px-3 py-2 text-xs leading-relaxed text-[#9B6C17]">
          Invitation sudah pernah terkirim. Action kirim ulang disembunyikan dari flow utama.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {canRun && (
          <button
            onClick={onRun}
            disabled={busy || blocked}
            className="rounded-full bg-[#0B2C6B] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white disabled:opacity-45"
          >
            Jalankan
          </button>
        )}
        <button
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
    <div className="group h-44 [perspective:1000px]">
      <div className="relative h-full rounded-[12px] transition duration-300 [transform-style:preserve-3d] group-hover:z-20 group-hover:scale-[1.04] group-hover:[transform:rotateY(180deg)] group-focus-within:z-20 group-focus-within:scale-[1.04] group-focus-within:[transform:rotateY(180deg)]">
        <button
          type="button"
          className={`absolute inset-0 flex h-full w-full flex-col rounded-[12px] border p-4 text-left shadow-[0_16px_38px_-34px_rgba(11,44,107,0.34)] outline-none [backface-visibility:hidden] ${
            muted
              ? "border-black/[0.04] bg-[#F8FAFC] opacity-80"
              : "border-black/[0.06] bg-white"
          }`}
          aria-label={`Lihat detail assignment ${assignment.role_title || "project"}`}
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge tone={isSent || isFailed ? "gold" : "navy"}>{assignment.status || "Draft"}</Badge>
            {typeof assignment.match_score === "number" && <Badge>{assignment.match_score}%</Badge>}
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#0B2C6B]">
            {assignment.role_title || "Role project"}
          </p>
          <p className="mt-1 line-clamp-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B]/38">
            {project?.program_name || "Project"}
          </p>
          <p className="mt-auto line-clamp-2 text-xs leading-relaxed text-black/48">
            {assignment.associate_name || "Belum dipilih"}
          </p>
        </button>
        <div className="absolute inset-0 flex h-full flex-col rounded-[12px] border border-[#0B2C6B]/12 bg-[#071B3D] p-4 text-white shadow-[0_18px_45px_-28px_rgba(7,27,61,0.65)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/68">
              {project?.client_name || "Klien"}
            </span>
            {assignment.agreement_status && (
              <span className="rounded-full bg-[#D9A441]/18 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#F4D58D]">
                {assignment.agreement_status}
              </span>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/68">
            {assignment.match_reason || "Belum ada alasan matching dari autopilot."}
          </p>
          <div className="mt-auto space-y-1 text-[10px] font-bold uppercase tracking-[0.11em] text-white/42">
            {assignment.associate_email && <p className="truncate">{assignment.associate_email}</p>}
            {assignment.invitation_sent_at && <p>Sent {formatDate(assignment.invitation_sent_at)}</p>}
            {assignment.invitation_email_id && <p className="truncate">Email {assignment.invitation_email_id}</p>}
          </div>
        </div>
      </div>
    </div>
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
