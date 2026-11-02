'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { AssessmentInboxSchema, type AssessmentInbox } from './assessment-inbox';
import type { AssessmentQueue } from './assessment-presentation';
import type { AssessmentRecord } from './types';

const message = (status: number) => status === 401 || status === 403 ? 'Sesi admin tidak tersedia. Silakan masuk kembali.'
  : status === 429 ? 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.'
    : status === 404 ? 'Diagnosis tidak ditemukan. Pilih klien lain atau perbarui daftar.'
      : 'Data diagnosis belum dapat dimuat. Periksa koneksi, lalu coba lagi.';
class InboxReadError extends Error {}

export function useAssessmentInbox(input: { enabled: boolean; search: string; category: string; employees: string; minScore: string; queue: AssessmentQueue; sort: string; selectedId: string | null; refreshToken?: number }) {
  const search = input.search.trim();
  const [debounced, setDebounced] = useState(search);
  const filters = JSON.stringify([search, input.category, input.employees, input.minScore, input.queue, input.sort]);
  const [pager, setPager] = useState({ key: filters, page: 0 });
  // Remember the current filter key too: returning to an earlier search must not
  // restore its former page. React retries this component before committing.
  if (pager.key !== filters) setPager({ key: filters, page: 0 });
  const page = pager.key === filters ? pager.page : 0;
  const [revision, setRevision] = useState(0);
  const [detailRevision, setDetailRevision] = useState(0);
  const [list, setList] = useState<{ key: string; data: AssessmentInbox | null; error: string }>({ key: '', data: null, error: '' });
  const key = JSON.stringify([filters, page, revision, input.refreshToken]);
  const current = list.key === key && search === debounced;
  const data = current ? list.data : null;
  const listLoading = input.enabled && !current;
  const targetId = input.selectedId || data?.records[0]?.id || '';
  const detailKey = JSON.stringify([targetId, detailRevision, input.refreshToken]);
  const [detail, setDetail] = useState<{ key: string; record: AssessmentRecord | null; error: string }>({ key: '', record: null, error: '' });
  const detailCurrent = detail.key === detailKey;

  useEffect(() => { const timer = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer); }, [search]);
  useEffect(() => {
    if (!input.enabled || search !== debounced) return;
    let active = true, expired = false;
    const controller = new AbortController();
    const fail = (error: string) => { if (active) setList({ key, data: null, error }); };
    const timer = setTimeout(() => { expired = true; controller.abort(); fail('Memuat daftar terlalu lama. Periksa koneksi, lalu coba lagi.'); }, 20000);
    const params = new URLSearchParams({ page: String(page), search,
      category: input.category === 'Semua' ? '' : input.category, employees: input.employees === 'Semua' ? '' : input.employees,
      minScore: input.minScore, queue: input.queue, sort: input.sort });
    void apiFetch('/api/admin/assessments/inbox?' + params, { signal: controller.signal, cache: 'no-store' }).then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new InboxReadError(response.status === 503 && typeof body?.error === 'string' && body.error.includes('SQL82') ? 'Daftar diagnosis memerlukan pembaruan SQL82 oleh pengelola.' : message(response.status));
      }
      const body = AssessmentInboxSchema.parse(await response.json());
      if (!active || expired) return;
      const lastPage = Math.max(0, Math.ceil(body.total / 20) - 1);
      if (page > lastPage) { setPager({ key: filters, page: lastPage }); return; }
      setList({ key, data: body, error: '' });
    }).catch((error: unknown) => { if (active && !expired) fail(error instanceof InboxReadError ? error.message : message(503)); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [input.enabled, input.category, input.employees, input.minScore, input.queue, input.sort, search, debounced, page, filters, key]);

  useEffect(() => {
    if (!input.enabled || !targetId) return;
    let active = true, expired = false;
    const controller = new AbortController();
    const fail = (error: string) => { if (active) setDetail({ key: detailKey, record: null, error }); };
    const timer = setTimeout(() => { expired = true; controller.abort(); fail('Memuat detail terlalu lama. Periksa koneksi, lalu coba lagi.'); }, 20000);
    void apiFetch('/api/admin/assessments/inbox?id=' + encodeURIComponent(targetId), { signal: controller.signal, cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new InboxReadError(message(response.status));
      const body = await response.json();
      const record = body.record;
      if (!body.success || record?.id !== targetId || typeof record.name !== 'string' || !record.answers || !record.scores || !Array.isArray(record.recommendations)) throw new Error(message(503));
      if (active && !expired) setDetail({ key: detailKey, record, error: '' });
    }).catch((error: unknown) => { if (active && !expired) fail(error instanceof InboxReadError ? error.message : message(503)); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [input.enabled, targetId, detailKey]);
  const refresh = useCallback(() => { setRevision((value) => value + 1); setDetailRevision((value) => value + 1); }, [setRevision, setDetailRevision]);
  const retryList = useCallback(() => setRevision((value) => value + 1), [setRevision]);
  const retryDetail = useCallback(() => setDetailRevision((value) => value + 1), [setDetailRevision]);
  const setPage = (next: number) => setPager({ key: filters, page: next });
  return { data, facets: list.data?.facets, page, setPage, loading: listLoading, error: current ? list.error : '',
    record: detailCurrent ? detail.record : null, detailLoading: Boolean(targetId) && !detailCurrent,
    detailError: detailCurrent ? detail.error : '', targetId, refresh, retryList, retryDetail };
}
