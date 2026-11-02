import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpinPanel } from './spin-panel';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/lib/api-fetch', () => ({ apiFetch: mocks.fetch }));
vi.mock('@/components/spin-report', () => ({ SpinReport: () => <p>Laporan sintetis</p> }));
vi.mock('./spin-meeting-checklist', () => ({ SpinMeetingChecklist: function Checklist() {
  const [notes, setNotes] = useState('');
  return <textarea aria-label="Catatan sintetis" value={notes} onChange={(event) => setNotes(event.target.value)} />;
} }));
vi.mock('./spin-meeting-create', () => ({ SpinMeetingCreate: () => <p>Buat checklist sintetis</p> }));
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const row = (company: string) => ({ id: company, status: 'ready', contact: { name: 'Nama sintetis', email: 'contoh@example.invalid', company }, submitted_at: '2026-10-01T00:00:00Z' });
const result = (company: string, total = 1) => response({ records: [row(company)], total, searchApplied: true });
beforeEach(() => { vi.resetAllMocks(); mocks.fetch.mockImplementation(() => Promise.resolve(result('Klien awal', 41))); });

describe('SPIN admin server pagination', () => {
  it('shows bounded ranges and pages, resets search to the first page without flashing old results', async () => {
    render(<SpinPanel />);
    await screen.findByText('1–20 dari 41');
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('21–40 dari 41');
    expect(mocks.fetch.mock.calls.at(-1)?.[0]).toContain('page=1&search=');
    mocks.fetch.mockImplementation(() => Promise.resolve(result('Arsip lama', 1)));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari kebutuhan klien' }), { target: { value: 'arsip' } });
    expect(screen.queryByText('Klien awal')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled();
    await screen.findByText('Arsip lama');
    expect(mocks.fetch.mock.calls.at(-1)?.[0]).toContain('page=0&search=arsip');
    expect(screen.getByText('1 hasil pencarian')).toBeVisible();
  });

  it('passes search to the archive fallback instead of filtering the current page', async () => {
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(url.includes('/meetings?') ? response({}, 503) : result('Arsip lintas halaman')));
    render(<SpinPanel initialSearch="PT A & B" />);
    await screen.findByText('Arsip lintas halaman');
    expect(mocks.fetch.mock.calls[1][0]).toBe('/api/admin/discovery?page=0&search=PT%20A%20%26%20B');
    expect(screen.getByRole('button', { name: 'Mulai checklist' })).toBeDisabled();
    expect(screen.getByRole('searchbox', { name: 'Cari kebutuhan klien' })).toBeVisible();
  });

  it('never falls back on a denied admin session, hides stale rows, and recovers on retry', async () => {
    render(<SpinPanel />); await screen.findByText('Klien awal');
    mocks.fetch.mockImplementation(() => Promise.resolve(response({ error: 'private@example.invalid' }, 403)));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sesi admin');
    expect(screen.queryByText('Klien awal')).not.toBeInTheDocument();
    expect(screen.queryByText(/private@example/)).not.toBeInTheDocument();
    expect(mocks.fetch.mock.calls).toHaveLength(2);
    mocks.fetch.mockImplementation(() => Promise.resolve(result('Pulih', 41)));
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat lagi' }));
    await screen.findByText('Pulih');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not advertise a global search result from an older archive API that ignored search', async () => {
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(url.includes('/meetings?') ? response({}, 503) : response({ records: [row('Tidak relevan')], total: 41 })));
    render(<SpinPanel initialSearch="Arunika" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('pembaruan API');
    expect(screen.queryByText('Tidak relevan')).not.toBeInTheDocument();
  });

  it('ignores late replies even when the transport ignores abort', async () => {
    let finish: (value: Response) => void = () => {};
    mocks.fetch.mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })).mockImplementation(() => Promise.resolve(result('Terbaru')));
    render(<SpinPanel />);
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
    const signal = mocks.fetch.mock.calls[0][1].signal;
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'baru' } });
    expect(signal.aborted).toBe(true);
    await screen.findByText('Terbaru');
    await act(async () => finish(result('Terlambat')));
    expect(screen.queryByText('Terlambat')).not.toBeInTheDocument();
    expect(screen.getByText('Terbaru')).toBeVisible();
  });

  it('recovers an out-of-range page after the result set shrinks', async () => {
    render(<SpinPanel />); await screen.findByText('Klien awal');
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(url.includes('page=1') ? response({ records: [], total: 1 }) : result('Sisa satu')));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('Sisa satu');
    expect(screen.getByText('1–1 dari 1')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  });

  it('distinguishes no matches from errors and clears search', async () => {
    mocks.fetch.mockImplementation(() => Promise.resolve(response({ records: [], total: 0 })));
    render(<SpinPanel initialSearch="tidak ada" />);
    await screen.findByRole('heading', { name: 'Tidak ada kebutuhan yang cocok' });
    expect(screen.getByText('0 hasil pencarian')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus pencarian' }));
    await screen.findByRole('heading', { name: 'Belum ada pengisian' });
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('treats malformed data as an error, not an empty healthy inbox', async () => {
    mocks.fetch.mockImplementation(() => Promise.resolve(response({ records: null, total: null })));
    render(<SpinPanel />);
    await screen.findByRole('alert');
    expect(screen.queryByText('Belum ada pengisian')).not.toBeInTheDocument();
  });

  it('keeps the selected checklist mounted when retrying only the list', async () => {
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(url.includes('?id=') ? response({ record: { ...row('Klien awal'), summary: {}, answers: {} }, delivery: [], definition: null }) : result('Klien awal', 41)));
    render(<SpinPanel />); await screen.findByText('Klien awal');
    fireEvent.click(screen.getByRole('button', { name: /Klien awal/ }));
    const notes = await screen.findByLabelText('Catatan sintetis');
    fireEvent.change(notes, { target: { value: 'Jangan hilang' } });
    mocks.fetch.mockImplementation(() => Promise.reject(new TypeError('network offline')));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByRole('alert');
    mocks.fetch.mockImplementation(() => Promise.resolve(result('Klien lain', 41)));
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat lagi' }));
    await screen.findByText('Klien lain');
    expect(screen.getByLabelText('Catatan sintetis')).toBe(notes);
    expect(notes).toHaveValue('Jangan hilang');
  });

  it.each([true, false])('times out a request even if the transport does not respect abort (%s)', async (respectsAbort) => {
    vi.useFakeTimers();
    try {
      mocks.fetch.mockImplementation((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
        if (respectsAbort) init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      render(<SpinPanel />);
      await act(async () => {});
      await act(async () => { await vi.advanceTimersByTimeAsync(20000); });
      expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');
      expect(screen.getByRole('button', { name: 'Coba muat lagi' })).toBeVisible();
    } finally { vi.useRealTimers(); }
  });
});
