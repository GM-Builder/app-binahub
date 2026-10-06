import { useState } from "react";
import { AcquisitionControlPanel } from "@/app/admin/_components/acquisition-control-panel";
const source = { id: "source-demo", source_key: "internal_demo", name: "Daftar internal BinaHub", provider_type: "manual_upload", channel: "outbound", status: "approved", active: true, lawful_basis: "consent", acquisition_method: "Daftar contoh lokal", data_owner: "admin@example.com", legal_owner: "admin@example.com", privacy_notice_url: "https://example.com/privacy", retention_days: 30, config: {} };
const campaign = { id: "campaign-demo", source_id: source.id, campaign_code: "EMAIL-DEMO", name: "Diagnosa kesiapan tim · Oktober", status: "approved", channel: "email", owner: "admin@example.com", objective: "assessment", currency: "IDR", utm_config: {}, target_definition: {} };
const targets = [
  { id: "target-one", batch_id: "demo-batch", name: "Nadia Putri", email: "nadia@example.com", company: "PT Nusantara Digital", blockedReason: null, validation_status: "valid", deliveryStatus: null },
  { id: "target-two", batch_id: "demo-batch", name: "Rangga Pratama", email: "rangga@example.com", company: "Aruna Teknologi", blockedReason: null, validation_status: "valid", deliveryStatus: null },
  { id: "target-three", batch_id: "demo-batch", name: "Mira Sari", email: "mira@example.com", company: "Karya Bersama", blockedReason: "Tidak boleh dihubungi", validation_status: "suppressed", deliveryStatus: null },
];
export function OutboundPreview() {
  const [testSent, setTestSent] = useState(false);
  const [sent, setSent] = useState(false);
  return <div className="min-h-screen bg-[#F5F7FA] text-slate-900"><div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-900">Preview lokal · Data contoh · Tidak terhubung ke API, database, atau pengiriman email</div><main className="mx-auto max-w-[1200px] p-5 sm:p-8"><h1 className="mb-6 text-2xl font-semibold">Akuisisi & penjualan</h1><AcquisitionControlPanel onAction={async (url, init) => {
    if (init?.body) {
      const body = JSON.parse(String(init.body));
      if (body.action === "test") setTestSent(true);
      if (body.action === "send") setSent(true);
      return { success: true, message: "Preview: permintaan tercatat. Tidak ada email nyata yang dikirim." };
    }
    if (url.startsWith("/api/admin/acquisition/email")) return { ready: true, blockers: [], myEmail: "admin@example.com", mode: "pilot", testSent, templateVersion: "ceo-v1", preview: { subject: "Seberapa siap tim Perusahaan Anda menghadapi perubahan?", previewHtml: '<html><body style="padding:20px;font-family:Arial;color:#334155;line-height:1.7"><h2 style="color:#0B2C6B">BinaHub</h2><p>Yth. Bapak/Ibu,</p><h3>Strategi bisa berubah dalam hitungan bulan. Bagaimana dengan kesiapan tim Anda?</h3><p>Sebagai langkah awal, kami menyediakan Diagnosa Efektivitas Tim/Organisasi secara gratis untuk melihat kekuatan tim dan area yang dapat diperkuat.</p><p><a href="#preview" style="display:inline-block;background:#0B2C6B;color:white;padding:12px 16px;border-radius:8px">Coba Diagnosa Gratis</a></p><p>Tanpa kewajiban membeli program apa pun.</p><p>Salam hangat,<br>Tim BinaHub</p></body></html>' }, prospects: targets.map((target) => ({ ...target, ...(sent && !target.blockedReason ? { blockedReason: "Sudah diproses", deliveryStatus: "sent" } : {}) })), deliveries: [...(testSent ? [{ id: "test", name: "Admin", email: "admin@example.com", kind: "test", status: "sent", created_at: "2026-10-06T03:00:00Z" }] : []), ...(sent ? [{ id: "sent", name: "Nadia", email: "nadia@example.com", kind: "initial", status: "sent", created_at: "2026-10-06T03:05:00Z" }] : [])] };
    if (url === "/api/admin/acquisition/outbound-link") return { phase20Part2Ready: true, signingReady: true, links: [], clicks: [], campaigns: [campaign], prospects: targets, outcomes: [] };
    if (url === "/api/admin/lead-agent") return { phase18Ready: false, config: { provider: "apollo", enabled: false, providerCallsEnabled: false, dryRun: true, stagingEnabled: false, aiScoringEnabled: false, maximumCandidatesPerRun: 10, maximumCandidatesPerDay: 20, minimumFitScore: 70 }, readiness: { ready: false, blockers: [] }, runs: [], candidates: [] };
    return { phase5Ready: true, sources: [source], campaigns: [campaign], batches: [], prospects: targets };
  }} /></main></div>;
}
