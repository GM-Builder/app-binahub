import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PEResult } from './pe-report';
import type { PEReport } from '@/lib/individual-assessment';
const practice = { focus: 'Synthetic focus', context: 'Synthetic work context', successIndicator: 'Synthetic indicator', followUp: 'Synthetic follow-up' };
const report: PEReport = { goal: 'Synthetic goal', methodology: 'Synthetic methodology', priorityExplanation: 'Synthetic priority rules', notice: 'Synthetic limitation',
  privacy: { purpose: 'Synthetic purpose.', access: 'Synthetic access.', process: 'Synthetic data help.', contact: 'privacy@example.invalid', retentionUntil: '2027-04-15T00:00:00Z' },
  summary: { role: 'Synthetic role', goal: 'Synthetic goal', answeredCount: 18, expectedCount: 18, naCount: 2, areasWithBothMethods: 2, focusNames: ['Adaptability'], description: 'Synthetic summary' },
  areas: [{ code: 'PE-02', name: 'Self-Development', definition: 'Synthetic area definition', relevance: 'high', interpretation: 'Synthetic interpretation',
    selfReport: { score: null, validCount: 2, naCount: 2, status: 'insufficient_evidence' }, sjt: { score: 0, validCount: 2, status: 'scored' }, practice: null }],
  priorities: [{ code: 'PE-04', name: 'Adaptability', reason: 'Synthetic priority reason', practice }] };
afterEach(cleanup);
describe('readable individual development report', () => {
  it('leads with a visual summary and keeps practical steps before detailed scores', () => {
    render(<PEResult report={report} retentionUntil="2027-04-15T00:00:00Z" headingLevel={1} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hasil Self Diagnostic individu');
    const headings = screen.getAllByRole('heading').map(node => node.textContent);
    expect(headings.indexOf('Langkah pengembangan')).toBeLessThan(headings.indexOf('Area Pengembangan'));
    for (const value of [practice.focus,practice.context,practice.successIndicator]) expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.queryByText(/Tinjau kembali kompetensi Anda dalam satu bulan/)).not.toBeInTheDocument();
    expect(screen.getByText(/Pilih satu saran berikut untuk diterapkan/)).toBeVisible();
    expect(screen.getByRole('img', { name: 'Self-Development, Skor gabungan: bukti belum cukup' })).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
    expect(screen.queryByText('Bagaimana fokus ini ditentukan?')).not.toBeInTheDocument();
    expect(screen.queryByText(/18 dari 18 pertanyaan/)).not.toBeInTheDocument();
    const detail = screen.getByText('Rincian Self-Development').closest('details');
    expect(detail).not.toHaveAttribute('open'); fireEvent.click(screen.getByText('Rincian Self-Development'));
    expect(screen.getByText('Synthetic interpretation')).toBeInTheDocument();
    expect(screen.getByText('Synthetic limitation')).toBeVisible();
    expect(screen.getByText('Synthetic purpose. Synthetic access.')).toBeVisible();
    expect(screen.getByText('Synthetic data help.')).toBeVisible();
    expect(screen.getAllByRole('link').every(link => !link.getAttribute('href')?.startsWith('#')
      || document.getElementById(link.getAttribute('href')!.slice(1)))).toBe(true);
  });
});
