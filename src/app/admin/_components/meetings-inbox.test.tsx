import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { meetingFixture, meetingDetail, meetingsBody } from '@/test/fixtures/meetings-inbox';
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@/lib/api-fetch', () => ({ apiFetch: mocks.fetch }));
import { MeetingsPanel } from './meetings-panel';
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const params = (url: string) => new URL(url, 'https://test.invalid').searchParams;
const ready = () => screen.findByText('1–20 dari 41 jadwal');
beforeEach(() => {
  vi.resetAllMocks(); mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(params(url).has('id')
    ? { success: true, record: meetingDetail() } : meetingsBody(undefined, 41, Number(params(url).get('page') || 0)))));
});
afterEach(() => vi.useRealTimers());
describe('server consultation archive, no production services', () => {
  it('reads bounded pages independently of dashboard, with global totals and consistent WIB display', async () => {
    render(<MeetingsPanel serverMode />); await ready();
    expect(mocks.fetch.mock.calls[0][0]).toContain('/api/admin/meetings/inbox?'); expect(screen.getAllByText(/7\.00|07:00/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Semua 1201' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' })); await screen.findByText('21–40 dari 41 jadwal');
    expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('1');
  });
  it('searches literal old records and resets the page, removing stale rows immediately', async () => {
    render(<MeetingsPanel serverMode />); await ready(); fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' })); await screen.findByText('21–40 dari 41 jadwal');
    mocks.fetch.mockResolvedValue(response(meetingsBody([meetingFixture({ attendeeName: 'Tokyo %_*' })], 1)));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'A,B %_* 東京' } });
    expect(screen.queryByText('21–40 dari 41 jadwal')).not.toBeInTheDocument();
    await screen.findByText('1–1 dari 1 jadwal'); expect(Object.fromEntries(params(mocks.fetch.mock.calls.at(-1)![0]))).toMatchObject({ page: '0', search: 'A,B %_* 東京' });
  });
  it('keeps view and status during missing migration, never disguising failure as empty', async () => {
    render(<MeetingsPanel serverMode />); await ready(); mocks.fetch.mockResolvedValueOnce(response({ error: 'SQL87 PRIVATE_DB' }, 503));
    fireEvent.click(screen.getByRole('button', { name: 'Riwayat 1154' })); expect(await screen.findByRole('alert')).toHaveTextContent('SQL87');
    expect(screen.queryByText('Belum ada booking tersinkronisasi')).not.toBeInTheDocument(); expect(screen.queryByText(/PRIVATE_DB/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Riwayat —' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat jadwal lagi' })); await ready(); expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('view')).toBe('history');
  });
  it('loads detail by ID rather than relying on a page snapshot; closes with Escape', async () => {
    render(<MeetingsPanel serverMode />); await ready(); fireEvent.click(screen.getAllByRole('button', { name: 'Buka konsultasi Dewi Sintetis' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Dewi Sintetis' });
    expect(await within(dialog).findByRole('link', { name: /Buka ruang konsultasi/ })).toHaveAttribute('href', 'https://meet.company.invalid/synthetic');
    expect(within(dialog).getByText('America/New_York')).toBeVisible(); expect(within(dialog).getByText('Mulai (WIB)')).toBeVisible();
    expect(mocks.fetch.mock.calls.at(-1)![0]).toContain('?id=' + meetingFixture().id);
    fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it.each([{ meetingUrl: 'javascript:alert(1)' }, { meetingUrl: 'http://meet.company.invalid' }, { isSuperseded: true }, { isUpcoming: false }])('does not offer unsafe or obsolete room links %j', async extra => {
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response(params(url).has('id') ? { success: true, record: meetingDetail(extra) } : meetingsBody())));
    render(<MeetingsPanel serverMode />); await ready(); fireEvent.click(screen.getAllByRole('button', { name: 'Buka konsultasi Dewi Sintetis' })[0]);
    await screen.findByText(/Ruang konsultasi hanya tersedia/); expect(screen.queryByRole('link', { name: /Buka ruang konsultasi/ })).not.toBeInTheDocument();
  });
  it('fails closed on wrong detail ID then retries without losing the selected record', async () => {
    render(<MeetingsPanel serverMode />); await ready(); mocks.fetch.mockResolvedValueOnce(response({ success: true, record: meetingDetail({ id: '00000000-0000-4000-8000-000000000002' }) }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Buka konsultasi Dewi Sintetis' })[0]); await screen.findByRole('alert');
    expect(screen.queryByRole('link', { name: /Buka ruang konsultasi/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat detail lagi' })); expect(await screen.findByRole('link', { name: /Buka ruang konsultasi/ })).toBeVisible();
  });
  it('ignores late filters even when the transport ignores cancellation', async () => {
    let resolve: (value: Response) => void = () => {};
    mocks.fetch.mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; })); render(<MeetingsPanel serverMode />);
    mocks.fetch.mockResolvedValue(response(meetingsBody([meetingFixture({ attendeeName: 'Current' })], 1)));
    fireEvent.click(screen.getByRole('button', { name: 'Semua —' })); await screen.findByText('1–1 dari 1 jadwal');
    await act(async () => resolve(response(meetingsBody([meetingFixture({ attendeeName: 'Old stale' })]))));
    expect(screen.queryByText('Old stale')).not.toBeInTheDocument(); expect(screen.getByText('Current')).toBeVisible();
  });
  it('clamps removed pages and distinguishes true zero', async () => {
    render(<MeetingsPanel serverMode />); await ready();
    mocks.fetch.mockImplementation((url: string) => Promise.resolve(response({ ...meetingsBody([], 0, Number(params(url).get('page') || 0)), counts: { ...meetingsBody().counts, all: 0 }, nextBooking: null })));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' })); await screen.findByText('0–0 dari 0 jadwal');
    expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('page')).toBe('0'); expect(screen.getByText('Belum ada booking tersinkronisasi')).toBeVisible();
  });
  it('keeps a valid detail available when only the paginated list fails', async () => {
    render(<MeetingsPanel serverMode />); await ready();
    fireEvent.click(screen.getAllByRole('button', { name: 'Buka konsultasi Dewi Sintetis' })[0]);
    await screen.findByRole('link', { name: /Buka ruang konsultasi/ });
    mocks.fetch.mockResolvedValueOnce(response({ error: 'Unavailable' }, 503));
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' })); await screen.findByRole('alert');
    expect(screen.getByRole('link', { name: /Buka ruang konsultasi/ })).toBeVisible();
  });
  it('preserves status filters through retry and ignores closed late detail responses', async () => {
    render(<MeetingsPanel serverMode />); await ready();
    mocks.fetch.mockResolvedValueOnce(response({ error: 'Unavailable' }, 503));
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter status konsultasi' }), { target: { value: 'cancelled' } });
    await screen.findByRole('alert'); expect(screen.getByRole('combobox')).toHaveValue('cancelled');
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat jadwal lagi' })); await ready();
    expect(params(mocks.fetch.mock.calls.at(-1)![0]).get('status')).toBe('cancelled');
    let resolve: (value: Response) => void = () => {};
    mocks.fetch.mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Buka konsultasi Dewi Sintetis' })[0]);
    fireEvent.keyDown(document, { key: 'Escape' });
    await act(async () => resolve(response({ success: true, record: meetingDetail() })));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(screen.queryByRole('link', { name: /Buka ruang konsultasi/ })).not.toBeInTheDocument();
  });
  it('times out, retries, and hides actionable stale details while refreshing', async () => {
    vi.useFakeTimers(); mocks.fetch.mockImplementation(() => new Promise(() => {})); render(<MeetingsPanel serverMode />);
    await act(async () => { await vi.advanceTimersByTimeAsync(20001); }); expect(screen.getByRole('alert')).toHaveTextContent('terlalu lama');
    mocks.fetch.mockResolvedValue(response(meetingsBody())); await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Coba muat jadwal lagi' })));
    mocks.fetch.mockResolvedValue(response({ success: true, record: meetingDetail() })); await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Buka konsultasi Dewi Sintetis' })[0]));
    expect(screen.getByRole('link', { name: /Buka ruang konsultasi/ })).toBeVisible(); mocks.fetch.mockImplementation(() => new Promise(() => {}));
    fireEvent.click(screen.getByRole('button', { name: 'Perbarui jadwal' })); expect(screen.queryByRole('link', { name: /Buka ruang konsultasi/ })).not.toBeInTheDocument();
  });
});
