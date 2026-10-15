import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PEProfileChart } from './pe-profile-chart';
import type { PEReport } from '@/lib/individual-assessment';
afterEach(cleanup);
const areas: PEReport['areas'] = [{ code: 'PE-02', name: 'Self-Development', definition: '', relevance: 'normal', practice: null,
  selfReport: { score: null, validCount: 2, naCount: 2, status: 'insufficient_evidence' }, sjt: { score: 0, validCount: 2, status: 'scored' } },
{ code: 'PE-04', name: 'Adaptability', definition: '', relevance: 'high', practice: null,
  selfReport: { score: 62.5, validCount: 4, naCount: 0, status: 'scored' }, sjt: { score: 100, validCount: 2, status: 'scored' } }];
describe('individual evidence chart', () => {
  it('distinguishes missing evidence from an actual zero and labels both methods without percentages', () => {
    render(<PEProfileChart areas={areas} />);
    const missing = screen.getByRole('img', { name: 'Self-Development, Pengalaman kerja: bukti belum cukup' });
    const zero = screen.getByRole('img', { name: 'Self-Development, Studi kasus: 0 dari 100' });
    expect(missing.querySelector('rect')).toHaveAttribute('stroke-dasharray', '4 4');
    expect(zero.querySelector('rect[fill="#0F766E"]')).toHaveAttribute('width', '0');
    expect(screen.getByRole('img', { name: 'Adaptability, Pengalaman kerja: 62,5 dari 100' }).querySelector('rect[fill="#0B2C6B"]')).toHaveAttribute('width', '250');
    expect(screen.getByRole('img', { name: 'Adaptability, Studi kasus: 100 dari 100' }).querySelector('rect[fill="#0F766E"]')).toHaveAttribute('width', '400');
    expect(screen.getByText(/Baca kedua metode secara terpisah/)).toBeVisible();
    expect(screen.getAllByRole('img')).toHaveLength(4);
  });
  it('shows an honest empty state rather than sample or invented scores', () => {
    render(<PEProfileChart areas={[]} />);
    expect(screen.getByText('Belum ada profil area yang dapat ditampilkan.')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
