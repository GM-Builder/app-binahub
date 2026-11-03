import { useCallback, useRef } from "react";
import { SalesWorkspace } from "@/app/admin/_components/sales-workspace";
import { assessmentDashboard, assessmentPreviewRecords } from "@/test/fixtures/assessment-admin";
import { AcquisitionControlPanel } from "@/app/admin/_components/acquisition-control-panel";
const source = { id: "source-demo", source_key: "internal_demo", name: "Daftar internal BinaHub", provider_type: "manual_upload", channel: "outbound", status: "approved", active: true, lawful_basis: "consent", acquisition_method: "Daftar contoh lokal", data_owner: "admin@example.com", legal_owner: "admin@example.com", privacy_notice_url: "https://example.com/privacy", retention_days: 30, config: {} };
const campaign = { id: "campaign-demo", source_id: source.id, campaign_code: "EMAIL-DEMO", name: "Diagnosa kesiapan tim · Oktober", status: "approved", channel: "email", owner: "admin@example.com", objective: "assessment", currency: "IDR", utm_config: {}, target_definition: {} };
const inboundSource = { ...source, id: 'source-inbound', source_key: 'website', name: 'Website BinaHub', channel: 'inbound', provider_type: 'website' };
const inboundCampaign = { ...campaign, id: 'campaign-inbound', source_id: inboundSource.id, campaign_code: 'INBOUND-DEMO', name: 'Pengembangan manajer · November', channel: 'organic', utm_config: { source: 'social', medium: 'social', campaign: 'inbound-demo' }, target_definition: { landingPath: '/rekomendasi-program' } };
const targets = [
  { id: "target-one", batch_id: "demo-batch", name: "Nadia Putri", email: "nadia@example.com", company: "PT Nusantara Digital", blockedReason: null, validation_status: "valid", deliveryStatus: null },
  { id: "target-two", batch_id: "demo-batch", name: "Rangga Pratama", email: "rangga@example.com", company: "Aruna Teknologi", blockedReason: null, validation_status: "valid", deliveryStatus: null },
  { id: "target-three", batch_id: "demo-batch", name: "Mira Sari", email: "mira@example.com", company: "Karya Bersama", blockedReason: "Tidak boleh dihubungi", validation_status: "suppressed", deliveryStatus: null },
];
export function OutboundPreview() {
  const state = useRef({ sources: [source, inboundSource], campaigns: [campaign, inboundCampaign], testSent: false, sent: false, settings: { enabled: false, recipientMode: "approved_list", allowedEmails: [] as string[], businessHoursOnly: false, version: 0 }, followUp: { enabled: false, version: 1, activated_at: null as string | null } });
  const onAction = useCallback(async (url: string, init?: RequestInit) => {
    window.dispatchEvent(new CustomEvent('campaign-preview-action', { detail: { url, method: init?.method || 'GET', body: init?.body ? JSON.parse(String(init.body)) : null } }));
    const testSent = state.current.testSent, sent = state.current.sent;
    if (init?.body) {
      const body = JSON.parse(String(init.body));
      if (body.action === "quick_email_campaign") {
        const created = { ...campaign, id: body.payload.campaignCode, name: body.payload.name, source_id: body.payload.sourceId };
        state.current.campaigns.push(created);
        return { success: true, campaign: created };
      }
      if (body.action === 'campaign') {
        const created = { ...campaign, ...body.payload, id: body.payload.campaignCode, source_id: body.payload.sourceId,
          campaign_code: body.payload.campaignCode, utm_config: body.payload.utmConfig, target_definition: body.payload.targetDefinition };
        state.current.campaigns.push(created); return { success: true, campaign: created };
      }
      if (body.action === 'source') {
        const created = { ...source, ...body.payload, id: body.payload.sourceKey, source_key: body.payload.sourceKey };
        state.current.sources.push(created); return { success: true, source: created };
      }
      if (url === "/api/admin/sales-settings") state.current.followUp = { enabled: body.enabled, version: state.current.followUp.version + 1, activated_at: body.enabled ? new Date().toISOString() : state.current.followUp.activated_at };
      else if (init.method === "PATCH" && url === "/api/admin/acquisition/email") state.current.settings = { ...body, version: state.current.settings.version + 1 };
      if (body.activateForSelection) state.current.settings = { ...state.current.settings, enabled: true, version: state.current.settings.version + 1 };
      if (body.action === "test") state.current.testSent = true;
      if (body.action === "send") state.current.sent = true;
      return { success: true, message: "Preview: permintaan tercatat. Tidak ada email nyata yang dikirim." };
    }
    if (url === '/api/admin/session') return { success: true, admin: { email: 'admin@example.com' } };
    if (url === "/api/admin/sales-settings") return { ready: true, settings: state.current.followUp, blockers: [] };
    if (url === "/api/admin/acquisition/attribution") return {
      phase20Ready: true,
      journeys: ["instagram", "tiktok", "direct"].map((channel, index) => ({
        id: `journey-${index}`, first_channel: channel === "direct" ? "direct" : "paid_social", last_channel: channel === "direct" ? "direct" : "paid_social",
        first_attribution: { utmSource: channel, utmCampaign: index < 2 ? "diagnosa_oktober" : "" }, last_attribution: { utmSource: channel },
        first_landing_path: "/id/insight", last_path: index === 0 ? "/insight" : "/id/pricing", first_seen_at: "2026-10-06T03:00:00Z", last_seen_at: "2026-10-06T03:05:00Z",
      })),
      events: [{ id: "event-1", journey_id: "journey-0", event_type: "assessment_submitted", route_path: "/insight", module_codes: [], created_at: "2026-10-06T03:05:00Z" }],
      links: [{ journey_id: "journey-0", lead_id: "lead-demo" }], interests: [{ journey_id: "journey-0", module_code: "SS-13" }],
    };
    if (url.startsWith("/api/admin/acquisition/email")) return { settings: state.current.settings, setupBlockers: [], ready: state.current.settings.enabled, blockers: state.current.settings.enabled ? [] : ["Pengiriman dijeda"], myEmail: "admin@example.com", mode: state.current.settings.enabled ? "approved_list" : "paused", testSent, templateVersion: "ceo-v1", preview: { subject: "Seberapa siap tim Perusahaan Anda menghadapi perubahan?", previewHtml: '<html><body style="padding:20px;font-family:Arial;color:#334155;line-height:1.7"><h2 style="color:#0B2C6B">BinaHub</h2><p>Yth. Bapak/Ibu,</p><h3>Strategi bisa berubah dalam hitungan bulan. Bagaimana dengan kesiapan tim Anda?</h3><p>Sebagai langkah awal, kami menyediakan Diagnosa Efektivitas Tim/Organisasi secara gratis untuk melihat kekuatan tim dan area yang dapat diperkuat.</p><p><a href="#preview" style="display:inline-block;background:#0B2C6B;color:white;padding:12px 16px;border-radius:8px">Coba Diagnosa Gratis</a></p><p>Tanpa kewajiban membeli program apa pun.</p><p>Salam hangat,<br>Tim BinaHub</p></body></html>' }, prospects: targets.map((target) => ({ ...target, ...(sent && !target.blockedReason ? { blockedReason: "Sudah diproses", deliveryStatus: "sent" } : {}) })), deliveries: [...(testSent ? [{ id: "test", name: "Admin", email: "admin@example.com", kind: "test", status: "sent", created_at: "2026-10-06T03:00:00Z" }] : []), ...(sent ? [{ id: "sent", name: "Nadia", email: "nadia@example.com", kind: "initial", status: "sent", created_at: "2026-10-06T03:05:00Z" }] : [])] };
    if (url === "/api/admin/acquisition/outbound-link") return { phase20Part2Ready: true, signingReady: true, links: [], clicks: [], campaigns: [campaign], prospects: targets, outcomes: [] };
    if (url === "/api/admin/lead-agent") return { phase18Ready: false, config: { provider: "apollo", enabled: false, providerCallsEnabled: false, dryRun: true, stagingEnabled: false, aiScoringEnabled: false, maximumCandidatesPerRun: 10, maximumCandidatesPerDay: 20, minimumFitScore: 70 }, readiness: { ready: false, blockers: [] }, runs: [], candidates: [] };
    return { phase5Ready: true, sources: state.current.sources, campaigns: state.current.campaigns, batches: [], prospects: targets };
  }, []);
  const data = assessmentDashboard(assessmentPreviewRecords);
  data.inquiries = [{ id: "inquiry-demo", name: "Rangga Pratama", email: "rangga@example.com", whatsapp: "", message: "Kami ingin berdiskusi tentang pengembangan manajer.", source: "instagram", status: "Baru", notes: "", createdAt: "2026-10-06T03:00:00Z" }];
  return <div className="admin-ui-v2 min-h-screen bg-[#F5F7FA] text-slate-900"><div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-900">Preview lokal · Data contoh · Tidak terhubung ke API, database, atau pengiriman email</div><main className="mx-auto max-w-[1440px] p-4 sm:p-8"><h1 className="mb-6 text-2xl font-semibold">Akuisisi & penjualan</h1>{new URLSearchParams(location.search).has("sales") ? <SalesWorkspace data={data} onAction={onAction} onRefresh={async () => {}} /> : <AcquisitionControlPanel initialView={new URLSearchParams(location.search).has('inbound') ? 'inbound' : 'outbound'} embedded onAction={onAction} />}</main></div>;
}
