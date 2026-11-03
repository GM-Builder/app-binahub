'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api-fetch';
import type { ConsultationView } from './meetings-model';

const count = z.number().int().nonnegative();
const nullable = z.string().nullable();
const Summary = z.object({ id: z.string().uuid(), title: z.string(), status: z.string(), attendeeName: z.string(), attendeeEmail: z.string(),
  eventTypeSlug: nullable, startTime: nullable, endTime: nullable, timeZone: z.string(), updatedAt: nullable,
  isUpcoming: z.boolean(), isSuperseded: z.boolean() });
const Detail = z.object({ success: z.literal(true), record: Summary.extend({ providerUid: z.string(), leadId: nullable,
  assessmentId: nullable, organizerEmail: nullable, meetingUrl: nullable, cancellationReason: nullable }) });
const Inbox = z.object({ success: z.literal(true), version: z.literal(1), page: count, pageSize: z.literal(20), snapshotAt: z.string(),
  timeZone: z.literal('Asia/Jakarta'), total: count, counts: z.object({ all: count, upcoming: count, today: count, history: count,
    cancelled: count, review: count, waiting: count, completed: count }), statuses: z.array(z.string()),
  nextBooking: Summary.nullable(), records: z.array(Summary).max(20) });
class MeetingReadError extends Error {}
const message = (status: number) => status === 401 || status === 403 ? 'Sesi admin tidak tersedia. Silakan masuk kembali.'
  : status === 429 ? 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.'
    : status === 404 ? 'Jadwal tidak ditemukan. Perbarui daftar.' : 'Konsultasi belum dapat dimuat. Periksa koneksi, lalu coba lagi.';
async function read(response: Response) {
  if (response.ok) return response.json();
  const body = await response.json().catch(() => null);
  throw new MeetingReadError(response.status === 503 && typeof body?.error === 'string' && body.error.includes('SQL87')
    ? 'Arsip konsultasi memerlukan pembaruan SQL87 oleh pengelola.' : message(response.status));
}
export function useMeetingsInbox(input: { enabled: boolean; search: string; view: ConsultationView; status: string; selectedId: string | null; refreshToken?: string | number }) {
  const search = input.search.trim(), filters = JSON.stringify([search, input.view, input.status]);
  const [debounced, setDebounced] = useState(search), [revision, setRevision] = useState(0), [detailRevision, setDetailRevision] = useState(0);
  const [pager, setPager] = useState({ key: filters, page: 0 });
  if (pager.key !== filters) setPager({ key: filters, page: 0 });
  const page = pager.key === filters ? pager.page : 0, key = JSON.stringify([filters, page, revision, input.refreshToken]);
  const [list, setList] = useState<{ key: string; data: z.infer<typeof Inbox> | null; error: string }>({ key: '', data: null, error: '' });
  const current = list.key === key && search === debounced;
  const detailKey = JSON.stringify([input.selectedId, detailRevision, input.refreshToken]);
  const [detail, setDetail] = useState<{ key: string; record: z.infer<typeof Detail>['record'] | null; error: string }>({ key: '', record: null, error: '' });
  useEffect(() => { const timer = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!input.enabled || search !== debounced) return;
    let active = true, expired = false;
    const controller = new AbortController();
    const fail = (error: string) => { if (active) setList({ key, data: null, error }); };
    const timer = setTimeout(() => { expired = true; controller.abort(); fail('Memuat jadwal terlalu lama. Periksa koneksi, lalu coba lagi.'); }, 20000);
    const params = new URLSearchParams({ page: String(page), search, view: input.view, status: input.status === 'Semua' ? '' : input.status });
    void apiFetch('/api/admin/meetings/inbox?' + params, { signal: controller.signal, cache: 'no-store' }).then(read).then(value => {
      const data = Inbox.parse(value);
      if (!active || expired) return;
      if (data.page !== page) throw new Error('Page mismatch');
      const last = Math.max(0, Math.ceil(data.total / 20) - 1);
      if (page > last) { setPager({ key: filters, page: last }); return; }
      setList({ key, data, error: '' });
    }).catch((error: unknown) => { if (active && !expired) fail(error instanceof MeetingReadError ? error.message : message(503)); }).finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [input.enabled, input.view, input.status, search, debounced, page, filters, key]);
  useEffect(() => {
    if (!input.enabled || !input.selectedId) return;
    let active = true, expired = false;
    const controller = new AbortController();
    const fail = (error: string) => { if (active) setDetail({ key: detailKey, record: null, error }); };
    const timer = setTimeout(() => { expired = true; controller.abort(); fail('Memuat detail terlalu lama. Periksa koneksi, lalu coba lagi.'); }, 20000);
    void apiFetch('/api/admin/meetings/inbox?id=' + encodeURIComponent(input.selectedId), { signal: controller.signal, cache: 'no-store' }).then(read).then(value => {
      const data = Detail.parse(value);
      if (data.record.id !== input.selectedId) throw new Error('Detail mismatch');
      if (active && !expired) setDetail({ key: detailKey, record: data.record, error: '' });
    }).catch((error: unknown) => { if (active && !expired) fail(error instanceof MeetingReadError ? error.message : message(503)); }).finally(() => clearTimeout(timer));
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [input.enabled, input.selectedId, detailKey]);
  const refresh = useCallback(() => { setRevision(v => v + 1); setDetailRevision(v => v + 1); }, [setRevision, setDetailRevision]);
  return { data: current ? list.data : null, statuses: list.data?.statuses || [], page, setPage: (next: number) => setPager({ key: filters, page: next }),
    loading: input.enabled && !current, error: current ? list.error : '', refresh,
    record: input.selectedId && detail.key === detailKey ? detail.record : null,
    detailLoading: Boolean(input.selectedId) && detail.key !== detailKey, detailError: detail.key === detailKey ? detail.error : '',
    retryDetail: () => setDetailRevision(v => v + 1) };
}
