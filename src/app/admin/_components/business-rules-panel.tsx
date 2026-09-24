"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, Loader2, Plus, Save, ShieldAlert } from "lucide-react";
import type { CatalogModule, CatalogProduct, OutreachTemplate } from "../_lib/types";

type RulesResponse = {
  selectedRuleSet?: { version?: string; status?: string; is_mock?: boolean };
  ruleSets?: Array<{
    version?: string;
    status?: string;
    is_mock?: boolean;
    rules?: {
      approvalState?: string;
      minimumTransaction?: number;
      proposalValidityDays?: number;
      humanGate?: { highDealThreshold?: number; maxDiscountWithoutApproval?: number; absoluteMaxDiscount?: number };
      activation?: { proposalAutoSendEnabled?: boolean; outboundAutomationEnabled?: boolean; blockers?: string[] };
    };
  }>;
  normalizedRules?: {
    minimumTransaction?: number;
    proposalValidityDays?: number;
    humanGate?: { highDealThreshold?: number; maxDiscountWithoutApproval?: number; absoluteMaxDiscount?: number };
  };
  products?: CatalogProduct[];
  modules?: CatalogModule[];
};

type ModuleForm = {
  id?: string;
  productId: string;
  moduleCode: string;
  name: string;
  description: string;
  standardScope: string;
  pricingUnit: string;
  basePrice: string;
  currency: string;
  readinessStatus: string;
  isMock: boolean;
  active: boolean;
  catalogVersion: string;
};

type TemplateForm = {
  id?: string;
  templateKey: string;
  locale: "id" | "en";
  version: string;
  status: "draft" | "approved" | "archived";
  subjectTemplate: string;
  htmlTemplate: string;
  owner: string;
  isMock: boolean;
  approvalNote: string;
};

const emptyForm: ModuleForm = {
  productId: "",
  moduleCode: "",
  name: "",
  description: "",
  standardScope: "",
  pricingUnit: "per program",
  basePrice: "0",
  currency: "IDR",
  readinessStatus: "design",
  isMock: true,
  active: true,
  catalogVersion: "v0.1-mock",
};

const TEMPLATE_KEYS = [
  "marketing_blast_initial",
  "marketing_blast_follow_up_1",
  "inquiry_follow_up_1",
  "inquiry_follow_up_2",
  "inquiry_follow_up_3",
  "assessment_result_follow_up_1",
  "assessment_result_follow_up_2",
  "assessment_result_follow_up_3",
  "assessment_proposal_follow_up_1",
  "consultation_confirmation",
] as const;

const REQUIRED_TEMPLATE_KEYS = new Set<string>([
  "inquiry_follow_up_1", "inquiry_follow_up_2", "inquiry_follow_up_3",
  "assessment_result_follow_up_1", "assessment_result_follow_up_2", "assessment_result_follow_up_3",
  "assessment_proposal_follow_up_1",
]);

const READINESS_OPTIONS: Array<[string, string]> = [
  ["research", "Riset"],
  ["design", "Perancangan"],
  ["development", "Pengembangan"],
  ["testing", "Validasi"],
  ["ready", "Siap digunakan"],
  ["retired", "Tidak digunakan"],
];

const TEMPLATE_STATUS_OPTIONS: Array<[TemplateForm["status"], string]> = [
  ["draft", "Draf"],
  ["approved", "Disetujui"],
  ["archived", "Diarsipkan"],
];

const readinessLabel = (value: string) => READINESS_OPTIONS.find(([key]) => key === value)?.[1] || value;
const templateStatusLabel = (value: string) => TEMPLATE_STATUS_OPTIONS.find(([key]) => key === value)?.[1] || value;

const emptyTemplateForm: TemplateForm = {
  templateKey: TEMPLATE_KEYS[0],
  locale: "id",
  version: "v1",
  status: "draft",
  subjectTemplate: "",
  htmlTemplate: "",
  owner: "",
  isMock: false,
  approvalNote: "",
};

function rupiah(value?: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
}

export function BusinessRulesPanel({ onAction }: { onAction: (url: string, init?: RequestInit) => Promise<unknown> }) {
  const [payload, setPayload] = useState<RulesResponse>({});
  const [form, setForm] = useState<ModuleForm>(emptyForm);
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplateForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, templateResult] = await Promise.all([
        onAction("/api/admin/business-rules") as Promise<RulesResponse>,
        onAction("/api/admin/outreach-templates") as Promise<{ templates?: OutreachTemplate[] }>,
      ]);
      setPayload(result);
      setTemplates(templateResult.templates || []);
      setForm((current) => current.productId ? current : { ...current, productId: result.products?.[0]?.id || "" });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Katalog belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const productById = useMemo(() => new Map((payload.products || []).map((product) => [product.id, product])), [payload.products]);
  const editModule = (module: CatalogModule) => setForm({
    id: module.id,
    productId: module.product_id,
    moduleCode: module.module_code,
    name: module.name,
    description: module.description || "",
    standardScope: module.standard_scope || "",
    pricingUnit: module.pricing_unit,
    basePrice: String(module.base_price),
    currency: module.currency,
    readinessStatus: module.readiness_status,
    isMock: module.is_mock,
    active: module.active,
    catalogVersion: module.catalog_version,
  });

  const resetForm = () => setForm({ ...emptyForm, productId: payload.products?.[0]?.id || "" });
  const resetTemplateForm = () => setTemplateForm(emptyTemplateForm);
  const editTemplate = (template: OutreachTemplate) => setTemplateForm({
    id: template.id,
    templateKey: template.template_key,
    locale: template.locale,
    version: template.version,
    status: template.status,
    subjectTemplate: template.subject_template,
    htmlTemplate: template.html_template,
    owner: template.owner || "",
    isMock: template.is_mock,
    approvalNote: template.approval_note || "",
  });
  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await onAction("/api/admin/business-rules", {
        method: "POST",
        body: JSON.stringify({ ...form, basePrice: Number(form.basePrice) }),
      });
      setMessage(form.id ? "Perubahan modul tersimpan." : "Modul baru ditambahkan.");
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Modul gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await onAction("/api/admin/outreach-templates", {
        method: "POST",
        body: JSON.stringify({
          ...templateForm,
          owner: templateForm.owner || null,
          approvalNote: templateForm.approvalNote || null,
        }),
      });
      setMessage(templateForm.status === "approved"
        ? "Template disetujui dan siap digunakan ketika komunikasi diaktifkan."
        : "Template komunikasi tersimpan tanpa mengaktifkan pengiriman.");
      resetTemplateForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Template gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const selected = payload.selectedRuleSet;
  const rules = payload.normalizedRules;
  const confirmedDraft = payload.ruleSets?.find((ruleSet) => ruleSet.status === "draft" && ruleSet.is_mock === false);
  const activationBlockers = confirmedDraft?.rules?.activation?.blockers || [];

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 ${selected?.is_mock ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            {selected?.is_mock ? <ShieldAlert className="mt-0.5 text-amber-700" size={20} /> : <CheckCircle2 className="mt-0.5 text-emerald-700" size={20} />}
            <div>
              <p className="text-sm font-bold text-slate-900">Aturan Bisnis {selected?.version || "belum tersedia"}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {selected?.is_mock
                  ? "Katalog sementara masih aktif. Harga yang belum disepakati tidak dapat digunakan untuk penawaran resmi."
                  : "Aturan aktif menggunakan katalog resmi. Proposal tetap mengikuti persetujuan manusia dan batas komersial."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right text-xs">
            <div><p className="text-slate-500">Minimum</p><p className="font-bold text-slate-900">{rupiah(rules?.minimumTransaction)}</p></div>
            <div><p className="text-slate-500">Review nilai</p><p className="font-bold text-slate-900">{rupiah(rules?.humanGate?.highDealThreshold)}</p></div>
            <div><p className="text-slate-500">Masa berlaku</p><p className="font-bold text-slate-900">{rules?.proposalValidityDays || 0} hari</p></div>
          </div>
        </div>
      </div>

      {confirmedDraft && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 text-[#0B2C6B]" size={20} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Aturan Bisnis {confirmedDraft.version}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#0B2C6B]">Menunggu persetujuan</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Keputusan yang sudah dikonfirmasi telah tersimpan, tetapi belum menggantikan aturan aktif. Pengiriman proposal dan komunikasi otomatis tetap terkunci sampai semua keputusan bisnis selesai.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                <span>Minimum transaksi: <strong>{rupiah(confirmedDraft.rules?.minimumTransaction)}</strong></span>
                <span>Review nilai: <strong>{rupiah(confirmedDraft.rules?.humanGate?.highDealThreshold)}</strong></span>
                <span>Diskon tanpa persetujuan: <strong>{confirmedDraft.rules?.humanGate?.maxDiscountWithoutApproval ?? 0}%</strong></span>
                <span>Masa berlaku: <strong>{confirmedDraft.rules?.proposalValidityDays ?? 0} hari</strong></span>
              </div>
              {activationBlockers.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {activationBlockers.map((blocker) => (
                    <div key={blocker} className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-600">
                      {blocker.replaceAll("_", " ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <div role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="text-sm font-bold text-slate-900">Katalog Modul</h2><p className="text-xs text-slate-500">Produk adalah payung; harga ditetapkan pada setiap modul.</p></div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{payload.modules?.length || 0} modul</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} /> Memuat katalog…</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {(payload.modules || []).map((module) => (
                <div key={module.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50/80">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{module.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${module.is_mock ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{module.is_mock ? "Belum siap" : "Resmi"}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{readinessLabel(module.readiness_status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{productById.get(module.product_id)?.name || "Produk"} · {module.module_code} · {module.catalog_version}</p>
                    <p className="mt-2 text-sm font-bold text-[#0B2C6B]">{rupiah(Number(module.base_price))} <span className="font-normal text-slate-500">/ {module.pricing_unit}</span></p>
                  </div>
                  <button type="button" onClick={() => editModule(module)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B]" aria-label={`Edit ${module.name}`}><Edit3 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-sm font-bold text-slate-900">{form.id ? "Edit Modul" : "Tambah Modul"}</h2><p className="text-xs text-slate-500">Data ini menjadi sumber harga proposal.</p></div>
            {form.id && <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs font-semibold text-[#0B2C6B]"><Plus size={13} /> Baru</button>}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">Produk<select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{(payload.products || []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Kode modul<input value={form.moduleCode} onChange={(event) => setForm({ ...form, moduleCode: event.target.value.toUpperCase() })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="PLAY_FACILITATION" /></label>
              <label className="block text-xs font-semibold text-slate-600">Versi katalog<input value={form.catalogVersion} onChange={(event) => setForm({ ...form, catalogVersion: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Nama modul<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-600">Scope standar<textarea value={form.standardScope} onChange={(event) => setForm({ ...form, standardScope: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">Harga<input type="number" min="0" value={form.basePrice} onChange={(event) => setForm({ ...form, basePrice: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="block text-xs font-semibold text-slate-600">Satuan<input value={form.pricingUnit} onChange={(event) => setForm({ ...form, pricingUnit: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Kesiapan<select value={form.readinessStatus} onChange={(event) => setForm({ ...form, readinessStatus: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{READINESS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <div className="flex gap-5 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isMock} onChange={(event) => setForm({ ...form, isMock: event.target.checked })} /> Data sementara</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Aktif</label>
            </div>
            <button type="button" disabled={saving || !form.productId || !form.moduleCode || !form.name} onClick={() => void save()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Simpan Modul
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div><h2 className="text-sm font-bold text-slate-900">Template Komunikasi</h2><p className="mt-1 text-xs text-slate-500">Hanya template yang sudah disetujui yang dapat digunakan untuk komunikasi.</p></div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{templates.filter((item) => item.status === "approved" && REQUIRED_TEMPLATE_KEYS.has(item.template_key)).length}/14 wajib disetujui</span>
          </div>
          {templates.length ? (
            <div className="divide-y divide-slate-100">
              {templates.map((template) => (
                <button key={template.id} type="button" onClick={() => editTemplate(template)} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{template.template_key.replaceAll("_", " ")}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${template.status === "approved" ? "bg-emerald-100 text-emerald-800" : template.status === "archived" ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-800"}`}>{templateStatusLabel(template.status)}</span>{template.is_mock && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">Belum siap</span>}</div>
                    <p className="mt-1 truncate text-xs text-slate-500">{template.version} · {template.locale} · {template.subject_template}</p>
                  </div>
                  <Edit3 className="shrink-0 text-slate-400" size={14} />
                </button>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-slate-500">Belum ada template komunikasi.</div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">{templateForm.id ? "Tinjau Template" : "Template Baru"}</h2><p className="mt-1 text-xs text-slate-500">Gunakan {"{{name}}"} untuk nama dan {"{{company}}"} untuk perusahaan.</p></div>{templateForm.id && <button type="button" onClick={resetTemplateForm} className="flex items-center gap-1 text-xs font-semibold text-[#0B2C6B]"><Plus size={13} /> Baru</button>}</div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-600">Kegunaan<select value={templateForm.templateKey} onChange={(event) => setTemplateForm({ ...templateForm, templateKey: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{TEMPLATE_KEYS.map((key) => <option key={key} value={key}>{key.replaceAll("_", " ")}</option>)}</select></label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><label className="block text-xs font-semibold text-slate-600">Bahasa<select value={templateForm.locale} onChange={(event) => setTemplateForm({ ...templateForm, locale: event.target.value as TemplateForm["locale"] })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="id">Indonesia</option><option value="en">Inggris</option></select></label><label className="block text-xs font-semibold text-slate-600">Versi<input value={templateForm.version} onChange={(event) => setTemplateForm({ ...templateForm, version: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-xs font-semibold text-slate-600">Status<select value={templateForm.status} onChange={(event) => setTemplateForm({ ...templateForm, status: event.target.value as TemplateForm["status"] })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">{TEMPLATE_STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label></div>
            <label className="block text-xs font-semibold text-slate-600">Subjek<input value={templateForm.subjectTemplate} onChange={(event) => setTemplateForm({ ...templateForm, subjectTemplate: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            <label className="block text-xs font-semibold text-slate-600">Isi HTML<textarea value={templateForm.htmlTemplate} onChange={(event) => setTemplateForm({ ...templateForm, htmlTemplate: event.target.value })} className="mt-1 min-h-44 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs" placeholder="<p>Halo {{name}}, ...</p>" /></label>
            <label className="block text-xs font-semibold text-slate-600">Penanggung jawab template<input value={templateForm.owner} onChange={(event) => setTemplateForm({ ...templateForm, owner: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="admin@binahub.id" /></label>
            {templateForm.status === "approved" && <label className="block text-xs font-semibold text-slate-600">Catatan persetujuan<textarea value={templateForm.approvalNote} onChange={(event) => setTemplateForm({ ...templateForm, approvalNote: event.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Konfirmasi gaya bahasa, ajakan bertindak, dan kebijakan sudah ditinjau." /></label>}
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700"><input type="checkbox" checked={templateForm.isMock} onChange={(event) => setTemplateForm({ ...templateForm, isMock: event.target.checked })} /> Data sementara (tidak dapat disetujui)</label>
            <button type="button" disabled={saving || !templateForm.subjectTemplate.trim() || templateForm.htmlTemplate.trim().length < 10 || (templateForm.status === "approved" && templateForm.approvalNote.trim().length < 5)} onClick={() => void saveTemplate()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Simpan Template</button>
          </div>
        </section>
      </div>
    </div>
  );
}
