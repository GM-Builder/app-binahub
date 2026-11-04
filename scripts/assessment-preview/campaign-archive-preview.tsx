import { useCallback } from 'react';
import { CampaignArchivePanel } from '@/app/admin/_components/campaign-archive-panel';
const uuid = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const campaigns = Array.from({ length: 1005 }, (_, i) => ({ id: uuid(i + 1), title: i === 1004 ? 'Arsip lama %_* 東京' : `Pengembangan manajer · Kampanye ${i + 1}`, subtitle: `CAMPAIGN_${i + 1}`,
  context: 'Sumber data organisasi yang telah ditinjau', status: i % 2 ? 'active' : 'completed', occurredAt: '2026-11-03T02:00:00Z', owner: 'admin@example.invalid', sourceChannel: i % 2 ? 'inbound' : 'outbound', sourceStatus: 'paused', sourceActive: false, channel: 'email' }));
const histories = (kind: string) => Array.from({ length: 1005 }, (_, i) => ({ id: uuid(2000 + i), title: kind === 'batches' ? `IMPORTED_${i + 1}` : kind === 'events' ? 'batch_staged' : kind === 'journey_events' ? 'inquiry_submitted' : kind === 'journeys' ? `Kunjungan ${i + 1}` : `Nadia Contoh ${i + 1}`,
  subtitle: kind === 'journeys' || kind === 'journey_events' ? '/rekomendasi-program' : 'nadia@example.invalid', context: 'PT Nusantara · Data sintetis untuk pemeriksaan lokal', occurredAt: '2026-11-04T01:00:00Z',
  status: kind === 'deliveries' ? i % 2 ? 'sent' : 'uncertain' : kind === 'prospects' ? 'valid' : kind === 'journeys' ? 'converted' : 'completed',
  ...(kind === 'deliveries' ? { kind: i % 2 ? 'initial' : 'test', locale: 'id' } : {}),
  ...(kind === 'prospects' ? { consentStatus: 'opted_in' } : {}),
  ...(kind === 'batches' ? { totalRows: 50, validRows: 44, invalidRows: 2, duplicateRows: 3, suppressedRows: 1, promotedRows: 0 } : {}),
  ...(kind === 'journeys' ? { linked: true, firstSeenAt: '2026-11-03T01:00:00Z', lastPath: '/thanks' } : {}) }));
export function CampaignArchivePreview() {
  const onAction = useCallback(async (url: string, init?: RequestInit) => {
    window.dispatchEvent(new CustomEvent('campaign-preview-action', { detail: { url, method: init?.method || 'GET' } }));
    if (new URLSearchParams(location.search).has('archive-error')) throw new Error('SQL88 required');
    const query = new URL(url, location.origin).searchParams, kind = query.get('kind') || 'campaigns', page = Number(query.get('page') || 0);
    const all = kind === 'campaigns' ? campaigns : histories(kind);
    const records = all.filter(row => (!query.get('search') || `${row.title} ${row.subtitle} ${row.context}`.toLowerCase().includes(query.get('search')!.toLowerCase()))
      && (!query.get('status') || row.status === query.get('status')) && (!query.get('channel') || 'sourceChannel' in row && row.sourceChannel === query.get('channel')));
    return { success: true, version: 1, kind, page, pageSize: 20, campaignId: query.get('campaignId'), journeyId: query.get('journeyId'), snapshotAt: '2026-11-04T01:00:00Z', total: records.length, all: all.length,
      statusCounts: all.reduce<Record<string, number>>((result, row) => ({ ...result, [row.status]: (result[row.status] || 0) + 1 }), {}), records: records.slice(page * 20, page * 20 + 20) };
  }, []);
  return <div className="admin-ui-v2 min-h-screen bg-[#F5F7FA] text-slate-900"><p className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Preview lokal · Data sintetis · Tidak terhubung ke API, database, atau email</p><main className="mx-auto max-w-[1440px] p-4 sm:p-8"><h1 className="mb-6 text-2xl font-semibold">Akuisisi & penjualan</h1><CampaignArchivePanel onAction={onAction} onBack={() => { location.search = '?outbound'; }} /></main></div>;
}
