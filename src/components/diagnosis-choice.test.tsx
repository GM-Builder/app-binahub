import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ fetch: vi.fn(), search: '' }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(mock.search) }));
import { DiagnosisChoice, DiagnosisChoiceLoading } from './diagnosis-choice';

const response = (available: boolean) => new Response(JSON.stringify({ available }), { status: 200 });

beforeEach(() => {
  mock.fetch.mockReset();
  mock.search = '';
  vi.stubGlobal('fetch', mock.fetch);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('diagnosis choice', () => {
  it('provides two named choices with consistent actions and separate history', async () => {
    mock.fetch.mockResolvedValue(response(true));
    render(<DiagnosisChoice />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Apa yang ingin Anda kembangkan?');
    expect(screen.getByRole('article', { name: 'Tim / Organisasi' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Individu' })).toBeInTheDocument();
    expect(screen.queryByText(/gratis/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mulai diagnosis tim' })).toHaveAttribute('href', '/insight');
    expect(await screen.findByRole('link', { name: 'Mulai diagnosis individu' })).toHaveAttribute('href', '/insight/individual');
    const history = screen.getByRole('link', { name: 'Draft & hasil individu' });
    expect(history).toHaveAttribute('href', '/insight/individual/history');
    expect(history.closest('article')).toBeNull();
  });

  it('preserves organization language/campaign and limits individual attribution to its existing channel contract', async () => {
    mock.search = 'lang=en&utm_source=instagram&utm_campaign=launch';
    mock.fetch.mockResolvedValue(response(true));
    render(<DiagnosisChoice />);
    expect(screen.getByRole('link', { name: 'Mulai diagnosis tim' })).toHaveAttribute('href', '/en/insight?lang=en&utm_source=instagram&utm_campaign=launch');
    expect(await screen.findByRole('link', { name: 'Mulai diagnosis individu' })).toHaveAttribute('href', '/insight/individual?source=instagram');
  });

  it('shows an announced loading state without a clickable individual entry', () => {
    mock.fetch.mockReturnValue(new Promise(() => {}));
    render(<DiagnosisChoice />);
    expect(screen.getByRole('button', { name: 'Memeriksa ketersediaan…' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa ketersediaan diagnosis individu.');
    expect(screen.queryByRole('link', { name: 'Mulai diagnosis individu' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mulai diagnosis tim' })).toBeInTheDocument();
  });

  it('keeps a paused release closed without implying a network error', async () => {
    mock.fetch.mockResolvedValue(response(false));
    render(<DiagnosisChoice />);
    expect(await screen.findByText(/Pengisian baru sedang dijeda/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diagnosis individu belum tersedia' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Draft & hasil individu' })).toBeInTheDocument();
  });

  it('allows a failed read to be retried without bypassing readiness', async () => {
    mock.fetch.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(response(true));
    render(<DiagnosisChoice />);
    fireEvent.click(await screen.findByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByRole('link', { name: 'Mulai diagnosis individu' })).toBeInTheDocument();
    expect(mock.fetch).toHaveBeenCalledTimes(2);
    expect(mock.fetch.mock.calls.every(([path]) => path === '/api/assessment/individual/availability')).toBe(true);
  });

  it.each([
    new Response('{}', { status: 503 }),
    new Response('{"available":"true"}', { status: 200 }),
    new Response('not json', { status: 200 }),
  ])('fails closed for an unsuccessful or malformed response %#', async result => {
    mock.fetch.mockResolvedValue(result);
    render(<DiagnosisChoice />);
    expect(await screen.findByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mulai diagnosis individu' })).not.toBeInTheDocument();
  });

  it('ends a stalled check after eight seconds and ignores a late response', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Response) => void;
    mock.fetch.mockReturnValue(new Promise<Response>(done => { resolve = done; }));
    render(<DiagnosisChoice />);
    await act(() => vi.advanceTimersByTimeAsync(8_000));
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
    expect(mock.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { resolve(response(true)); });
    expect(screen.queryByRole('link', { name: 'Mulai diagnosis individu' })).not.toBeInTheDocument();
  });

  it('aborts its read when leaving the page', async () => {
    mock.fetch.mockReturnValue(new Promise(() => {}));
    const view = render(<DiagnosisChoice />);
    const signal = mock.fetch.mock.calls[0][1].signal;
    view.unmount();
    await waitFor(() => expect(signal.aborted).toBe(true));
  });

  it('keeps the same heading and announces the Suspense skeleton without fetching', () => {
    render(<DiagnosisChoiceLoading />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Apa yang ingin Anda kembangkan?');
    expect(screen.getByRole('status')).toHaveTextContent('Menyiapkan pilihan diagnosis…');
    expect(mock.fetch).not.toHaveBeenCalled();
  });
});
