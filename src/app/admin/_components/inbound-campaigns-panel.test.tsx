import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InboundCampaignsPanel } from './inbound-campaigns-panel';
import { InboundAttributionPanel } from './inbound-attribution-panel';
import type { InboundCampaign } from '../_lib/inbound-campaign';
const source = { id: 'source', name: 'Website BinaHub', channel: 'inbound', status: 'approved', active: true };
const campaign: InboundCampaign = { id: 'campaign', source_id: source.id, campaign_code: 'INBOUND-ONE', name: 'Kampanye November', status: 'approved',
  channel: 'organic', owner: 'admin@company.invalid', utm_config: { source: 'social', medium: 'social', campaign: 'inbound-one' }, target_definition: { landingPath: '/rekomendasi-program' } };
const action = vi.fn(), setup = vi.fn(), refresh = vi.fn();
const attribution = { phase20Ready: true, journeys: [], events: [], links: [], interests: [] };
beforeEach(() => { action.mockReset().mockResolvedValue(attribution); setup.mockReset(); refresh.mockReset().mockResolvedValue(undefined); });
describe('simple inbound campaign management', () => {
  it('shows a shared campaign registry without eagerly loading technical journey data', () => {
    render(<InboundCampaignsPanel sources={[source]} campaigns={[campaign]} onAction={action} onRefresh={refresh} onSetup={setup} />);
    expect(screen.getByRole('heading', { name: campaign.name })).toBeVisible(); expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Tautan ' + campaign.name })).toHaveValue('https://binahub.id/rekomendasi-program?utm_source=social&utm_medium=social&utm_campaign=inbound-one');
    expect(screen.queryByRole('heading', { name: 'Detail perjalanan' })).not.toBeInTheDocument();
  });
  it('does not offer paused or unknown legacy links, but keeps settings and responses accessible', () => {
    render(<InboundCampaignsPanel sources={[source]} campaigns={[{ ...campaign, status: 'paused' }, { ...campaign, id: 'legacy', name: 'Kampanye lama', target_definition: {} }]} onAction={action} onRefresh={refresh} onSetup={setup} />);
    expect(screen.queryByRole('button', { name: 'Salin tautan' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Lihat respons' })).toHaveLength(2);
    fireEvent.click(screen.getByText('Pengaturan sumber dan kampanye')); fireEvent.click(screen.getByRole('button', { name: 'Buka pengaturan lengkap' })); expect(setup).toHaveBeenCalledOnce();
  });
  it('opens campaign-filtered responses only on demand and permits returning to the registry', async () => {
    render(<InboundCampaignsPanel sources={[source]} campaigns={[campaign]} onAction={action} onRefresh={refresh} onSetup={setup} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lihat respons' })); await screen.findByRole('searchbox', { name: 'Cari perjalanan' });
    expect(screen.getByRole('searchbox', { name: 'Cari perjalanan' })).toHaveValue('inbound-one'); expect(action).toHaveBeenCalledWith('/api/admin/acquisition/attribution', expect.objectContaining({ cache: 'no-store' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke daftar kampanye' })); expect(screen.getByRole('heading', { name: campaign.name })).toBeVisible();
  });
  it('provides a manual copy fallback without changing campaign data', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
    render(<InboundCampaignsPanel sources={[source]} campaigns={[campaign]} onAction={action} onRefresh={refresh} onSetup={setup} />);
    fireEvent.click(screen.getByRole('button', { name: 'Salin tautan' })); expect(await screen.findByRole('status')).toHaveTextContent('Pilih dan salin'); expect(action).not.toHaveBeenCalled();
  });
  it('distinguishes failed response reads from an empty campaign and offers recovery', async () => {
    action.mockRejectedValueOnce(new Error('Koneksi terputus')); render(<InboundAttributionPanel onAction={action} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Koneksi terputus'); expect(screen.queryByText('Pelacakan perjalanan belum tersedia di database.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba muat respons lagi' })); await waitFor(() => expect(screen.getByRole('heading', { name: 'Respons yang masuk dari kampanye' })).toBeVisible());
    expect(screen.getByText(/bukan total sepanjang waktu dan bukan jumlah orang unik/)).toBeVisible();
  });
});
