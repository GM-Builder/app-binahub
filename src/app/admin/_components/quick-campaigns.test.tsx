import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickEmailCampaign } from './quick-email-campaign';
import { CampaignSourceSetup } from './campaign-source-setup';
import { QuickInboundCampaign } from './quick-inbound-campaign';
const source = { id: '00000000-0000-4000-8000-000000000001', name: 'Kontak yang disetujui', channel: 'outbound', status: 'approved', active: true };
const mocks = { action: vi.fn(), created: vi.fn(), close: vi.fn(), advanced: vi.fn(), busy: vi.fn() };
const bodies = () => mocks.action.mock.calls.filter(call => call[1]?.body).map(call => JSON.parse(String(call[1].body)));
beforeEach(() => { for (const mock of Object.values(mocks)) mock.mockReset(); mocks.created.mockResolvedValue(undefined); });
describe('guided campaign setup, no real writes', () => {
  it('creates an email campaign with two fields and no send or settings mutation', async () => {
    mocks.action.mockResolvedValue({ campaign: { id: 'created' } });
    render(<QuickEmailCampaign sources={[source]} onAction={mocks.action} onCreated={mocks.created} onClose={mocks.close} onAdvanced={mocks.advanced} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nama kampanye' }), { target: { value: 'Pengembangan tim' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buat kampanye' })); await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
    expect(bodies()).toEqual([expect.objectContaining({ action: 'quick_email_campaign', payload: expect.objectContaining({ sourceId: source.id, name: 'Pengembangan tim', confirmation: 'CREATE_EMAIL_CAMPAIGN' }) })]);
  });
  it('retries opening a saved campaign without repeating POST when refresh failed', async () => {
    mocks.action.mockResolvedValue({ campaign: { id: 'created' } }); mocks.created.mockRejectedValueOnce(new Error('refresh failed'));
    render(<QuickEmailCampaign sources={[source]} onAction={mocks.action} onCreated={mocks.created} onClose={mocks.close} onAdvanced={mocks.advanced} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nama kampanye' }), { target: { value: 'Pengembangan tim' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buat kampanye' })); await screen.findByRole('alert');
    expect(screen.getByRole('textbox', { name: 'Nama kampanye' })).toBeDisabled(); fireEvent.click(screen.getByRole('button', { name: 'Coba buka kampanye' }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce()); expect(bodies()).toHaveLength(1);
  });
  it('keeps creation open when the user cancels leaving and does not need advanced menus for a new source', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<QuickEmailCampaign sources={[]} onAction={mocks.action} onCreated={mocks.created} onClose={mocks.close} onAdvanced={mocks.advanced} />);
    fireEvent.click(screen.getByRole('button', { name: 'Siapkan sumber data' })); fireEvent.change(screen.getByRole('textbox', { name: 'Nama daftar' }), { target: { value: 'Daftar acara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tutup modal' })); expect(mocks.close).not.toHaveBeenCalled(); expect(mocks.advanced).not.toHaveBeenCalled(); confirm.mockRestore();
  });
  it('records explicit source governance with no assumed consent or retention, and recovers an existing source on retry', async () => {
    mocks.action.mockResolvedValueOnce({ sources: [] }).mockResolvedValueOnce({ source });
    render(<CampaignSourceSetup onAction={mocks.action} onReady={mocks.created} onBusy={mocks.busy} onDirty={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(null); expect(screen.getByRole('checkbox')).not.toBeChecked();
    const fields: [string, string][] = [['Nama daftar', source.name], ['Bagaimana daftar diperoleh?', 'Daftar acara dengan persetujuan'], ['Tautan pemberitahuan privasi', 'https://company.invalid/privacy'], ['Email pemilik data', 'owner@company.invalid'], ['Email penanggung jawab legal', 'legal@company.invalid'], ['Catatan pemeriksaan', 'Sumber telah ditinjau penanggung jawab.']];
    for (const [name, value] of fields) fireEvent.change(screen.getByRole('textbox', { name }), { target: { value } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'consent' } }); fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Setujui sumber & lanjut' }));
    await waitFor(() => expect(mocks.created).toHaveBeenCalledWith(source)); expect(bodies()[0]).toMatchObject({ action: 'source', payload: { channel: 'outbound', lawfulBasis: 'consent', retentionDays: 30, humanApproved: true, active: true, status: 'approved' } });
    expect(bodies()).toHaveLength(1);
  });
  it('creates an inbound tracked campaign through the existing campaign action with explicit approval, not email sending', async () => {
    const campaign = { id: 'inbound-created' };
    mocks.action.mockImplementation(async (url: string, init?: RequestInit) => url === '/api/admin/session' ? { admin: { email: 'admin@company.invalid' } } : init?.method ? { campaign } : { campaigns: [] });
    render(<QuickInboundCampaign sources={[{ ...source, channel: 'inbound' }]} onAction={mocks.action} onCreated={mocks.created} onClose={mocks.close} onSetup={mocks.advanced} />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Penanggung jawab' })).toHaveValue('admin@company.invalid'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nama kampanye' }), { target: { value: 'Kampanye organisasi' } });
    expect(screen.getByRole('button', { name: 'Buat tautan kampanye' })).toBeDisabled(); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Buat tautan kampanye' }));
    await waitFor(() => expect(mocks.created).toHaveBeenCalledWith(campaign)); expect(bodies()).toEqual([expect.objectContaining({ action: 'campaign', payload: expect.objectContaining({ channel: 'organic', owner: 'admin@company.invalid', status: 'approved', humanApproved: true, targetDefinition: { landingPath: '/rekomendasi-program' } }) })]);
  });
  it('keeps inbound saved-state recovery separate from creation when listing fails', async () => {
    mocks.created.mockRejectedValueOnce(new Error('refresh'));
    mocks.action.mockImplementation(async (url: string, init?: RequestInit) => url === '/api/admin/session' ? { admin: { email: 'admin@company.invalid' } } : init?.method ? { campaign: { id: 'created' } } : { campaigns: [] });
    render(<QuickInboundCampaign sources={[{ ...source, channel: 'inbound' }]} onAction={mocks.action} onCreated={mocks.created} onClose={mocks.close} onSetup={mocks.advanced} />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Penanggung jawab' })).toHaveValue('admin@company.invalid'));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nama kampanye' }), { target: { value: 'Kampanye organisasi' } }); fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Buat tautan kampanye' })); await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', { name: 'Coba buka kampanye' }));
    await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce()); expect(bodies()).toHaveLength(1);
  });
});
