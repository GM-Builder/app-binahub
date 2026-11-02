import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assessmentFixture } from '@/test/fixtures/assessment-admin';
import type { AssessmentRecord } from '../_lib/types';
import { AssessmentPanel } from './assessment-panel';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), action: vi.fn(), refresh: vi.fn() }));
vi.mock('@/lib/api-fetch', () => ({ apiFetch: mocks.fetch }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } } }));
const first = assessmentFixture({ id: 'first', name: 'Nadia', proposalGateStatus: 'not_evaluated', proposalDraft: null, resultFollowUpLevel: 0, proposalFollowUpLevel: 0, followUpPaused: false });
const second = { ...first, id: 'old', name: 'Arsip lama', company: 'PT A, B %_ 東京' };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const inbox = (records: AssessmentRecord[] = [first], total = 41, page = 0) => ({ success: true, version: 1, records, total, page, pageSize: 20,
  counts: { all: total, attention: 12, processing: 3, sent: 9 }, facets: { categories: ['Berkembang', 'Profesional'], employees: ['51–100', '1000+'] } });
const list = () => within(screen.getByRole('region', { name: 'Daftar klien Self Diagnostic' }));
function Harness({ initialId = null }: { initialId?: string | null }) {
  const [query, setQuery] = useState(''), [category, setCategory] = useState('Semua'), [employees, setEmployees] = useState('Semua'), [score, setScore] = useState('0');
  const [selected, setSelected] = useState<string | null>(initialId);
  return <AssessmentPanel serverMode records={[]} query={query} setQuery={setQuery} category={category} setCategory={setCategory}
    employeeRange={employees} setEmployeeRange={setEmployees} minScore={score} setMinScore={setScore} expandedId={selected} setExpandedId={setSelected}
    onAction={mocks.action} onRefresh={mocks.refresh} />;
}
beforeEach(() => {
  vi.resetAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  mocks.action.mockResolvedValue({ success: true });
  mocks.fetch.mockImplementation((url: string) => {
    const params = new URL(url, 'https://synthetic.invalid').searchParams;
    return Promise.resolve(response(params.has('id') ? { success: true, record: params.get('id') === 'old' ? second : first } : inbox()));
  });
});

describe('server diagnosis inbox preserves existing admin actions', () => {
  it('uses server counts/ranges, pages20 at a time, and never fetches the dashboard', async () => {
    render(<Harness />);
    await screen.findByText('1–20 dari 41');
    expect(screen.getByRole('button', { name: /Perlu perhatian 12/ })).toBeVisible();
    expect(list().getAllByRole('button', { name: /Buka Self Diagnostic/ })).toHaveLength(1);
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(url.includes('id=') ? { success: true, record: second } : inbox([second], 41, 1))));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('21–40 dari 41');
    expect(mocks.fetch.mock.calls.some(([url]) => new URL(url, 'https://test.invalid').searchParams.get('page') === '1')).toBe(true);
    expect(mocks.fetch.mock.calls.every(([url, init]) => url.includes('/assessments/inbox?') && !init.method)).toBe(true);
    expect(mocks.action).not.toHaveBeenCalled();
  });

  it('searches globally, resets page, hides stale results during debounce and keeps literal characters', async () => {
    render(<Harness />); await screen.findByText('1–20 dari 41');
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' })); await screen.findByText('21–40 dari 41');
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(url.includes('id=') ? { success: true, record: second } : inbox([second], 1))));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'A, B %_ 東京' } });
    expect(list().queryByRole('button', { name: /Buka Self Diagnostic Nadia/ })).not.toBeInTheDocument();
    await screen.findByText('1–1 dari 1');
    const last = mocks.fetch.mock.calls.filter(([url]) => !url.includes('id=')).at(-1)?.[0];
    const params = new URL(last, 'https://synthetic.invalid').searchParams;
    expect(params.get('search')).toBe('A, B %_ 東京'); expect(params.get('page')).toBe('0');
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(url.includes('id=') ? { success: true, record: first } : inbox())));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    await screen.findByText('1–20 dari 41');
    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  });

  it('keeps all facets and passes category, employee, score, queue and sort to the server', async () => {
    render(<Harness />); await screen.findByText('1–20 dari 41');
    fireEvent.click(screen.getByText('Filter lanjutan'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Kategori Self Diagnostic' }), { target: { value: 'Profesional' } });
    await screen.findByText('1–20 dari 41');
    fireEvent.change(screen.getByRole('combobox', { name: 'Ukuran perusahaan' }), { target: { value: '1000+' } });
    await screen.findByText('1–20 dari 41');
    fireEvent.change(screen.getByRole('combobox', { name: 'Skor diagnosis minimum' }), { target: { value: '70' } });
    await screen.findByText('1–20 dari 41');
    fireEvent.click(screen.getByRole('button', { name: /Perlu perhatian 12/ })); await screen.findByText('1–20 dari 41');
    fireEvent.change(screen.getByRole('combobox', { name: 'Urutkan Self Diagnostic' }), { target: { value: 'attention' } });
    await waitFor(() => {
      const params = new URL(mocks.fetch.mock.calls.filter(([url]) => !url.includes('id=')).at(-1)?.[0], 'https://synthetic.invalid').searchParams;
      expect(Object.fromEntries(params)).toMatchObject({ category: 'Profesional', employees: '1000+', minScore: '70', queue: 'attention', sort: 'attention', page: '0' });
    });
    expect(screen.getByRole('combobox', { name: 'Kategori Self Diagnostic' })).toHaveValue('Profesional');
  });

  it('distinguishes a failed request from zero results and retries without calling actions', async () => {
    mocks.fetch.mockResolvedValue(response({ error: 'SQL82 missing private@example.invalid' }, 503));
    render(<Harness />);
    expect(await screen.findByRole('alert')).toHaveTextContent('SQL82');
    expect(screen.queryByText('private@example.invalid')).not.toBeInTheDocument();
    expect(screen.queryByText('Tidak ada Self Diagnostic yang cocok')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ekspor halaman CSV' })).toBeDisabled();
    mocks.fetch.mockResolvedValue(response(inbox([], 0)));
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat daftar lagi' }));
    await screen.findByText('Tidak ada Self Diagnostic yang cocok');
    expect(screen.getByText('0–0 dari 0')).toBeVisible(); expect(mocks.action).not.toHaveBeenCalled();
  });

  it('shows malformed server data as unavailable, not a healthy zero', async () => {
    mocks.fetch.mockResolvedValue(response({ success: true, records: [], total: 0 }));
    render(<Harness />); await screen.findByRole('alert');
    expect(screen.queryByText('0–0 dari 0')).not.toBeInTheDocument();
  });

  it('preserves selected filters when a new list request fails', async () => {
    render(<Harness />); await screen.findByText('1–20 dari 41');
    fireEvent.click(screen.getByText('Filter lanjutan'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Kategori Self Diagnostic' }), { target: { value: 'Profesional' } });
    await screen.findByText('1–20 dari 41');
    mocks.fetch.mockRejectedValue(new Error('private diagnostic'));
    fireEvent.change(screen.getByRole('combobox', { name: 'Ukuran perusahaan' }), { target: { value: '1000+' } });
    await screen.findByRole('alert');
    expect(screen.getByRole('combobox', { name: 'Kategori Self Diagnostic' })).toHaveValue('Profesional');
    expect(screen.getByRole('combobox', { name: 'Ukuran perusahaan' })).toHaveValue('1000+');
    expect(screen.queryByText('private diagnostic')).not.toBeInTheDocument();
  });

  it('provides a detail-only retry without reloading the entire list', async () => {
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(url.includes('id=') ? response({}, 503) : response(inbox())));
    render(<Harness initialId="first" />); await screen.findByRole('button', { name: 'Coba muat detail lagi' });
    await screen.findByText('1–20 dari 41');
    const listCalls = mocks.fetch.mock.calls.filter(([url]) => !url.includes('id=')).length;
    mocks.fetch.mockImplementation(() => Promise.resolve(response({ success: true, record: first })));
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat detail lagi' }));
    await screen.findByRole('heading', { name: 'Nadia' });
    expect(mocks.fetch.mock.calls.filter(([url]) => !url.includes('id=')).length).toBe(listCalls);
    expect(mocks.action).not.toHaveBeenCalled();
  });

  it('aborts obsolete list requests and ignores late results', async () => {
    let finish: (value: Response) => void = () => {};
    mocks.fetch.mockImplementation((url: string) => url.includes('id=') ? Promise.resolve(response({ success: true, record: second }))
      : new Promise<Response>((resolve) => { finish = resolve; }));
    render(<Harness />); await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
    const signal = mocks.fetch.mock.calls[0][1].signal;
    const oldFinish = finish;
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(url.includes('id=') ? { success: true, record: second } : inbox([second], 1))));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Arsip lama' } });
    expect(signal.aborted).toBe(true);
    await screen.findByText('1–1 dari 1');
    await act(async () => oldFinish(response(inbox([first], 41))));
    expect(screen.getByText('1–1 dari 1')).toBeVisible();
    expect(list().queryByRole('button', { name: /Buka Self Diagnostic Nadia/ })).not.toBeInTheDocument();
  });

  it.each([true, false])('times out stalled reads even if the transport ignores abort (%s)', async (respectsAbort) => {
    vi.useFakeTimers();
    try {
      mocks.fetch.mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
        if (respectsAbort) init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      render(<Harness initialId="first" />); await act(async () => {});
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
      expect(screen.getAllByRole('alert').every((node) => node.textContent?.includes('terlalu lama'))).toBe(true);
      expect(screen.getByRole('button', { name: 'Coba muat daftar lagi' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Coba muat detail lagi' })).toBeVisible();
    } finally { vi.useRealTimers(); }
  });

  it('does not show an old client after a newer detail request finishes', async () => {
    let finish: (value: Response) => void = () => {};
    mocks.fetch.mockImplementation((url: string) => url.includes('id=first') ? new Promise<Response>((resolve) => { finish = resolve; })
      : Promise.resolve(response(url.includes('id=old') ? { success: true, record: second } : inbox([first, second]))));
    render(<Harness />);
    const old = await screen.findByRole('button', { name: /Buka Self Diagnostic Arsip lama/ });
    fireEvent.click(old); await screen.findByRole('heading', { name: 'Arsip lama' });
    await act(async () => finish(response({ success: true, record: first })));
    expect(screen.getByRole('heading', { name: 'Arsip lama' })).toBeVisible(); expect(screen.queryByRole('heading', { name: 'Nadia' })).not.toBeInTheDocument();
  });

  it('opens a selected historical record outside the page without sending anything', async () => {
    render(<Harness initialId="old" />);
    await screen.findByRole('heading', { name: 'Arsip lama' });
    fireEvent.click(screen.getByRole('tab', { name: 'Proposal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Buat & kirim proposal standar' }));
    expect(mocks.action).not.toHaveBeenCalled(); expect(screen.getByRole('dialog')).toHaveTextContent('Email: nadia@example.com');
  });

  it('keeps send confirmation and refreshes server data after an explicit action', async () => {
    render(<Harness initialId="first" />); await screen.findByRole('heading', { name: 'Nadia' });
    fireEvent.click(screen.getByRole('tab', { name: 'Proposal' })); fireEvent.click(screen.getByRole('button', { name: 'Buat & kirim proposal standar' }));
    expect(mocks.action).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Buat & kirim' }));
    await waitFor(() => expect(mocks.action).toHaveBeenCalledOnce());
    expect(mocks.action.mock.calls[0]).toEqual(['/api/admin/assessments', expect.objectContaining({ method: 'POST', body: JSON.stringify({ id: 'first', action: 'request_proposal' }) })]);
    await waitFor(() => expect(mocks.fetch.mock.calls.filter(([url]) => url.includes('id=first')).length).toBeGreaterThan(1));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('recovers out-of-range pages after records disappear', async () => {
    render(<Harness />); await screen.findByText('1–20 dari 41');
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(url.includes('id=') ? { success: true, record: first } : inbox([], 1, 1))));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('1–1 dari 1'); expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  });

  it('loads aggregate counts only when requested, not private rows from the dashboard', async () => {
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(url.includes('distribution=1') ? { success: true, answerDistribution: [{ question: 'Q1', '1': 0, '2': 0, '3': 0, '4': 1, '5': 0 }] }
      : url.includes('id=') ? { success: true, record: first } : inbox())));
    render(<Harness />); await screen.findByText('1–20 dari 41');
    expect(mocks.fetch.mock.calls.every(([url]) => !url.includes('distribution'))).toBe(true);
    fireEvent.click(screen.getByText('Pola jawaban seluruh Self Diagnostic'));
    await waitFor(() => expect(mocks.fetch.mock.calls.some(([url]) => url.endsWith('?distribution=1'))).toBe(true));
  });
});
