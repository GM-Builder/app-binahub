import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignArchivePanel } from './campaign-archive-panel';
import { AcquisitionControlPanel } from './acquisition-control-panel';
const id = '00000000-0000-4000-8000-000000000001', journeyId = '00000000-0000-4000-8000-000000000002';
const row = { id, title: 'Kampanye lama', subtitle: 'OLD_CAMPAIGN', context: 'Daftar yang dijeda', status: 'completed', occurredAt: '2020-01-01T00:00:00Z', owner: 'admin@example.invalid', sourceChannel: 'outbound', channel: 'email', sourceStatus: 'paused', sourceActive: false };
function envelope(url: string, records: object[] = [row], total = 1005) {
  const query = new URL(url, 'https://local.invalid').searchParams;
  return { success: true, version: 1, kind: query.get('kind'), page: Number(query.get('page') || 0), pageSize: 20, campaignId: query.get('campaignId'), journeyId: query.get('journeyId'), snapshotAt: '2026-11-04T01:00:00Z', total, all: 1005, statusCounts: { completed: 1005 }, records };
}
const action = vi.fn(), back = vi.fn();
beforeEach(() => { action.mockReset().mockImplementation(async url => envelope(url)); back.mockReset(); });
afterEach(() => { vi.useRealTimers(); });
describe('campaign archive administration', () => {
  it('reads without legacy dashboard data and keeps all writes absent', async () => {
    render(<CampaignArchivePanel onAction={action} onBack={back} />);
    expect(await screen.findByRole('heading', { name: row.title })).toBeVisible();
    expect(screen.getByText('1.005 catatan cocok · 1–1 ditampilkan')).toBeVisible();
    expect(action.mock.calls.every(([, init]) => !init?.method || init.method === 'GET')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke kampanye' })); expect(back).toHaveBeenCalledOnce();
  });
  it('paginates on the server, searches literally, resets page and leaves global counts independent', async () => {
    render(<CampaignArchivePanel onAction={action} onBack={back} />); await screen.findByRole('heading', { name: row.title });
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await waitFor(() => expect(new URL(action.mock.calls.at(-1)![0], 'https://local.invalid').searchParams.get('page')).toBe('1'));
    await screen.findByText('Halaman 2 dari 51');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: ' %_* 東京 ' } });
    await waitFor(() => expect(new URL(action.mock.calls.at(-1)![0], 'https://local.invalid').searchParams.get('search')).toBe('%_* 東京'));
    expect(new URL(action.mock.calls.at(-1)![0], 'https://local.invalid').searchParams.get('page')).toBe('0');
    expect(screen.getByRole('searchbox')).toHaveValue(' %_* 東京 ');
  });
  it('preserves list search on return and separates test emails and provider acceptance from inbox delivery', async () => {
    action.mockImplementation(async url => {
      const kind = new URL(url, 'https://local.invalid').searchParams.get('kind');
      return kind === 'campaigns' ? envelope(url) : envelope(url, [{ id: journeyId, title: 'Admin', subtitle: 'admin@example.invalid', context: '', status: 'sent', occurredAt: 'invalid', kind: 'test', locale: 'id' }], 1);
    });
    render(<CampaignArchivePanel onAction={action} onBack={back} />); await screen.findByRole('button', { name: 'Buka riwayat' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lama' } }); await waitFor(() => expect(action.mock.calls.at(-1)![0]).toContain('search=lama'));
    await screen.findByRole('button', { name: 'Buka riwayat' }); fireEvent.click(screen.getByRole('button', { name: 'Buka riwayat' }));
    expect(await screen.findByText('Email uji · Indonesia')).toBeVisible(); expect(screen.getByText(/bukan bukti masuk inbox/)).toBeVisible();
    expect(screen.getByText('Waktu belum tercatat')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke daftar arsip' })); expect(screen.getByRole('searchbox')).toHaveValue('lama');
    expect(action.mock.calls.every(([, init]) => !init?.method)).toBe(true);
  });
  it('opens paged journey events with exact campaign and journey scope', async () => {
    action.mockImplementation(async url => {
      const kind = new URL(url, 'https://local.invalid').searchParams.get('kind');
      return kind === 'campaigns' ? envelope(url, [{ ...row, sourceChannel: 'inbound' }]) : envelope(url, [{ id: journeyId, title: 'Kunjungan contoh', subtitle: '/insight', context: '', status: 'browsing', occurredAt: row.occurredAt }], 1);
    });
    render(<CampaignArchivePanel onAction={action} onBack={back} />); fireEvent.click(await screen.findByRole('button', { name: 'Buka riwayat' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat aktivitas' }));
    await waitFor(() => expect(action.mock.calls.at(-1)![0]).toContain('kind=journey_events'));
    const query = new URL(action.mock.calls.at(-1)![0], 'https://local.invalid').searchParams;
    expect(query.get('campaignId')).toBe(id); expect(query.get('journeyId')).toBe(journeyId); expect(screen.getByText(/bukan jumlah orang unik/)).toBeVisible();
  });
  it('reports missing SQL and malformed data as unavailable, never as zero; retry keeps filters', async () => {
    action.mockRejectedValueOnce(new Error('SQL88 required'));
    render(<CampaignArchivePanel onAction={action} onBack={back} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('SQL88'); expect(screen.queryByText(/0 catatan cocok/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat arsip lagi' })); await screen.findByRole('button', { name: 'Buka riwayat' });
    action.mockImplementationOnce(async url => ({ ...envelope(url), campaignId: journeyId }));
    fireEvent.click(screen.getByRole('button', { name: 'Perbarui arsip' })); await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Buka riwayat' })).not.toBeInTheDocument();
  });
  it('ignores late reads after filter changes and aborts the obsolete request', async () => {
    let resolveOld!: (value: unknown) => void; action.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    render(<CampaignArchivePanel onAction={action} onBack={back} />); await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const oldUrl = action.mock.calls[0][0], oldSignal = action.mock.calls[0][1].signal;
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'next' } });
    await screen.findByRole('button', { name: 'Buka riwayat' }); expect(oldSignal.aborted).toBe(true);
    await act(async () => resolveOld(envelope(oldUrl, [{ ...row, title: 'Stale result' }])));
    expect(screen.queryByRole('heading', { name: 'Stale result' })).not.toBeInTheDocument();
  });
  it('makes archive accessible even if the legacy campaign load fails', async () => {
    action.mockImplementation(async url => { if (url === '/api/admin/acquisition') throw new Error('Legacy unavailable'); return envelope(url); });
    render(<AcquisitionControlPanel onAction={action} initialView="outbound" embedded />);
    fireEvent.click(screen.getByRole('button', { name: 'Arsip kampanye' }));
    expect(await screen.findByRole('heading', { name: 'Arsip kampanye' })).toBeVisible();
    const archive = screen.getByRole('region', { name: 'Arsip kampanye' }); expect(await within(archive).findByRole('button', { name: 'Buka riwayat' })).toBeVisible();
  });
});
