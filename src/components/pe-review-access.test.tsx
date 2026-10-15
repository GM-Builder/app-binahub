import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PEReviewAccessPanel } from './pe-review-access';
const access = { shared: true, evaluationConsent: false, exportConsent: false, clarity: null, usefulness: null };
const open = () => { fireEvent.click(screen.getByText('Privasi & data')); };
afterEach(cleanup);
describe('one privacy entry with distinct safe actions', () => {
  it('revokes consultant access without deleting data or adding evaluation consent', async () => {
    const update = vi.fn().mockResolvedValue({ access: { ...access, shared: false } }), erase = vi.fn();
    render(<PEReviewAccessPanel id="test" access={access} token={async () => ''} onChange={vi.fn()} update={update} onErase={erase} />);
    expect(screen.getByText('Privasi & data').closest('details')).not.toHaveAttribute('open'); open();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Izinkan tim BinaHub meninjau hasil saya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pilihan' }));
    await screen.findByText('Pilihan privasi Anda telah disimpan.');
    expect(update).toHaveBeenCalledWith({ share: false, consentVersion: null, evaluate: false, clarity: null, usefulness: null });
    expect(erase).not.toHaveBeenCalled();
  });
  it('saves evaluation independently and does not require ratings to grant explicit consent', async () => {
    const update = vi.fn().mockResolvedValue({ access: { ...access, exportConsent: true, evaluationConsent: true } });
    render(<PEReviewAccessPanel id="test" access={access} token={async () => ''} onChange={vi.fn()} update={update} />); open();
    fireEvent.click(screen.getByRole('checkbox', { name: /Bantu meningkatkan/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pilihan' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ share: true, evaluate: true, evaluationVersion: 'pe-evaluation-v2', clarity: null, usefulness: null })));
  });
  it.each([false, undefined])('shows and can withdraw legacy statistics consent with exportConsent=%s', async exportConsent => {
    const legacy = { ...access, evaluationConsent: true, exportConsent, clarity: 4, usefulness: 5 };
    const update = vi.fn().mockResolvedValue({ access: { ...legacy, evaluationConsent: false, exportConsent: false, clarity: null, usefulness: null } });
    render(<PEReviewAccessPanel id="test" access={legacy} token={async () => ''} onChange={vi.fn()} update={update} />); open();
    const checkbox = screen.getByRole('checkbox', { name: /Bantu meningkatkan/ });
    expect(checkbox).toBeChecked(); expect(screen.getByText(/tidak mencakup ekspor jawaban per orang/)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.click(checkbox); expect(screen.getByRole('button', { name: 'Simpan pilihan' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pilihan' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ share: true, consentVersion: 'pe-consultant-review-v1', evaluationVersion: 'pe-evaluation-v2', evaluate: false, clarity: null, usefulness: null }));
  });
  it('does not upgrade legacy statistics permission when only consultant sharing changes', async () => {
    const legacy = { ...access, evaluationConsent: true, exportConsent: false, clarity: 4, usefulness: 5 };
    const update = vi.fn().mockResolvedValue({ access: { ...legacy, shared: false } });
    render(<PEReviewAccessPanel id="test" access={legacy} token={async () => ''} onChange={vi.fn()} update={update} />); open();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Izinkan tim BinaHub meninjau hasil saya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pilihan' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ share: false, consentVersion: null, evaluate: true, clarity: 4, usefulness: 5 }));
  });
  it('requires a separate deletion confirmation and preserves privacy edits on errors', async () => {
    const update = vi.fn().mockRejectedValue(new Error('Connection lost')), erase = vi.fn().mockResolvedValue(undefined);
    render(<PEReviewAccessPanel id="test" access={access} token={async () => ''} onChange={vi.fn()} update={update} onErase={erase} />); open();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Izinkan tim BinaHub meninjau hasil saya' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan pilihan' })); await screen.findByRole('alert');
    expect(screen.getByRole('checkbox', { name: 'Izinkan tim BinaHub meninjau hasil saya' })).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus data pengisian' })); expect(erase).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Batal' })); expect(erase).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus data pengisian' })); fireEvent.click(screen.getByRole('button', { name: 'Hapus permanen' }));
    await waitFor(() => expect(erase).toHaveBeenCalledTimes(1));
  });
});
