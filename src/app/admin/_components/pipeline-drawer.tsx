import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  History,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import {
  STAGES,
  STAGE_LABELS,
  formFromLead,
  isActiveStage,
  rupiah,
  sourceLabel,
  stageLabel,
  validatePipelineForm,
  type PipelineStage,
} from "../_lib/pipeline-model";
import { formatDate } from "../_lib/utils";
import { AdminDrawer, AdminInput, AdminSelect, AdminTextarea } from "./shared";
import { AssessmentBrief, ClientJourneyTimeline } from "./client-journey";
import { buildClientJourney } from "../_lib/client-journey";
import { proposalState } from "../_lib/assessment-presentation";

export function PipelineDrawer({
  lead,
  data,
  onClose,
  onAction,
  onRefresh,
  onSaved,
}: {
  lead: PipelineLeadRecord;
  data: DashboardData;
  onClose: () => void;
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState(() => formFromLead(lead));
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"detail" | "history">("detail");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(formFromLead(lead));
  const errors = validatePipelineForm(form);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => {
    if (busy.current) return;
    if (dirty) setDiscard(true);
    else onClose();
  };
  const journey = useMemo(() => buildClientJourney(data, { leadId: lead.id }), [data, lead.id]);
  const { assessments, meetings } = journey;
  const save = async () => {
    if (busy.current || errors.length || !dirty) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await onAction("/api/admin/pipeline", {
        method: "PATCH",
        body: JSON.stringify({
          leadId: lead.id,
          ...form,
          owner: form.owner.trim() || null,
          nextAction: form.nextAction.trim() || null,
          nextActionDueAt: form.nextActionDueAt
            ? new Date(form.nextActionDueAt).toISOString()
            : null,
          opportunityValue:
            form.opportunityValue === "" ? null : Number(form.opportunityValue),
          leadTimeZone: form.leadTimeZone.trim(),
          lostReason: form.lostReason.trim() || null,
          outreachPauseReason: form.outreachPauseReason.trim() || null,
          note: form.note.trim() || null,
        }),
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Perubahan belum tersimpan. Silakan coba lagi.",
      );
      busy.current = false;
      setSaving(false);
      return;
    }
    // A failed refresh must not invite a second mutation after a successful save.
    try {
      await onRefresh();
      onSaved("Perubahan peluang berhasil disimpan.");
    } catch {
      onSaved(
        "Perubahan sudah tersimpan. Tampilan belum diperbarui; klik Perbarui untuk memuat data terbaru.",
      );
    }
    busy.current = false;
    setSaving(false);
    onClose();
  };

  return (
    <AdminDrawer
      title={lead.company || lead.name}
      eyebrow="Detail peluang"
      onClose={close}
      closeDisabled={saving}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EDF2FB] text-[#0B2C6B]">
          <Building2 size={21} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
          <p className="mt-1 break-all text-xs text-slate-500">{lead.email}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <span className="rounded-md bg-[#EDF2FB] px-2 py-1 font-medium text-[#0B2C6B]">
              {stageLabel(lead.opportunityStage)}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
              {sourceLabel(lead.source)}
            </span>
          </div>
        </div>
      </div>
      <div className="my-5 grid grid-cols-2 divide-x divide-slate-200 rounded-xl border border-slate-200 py-4">
        <div className="min-w-0 px-4">
          <p className="text-[11px] text-slate-500">Nilai peluang</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {rupiah(lead.opportunityValue)}
          </p>
        </div>
        <div className="min-w-0 px-4">
          <p className="text-[11px] text-slate-500">Penanggung jawab</p>
          <p className="mt-1 break-all text-xs font-medium text-slate-800">
            {lead.opportunityOwner || "Belum ada PIC"}
          </p>
        </div>
      </div>
      {discard && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm font-semibold text-amber-900">
            Perubahan belum disimpan
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Tetap di sini untuk menyimpan, atau tutup dan abaikan perubahan.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDiscard(false)}
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Lanjut mengedit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-700"
            >
              Abaikan perubahan
            </button>
          </div>
        </div>
      )}
      <div
        className="mb-5 flex gap-5 border-b border-slate-200"
        role="group"
        aria-label="Bagian detail peluang"
      >
        {(
          [
            ["detail", "Ringkasan"],
            ["history", "Riwayat"],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`flex min-h-11 items-center gap-1.5 border-b-2 text-xs font-semibold ${tab === key ? "border-[#0B2C6B] text-[#0B2C6B]" : "border-transparent text-slate-500"}`}
          >
            {key === "history" && <History size={13} />}
            {label}
            {key === "history" && (
              <span className="text-[10px] text-slate-400">
                {journey.events.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "history" ? (
        <ClientJourneyTimeline key={lead.id} events={journey.events} />
      ) : (
        <div className="space-y-5">
          {!editing ? (
            <>
              <section className="rounded-xl border border-[#0B2C6B]/10 bg-[#F4F7FC] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold text-[#0B2C6B]">
                    {isActiveStage(lead.opportunityStage)
                      ? "Langkah berikutnya"
                      : "Hasil peluang"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B2C6B]"
                  >
                    <Pencil size={12} />
                    Ubah peluang
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-800">
                  {isActiveStage(lead.opportunityStage)
                    ? lead.nextAction ||
                      "Belum ada tindakan. Tentukan langkah berikutnya agar peluang terus bergerak."
                    : lead.opportunityStage === "lost"
                      ? lead.lostReason || "Ditutup tanpa kesepakatan"
                      : lead.opportunityStage === "won"
                        ? "Kesepakatan berhasil dicapai"
                        : "Tahap peluang perlu ditinjau."}
                </p>
                {isActiveStage(lead.opportunityStage) && (
                  <p className="mt-2 text-xs text-slate-500">
                    Tenggat:{" "}
                    {lead.nextActionDueAt
                      ? formatDate(lead.nextActionDueAt)
                      : "Belum ditentukan"}
                  </p>
                )}
                <p className="mt-3 text-[11px] text-slate-500">
                  Tindak lanjut otomatis:{" "}
                  {lead.outreachPaused
                    ? `dijeda${lead.outreachPauseReason ? ` · ${lead.outreachPauseReason}` : ""}`
                    : "tidak dijeda pada peluang ini"}
                </p>
              </section>
              <section>
                <h3 className="mb-3 text-xs font-semibold text-slate-800">
                  Informasi kontak
                </h3>
                <dl className="space-y-3 text-xs text-slate-600">
                  <div className="flex gap-2">
                    <Mail
                      size={14}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <dt className="sr-only">Email</dt>
                    <dd className="break-all">{lead.email}</dd>
                  </div>
                  {lead.phone && (
                    <div className="flex gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <dt className="sr-only">Telepon</dt>
                      <dd>{lead.phone}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <UserRound size={14} className="text-slate-400" />
                    <dt className="sr-only">Konteks</dt>
                    <dd>
                      {[lead.industry, lead.location]
                        .filter(Boolean)
                        .join(" · ") || "Industri dan lokasi belum tercatat"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-[11px] text-slate-500">
                  Dibuat {formatDate(lead.createdAt)} · Zona waktu klien:{" "}
                  {lead.leadTimeZone || "Belum tercatat"}
                </p>
              </section>
              <section className="rounded-xl border border-slate-200 p-4">
                <AssessmentBrief assessment={journey.brief} />
              </section>
              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-semibold text-slate-800">
                  Assessment & konsultasi
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {assessments.length} assessment terhubung · {meetings.length}{" "}
                  konsultasi terhubung
                </p>
                {assessments.map((assessment) => (
                  <p
                    key={assessment.id}
                    className="mt-2 text-xs text-slate-600"
                  >
                    {proposalState(assessment).label}
                  </p>
                ))}
                <div className="mt-3 flex flex-wrap gap-3">
                  {lead.opportunityStage==='won'&&<Link href={`/admin/clients?lead=${encodeURIComponent(lead.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0B2C6B] px-3 text-xs font-semibold text-white">{data.clientAccounts?.some(account=>account.sourceLeadId===lead.id)?'Buka akun & pelaksanaan':'Siapkan serah terima'}<ArrowUpRight size={13} aria-hidden="true"/></Link>}
                  <Link
                    href="/admin/assessments"
                    className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[#0B2C6B]"
                  >
                    Buka assessment
                    <ArrowUpRight size={12} />
                  </Link>
                  <Link
                    href="/admin/meetings"
                    className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[#0B2C6B]"
                  >
                    Buka konsultasi
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              </section>
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Perbarui peluang
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Perubahan diterapkan setelah Anda menyimpan.
                </p>
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                >
                  {error}
                </p>
              )}
              <fieldset
                disabled={saving}
                className="space-y-4 disabled:opacity-60"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-semibold text-slate-700">
                    <span>Tahap peluang</span>
                    <AdminSelect
                      ariaLabel="Tahap peluang"
                      value={form.stage}
                      onChange={(stage) => setForm({ ...form, stage })}
                      options={[
                        ...(!STAGES.includes(form.stage as PipelineStage)
                          ? [
                              [form.stage, "Tahap belum dikenali"] as [
                                string,
                                string,
                              ],
                            ]
                          : []),
                        ...STAGES.map(
                          (stage) =>
                            [stage, STAGE_LABELS[stage]] as [string, string],
                        ),
                      ]}
                    />
                  </label>
                  <AdminInput
                    label="Email penanggung jawab"
                    type="email"
                    value={form.owner}
                    onChange={(owner) => setForm({ ...form, owner })}
                    placeholder="nama@binahub.id"
                  />
                </div>
                {form.stage !== lead.opportunityStage && (
                  <p className="rounded-lg bg-[#EDF2FB] p-3 text-xs leading-5 text-[#0B2C6B]">
                    Tahap akan berubah: {stageLabel(lead.opportunityStage)} →{" "}
                    {stageLabel(form.stage)}.
                    {["won", "lost"].includes(form.stage)
                      ? " Peluang akan keluar dari daftar aktif."
                      : ""}
                  </p>
                )}
                <AdminTextarea
                  label="Tindakan berikutnya"
                  value={form.nextAction}
                  onChange={(nextAction) => setForm({ ...form, nextAction })}
                  placeholder="Contoh: Konfirmasi jadwal konsultasi dengan klien"
                />
                <AdminInput
                  label="Tenggat tindakan"
                  type="datetime-local"
                  value={form.nextActionDueAt}
                  onChange={(nextActionDueAt) =>
                    setForm({ ...form, nextActionDueAt })
                  }
                />
                <p className="-mt-2 text-[10px] leading-5 text-slate-500">
                  Tanggal mengikuti zona waktu perangkat Anda, bukan zona waktu
                  klien.
                </p>
                {form.stage === "lost" && (
                  <AdminTextarea
                    label="Alasan tidak lanjut"
                    value={form.lostReason}
                    onChange={(lostReason) => setForm({ ...form, lostReason })}
                    placeholder="Jelaskan alasan keputusan, minimal 5 karakter"
                  />
                )}
                <details className="group rounded-xl border border-slate-200">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-xs font-semibold text-slate-700">
                    Nilai & catatan
                    <ChevronDown size={14} className="group-open:rotate-180" />
                  </summary>
                  <div className="space-y-4 border-t border-slate-100 p-4">
                    <AdminInput
                      label="Nilai peluang (Rp)"
                      type="number"
                      value={form.opportunityValue}
                      onChange={(opportunityValue) =>
                        setForm({ ...form, opportunityValue })
                      }
                      placeholder="Kosongkan jika belum diketahui"
                    />
                    <AdminInput
                      label="Zona waktu klien"
                      value={form.leadTimeZone}
                      onChange={(leadTimeZone) =>
                        setForm({ ...form, leadTimeZone })
                      }
                      placeholder="Asia/Jakarta"
                    />
                    <AdminTextarea
                      label="Catatan perubahan"
                      value={form.note}
                      onChange={(note) => setForm({ ...form, note })}
                      placeholder="Konteks yang perlu diketahui tim"
                    />
                  </div>
                </details>
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-4 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.outreachPaused}
                    onChange={(event) =>
                      setForm({ ...form, outreachPaused: event.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 accent-[#0B2C6B]"
                  />
                  <span className="font-semibold">
                    Jeda tindak lanjut otomatis
                    <span className="mt-1 block font-normal leading-5 text-slate-500">
                      Untuk peluang yang memerlukan penanganan langsung oleh
                      tim.
                    </span>
                  </span>
                </label>
                {form.outreachPaused && (
                  <AdminInput
                    label="Alasan jeda"
                    value={form.outreachPauseReason}
                    onChange={(outreachPauseReason) =>
                      setForm({ ...form, outreachPauseReason })
                    }
                  />
                )}
              </fieldset>
              {errors.length > 0 && (
                <div
                  role="status"
                  className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"
                >
                  <p className="font-semibold">Lengkapi sebelum menyimpan:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="sticky -bottom-6 flex gap-2 border-t border-slate-200 bg-white py-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setForm(formFromLead(lead));
                    setEditing(false);
                    setError("");
                    setDiscard(false);
                  }}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || errors.length > 0 || !dirty}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white transition hover:bg-[#071B3D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle
                      size={15}
                      className="animate-spin motion-reduce:animate-none"
                    />
                  ) : (
                    <Check size={15} />
                  )}
                  {saving ? "Menyimpan…" : "Simpan perubahan"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </AdminDrawer>
  );
}
