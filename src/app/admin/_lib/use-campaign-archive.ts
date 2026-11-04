'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';

export type ArchiveKind = 'campaigns' | 'prospects' | 'deliveries' | 'batches' | 'events' | 'journeys' | 'journey_events';
export type ArchiveAction = (url: string, init?: RequestInit) => Promise<unknown>;
const count = z.number().int().nonnegative().safe();
const Record = z.object({ id: z.string().uuid(), title: z.string(), subtitle: z.string(), context: z.string(), status: z.string(), occurredAt: z.string().nullable(),
  owner: z.string().optional(), channel: z.string().optional(), sourceChannel: z.string().optional(), sourceStatus: z.string().optional(), sourceActive: z.boolean().optional(),
  startsOn: z.string().nullable().optional(), endsOn: z.string().nullable().optional(), consentStatus: z.string().optional(),
  kind: z.enum(['test', 'initial']).optional(), locale: z.enum(['id', 'en']).optional(), firstSeenAt: z.string().optional(),
  lastPath: z.string().nullable().optional(), linked: z.boolean().optional(), totalRows: count.optional(), validRows: count.optional(),
  invalidRows: count.optional(), duplicateRows: count.optional(), suppressedRows: count.optional(), promotedRows: count.optional(),
});
export type ArchiveRecord = z.infer<typeof Record>;
const Result = z.object({ success: z.literal(true), version: z.literal(1), kind: z.string(), campaignId: z.string().uuid().nullable(), journeyId: z.string().uuid().nullable(),
  page: count, pageSize: z.literal(20), snapshotAt: z.string(), total: count, all: count, statusCounts: z.record(z.string(), count), records: z.array(Record).max(20),
});
export function useCampaignArchive(onAction: ArchiveAction, input: { kind: ArchiveKind; campaignId?: string; journeyId?: string; search: string; status: string; channel: string }) {
  const { kind, campaignId, journeyId, status, channel } = input;
  const search = input.search.trim(), filters = JSON.stringify([kind, campaignId, journeyId, search, status, channel]);
  const [debounced, setDebounced] = useState(search), [revision, setRevision] = useState(0);
  const [pager, setPager] = useState({ key: filters, page: 0 });
  if (pager.key !== filters) setPager({ key: filters, page: 0 });
  const page = pager.key === filters ? pager.page : 0, key = JSON.stringify([filters, page, revision]);
  const [result, setResult] = useState<{ key: string; data: z.infer<typeof Result> | null; error: string }>({ key: '', data: null, error: '' });
  useEffect(() => { const timer = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (search !== debounced) return;
    let active = true, expired = false;
    const controller = new AbortController();
    const fail = (error: string) => { if (active) setResult({ key, data: null, error }); };
    const timer = setTimeout(() => { expired = true; controller.abort(); fail('Memuat arsip terlalu lama. Periksa koneksi, lalu coba lagi.'); }, 20000);
    const params = new URLSearchParams({ kind, page: String(page), search, status, channel });
    if (campaignId) params.set('campaignId', campaignId);
    if (journeyId) params.set('journeyId', journeyId);
    void onAction('/api/admin/acquisition/archive?' + params, { signal: controller.signal, cache: 'no-store' }).then(value => {
      if (!active || expired) return;
      const data = Result.parse(value);
      if (data.kind !== kind || data.page !== page || data.campaignId !== (campaignId || null) || data.journeyId !== (journeyId || null)
        || data.total > data.all || Object.values(data.statusCounts).reduce((sum, n) => sum + n, 0) !== data.all
        || kind === 'campaigns' && data.records.some(row => !row.sourceChannel || !row.owner)) throw new Error('ARCHIVE_INVALID');
      const last = Math.min(10000, Math.max(0, Math.ceil(data.total / 20) - 1));
      if (page > last) { setPager({ key: filters, page: last }); return; }
      setResult({ key, data, error: '' });
    }).catch((error: unknown) => {
      if (!active || expired) return;
      fail(error instanceof Error && error.message.includes('SQL88') ? 'Arsip kampanye memerlukan pembaruan SQL88 oleh pengelola.'
        : 'Arsip kampanye belum dapat dimuat. Periksa koneksi dan sesi admin, lalu coba lagi.');
    }).finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [onAction, kind, campaignId, journeyId, search, debounced, status, channel, page, key, filters]);
  const current = result.key === key && search === debounced;
  return { data: current ? result.data : null, error: current ? result.error : '', loading: !current, page,
    setPage: (next: number) => setPager({ key: filters, page: next }), refresh: () => setRevision(v => v + 1) };
}
