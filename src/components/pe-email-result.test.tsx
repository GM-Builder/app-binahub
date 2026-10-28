import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const deps = vi.hoisted(() => ({ request: vi.fn(), params: new URLSearchParams('attempt=00000000-0000-4000-8000-000000000001') }));
vi.mock('next/navigation', () => ({ useSearchParams: () => deps.params }));
vi.mock('@/lib/pe-guest', () => ({ guestRequest: deps.request }));
import { PEEmailResult } from './pe-email-result';
import { PERequestError } from '@/lib/individual-assessment';
const id = '00000000-0000-4000-8000-000000000001', token = 'a'.repeat(64);
const result = { retentionUntil: '2027-04-15T00:00:00Z', access: { shared: true, evaluationConsent: false, exportConsent: false, clarity: null, usefulness: null },
  report: { goal: 'Synthetic goal', areas: [], priorities: [], methodology: 'Synthetic methodology', priorityExplanation: 'Synthetic priorities', notice: 'Synthetic limits' } };
beforeEach(() => { vi.clearAllMocks(); deps.params = new URLSearchParams(`attempt=${id}`); window.history.replaceState(null, '', `/insight/individual/result?attempt=${id}`); vi.stubGlobal('scrollTo', vi.fn()); deps.request.mockRejectedValue(new PERequestError('Private', 'PE_AUTH_REQUIRED', 401)); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('compact secure result entry', () => {
  it('keeps link recovery secondary and explains why opening is unavailable without a link', async () => {
    render(<PEEmailResult />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Lihat hasil saya' })).toBeDisabled());
    expect(screen.getByText('Butuh tautan baru?').closest('details')).not.toHaveAttribute('open');
    expect(screen.getByText(/Buka tautan pribadi dari email/)).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lihat hasil Self Diagnostic Anda.');
    expect(deps.request).not.toHaveBeenCalledWith(expect.anything(), 'POST', expect.anything());
  });
  it('exchanges the token only after a click, shows loading and prevents duplicate exchange', async () => {
    window.history.replaceState(null, '', `/insight/individual/result?attempt=${id}#access=${token}`);
    let complete!: (value: unknown) => void;
    deps.request.mockImplementation(async (_path, method) => method === 'POST' ? new Promise(resolve => { complete = resolve; }) : result);
    render(<PEEmailResult />);
    const open = await screen.findByRole('button', { name: 'Lihat hasil saya' });
    await waitFor(() => expect(open).toBeEnabled());
    expect(window.location.hash).toBe(''); expect(deps.request).not.toHaveBeenCalled();
    fireEvent.click(open); fireEvent.click(open);
    expect(screen.getByRole('button', { name: 'Membuka hasil…' })).toBeDisabled();
    expect(deps.request).toHaveBeenCalledTimes(1);
    await act(async () => { complete({ success: true }); });
    await screen.findByRole('heading', { name: 'Hasil Self Diagnostic individu' });
    expect(deps.request.mock.calls[0]).toEqual([`/${id}/result`, 'POST', { token }]);
    expect(deps.request.mock.calls[1]).toEqual([`/${id}/result`]);
    expect(screen.getByLabelText('Hasil Self Diagnostic Anda')).toHaveFocus();
  });
  it('does not consume the token again if session exchange succeeded but the report GET failed', async () => {
    window.history.replaceState(null, '', `/insight/individual/result?attempt=${id}#access=${token}`);
    deps.request.mockResolvedValueOnce({ success: true }).mockRejectedValueOnce(new Error('Temporary failure')).mockResolvedValueOnce(result);
    render(<PEEmailResult />); const open = await screen.findByRole('button', { name: 'Lihat hasil saya' });
    await waitFor(() => expect(open).toBeEnabled()); fireEvent.click(open); await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Lihat hasil saya' }));
    await screen.findByRole('heading', { name: 'Hasil Self Diagnostic individu' });
    expect(deps.request.mock.calls.filter(([, method]) => method === 'POST')).toHaveLength(1);
  });
  it('opens recovery for expired links and preserves privacy in the request-link response', async () => {
    window.history.replaceState(null, '', `/insight/individual/result?attempt=${id}#access=${token}`);
    deps.request.mockRejectedValueOnce(new PERequestError('Tautan kedaluwarsa.', 'PE_LINK_EXPIRED', 410)).mockResolvedValueOnce({ success: true });
    render(<PEEmailResult />); const open = await screen.findByRole('button', { name: 'Lihat hasil saya' });
    await waitFor(() => expect(open).toBeEnabled()); fireEvent.click(open); await screen.findByRole('alert');
    expect(screen.getByText('Butuh tautan baru?').closest('details')).toHaveAttribute('open');
    fireEvent.change(screen.getByRole('textbox', { name: 'Email pengisian' }), { target: { value: 'test@example.invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim tautan baru' }));
    await screen.findByText(/Jika email sesuai dengan data pengisian/);
    expect(deps.request.mock.calls[1]).toEqual([`/${id}/request-link`, 'POST', { email: 'test@example.invalid' }]);
  });
  it('restores an authorized session without requiring another email-link exchange', async () => {
    deps.request.mockResolvedValue(result); render(<PEEmailResult />);
    await screen.findByRole('heading', { name: 'Hasil Self Diagnostic individu' });
    expect(deps.request).toHaveBeenCalledTimes(1);
    expect(deps.request).toHaveBeenCalledWith(`/${id}/result`);
  });
});
