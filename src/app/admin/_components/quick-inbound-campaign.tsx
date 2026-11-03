'use client';
import { useEffect, useRef, useState } from 'react';
import { AdminModal } from './shared';
import { INBOUND_CHANNELS, INBOUND_DESTINATIONS, type InboundCampaign } from '../_lib/inbound-campaign';
import type { CampaignSource } from './campaign-source-setup';

export function QuickInboundCampaign({ sources, onAction, onCreated, onClose, onSetup }: {
  sources: CampaignSource[]; onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onCreated: (campaign: InboundCampaign) => Promise<void>; onClose: () => void; onSetup: () => void;
}) {
  const available = sources.filter(source => source.channel === 'inbound' && source.status === 'approved' && source.active);
  const [name, setName] = useState(''), [sourceId, setSourceId] = useState(available[0]?.id || '');
  const [channel, setChannel] = useState('social'), [path, setPath] = useState('/rekomendasi-program'), [owner, setOwner] = useState('');
  const [approved, setApproved] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const code = useRef(`INBOUND-${crypto.randomUUID().toUpperCase()}`), lock = useRef(false), created = useRef<InboundCampaign | null>(null);
  useEffect(() => {
    if (!name.trim() && !busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [name, busy]);
  useEffect(() => {
    let active = true;
    void onAction('/api/admin/session').then(value => {
      const result = value as { admin?: { email?: string } };
      if (active && result.admin?.email) setOwner(current => current || result.admin!.email!);
    }).catch(() => {});
    return () => { active = false; };
  }, [onAction]);
  const save = async () => {
    if (lock.current || !approved) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!created.current) {
        const result = await onAction('/api/admin/acquisition') as { campaigns?: InboundCampaign[] };
        if (!Array.isArray(result.campaigns)) throw new Error('Daftar kampanye belum dapat diperiksa. Coba lagi.');
        const previous = result.campaigns.find(item => item.campaign_code === code.current);
        if (previous) {
          if (previous.name !== name.trim() || previous.source_id !== sourceId) throw new Error('Kampanye sudah tercatat dengan perubahan. Periksa di pengaturan lengkap.');
          created.current = previous;
        } else {
          const selected = INBOUND_CHANNELS.find(item => item.id === channel)!;
          const saved = await onAction('/api/admin/acquisition', { method: 'POST', body: JSON.stringify({ action: 'campaign', payload: {
            sourceId, campaignCode: code.current, name: name.trim(), objective: path === '/insight' ? 'assessment' : 'lead_generation',
            channel: selected.channel, status: 'approved', owner: owner.trim(), currency: 'IDR', humanApproved: true,
            approvalNote: 'Admin menyetujui pembuatan kampanye inbound melalui alur terpandu. Tidak ada email atau iklan dikirim.',
            utmConfig: { source: selected.source, medium: selected.medium, campaign: code.current.toLowerCase() }, targetDefinition: { landingPath: path },
          } }) }) as { campaign?: InboundCampaign };
          if (!saved.campaign?.id) throw new Error('Respons belum lengkap. Coba lagi untuk memeriksa kampanye yang sama.');
          created.current = saved.campaign;
        }
      }
      setSaved(true); await onCreated(created.current); onClose();
    } catch (cause) { setError(created.current ? 'Kampanye sudah tersimpan, tetapi daftar belum diperbarui. Coba buka kembali; jangan membuat kampanye baru.' : cause instanceof Error ? cause.message : 'Kampanye belum dapat disiapkan.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const close = () => { if (!busy && (!name.trim() || window.confirm('Nama kampanye belum selesai diproses. Tetap tutup?'))) onClose(); };
  const field = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-normal sm:text-sm';
  return <AdminModal title="Buat kampanye inbound" maxWidth="max-w-xl" onClose={close}>
    {!available.length ? <div className="space-y-4"><p className="text-sm leading-6 text-slate-600">Sumber inbound perlu disetujui terlebih dahulu. Pengaturan ini dilakukan sekali; setelah itu admin cukup memilih sumber yang tersedia.</p><button type="button" onClick={() => { onClose(); onSetup(); }} className="min-h-11 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white">Siapkan sumber inbound</button></div> : <form className="space-y-5" onSubmit={event => { event.preventDefault(); void save(); }}>
      <p className="text-sm leading-6 text-slate-600">Buat tautan dengan pelacakan otomatis untuk dibagikan melalui kanal pilihan Anda. Form ini tidak mengirim email atau memasang iklan.</p>
      <fieldset disabled={busy || saved} className="space-y-4">
        <label className="block text-sm font-semibold">Nama kampanye<input required minLength={3} maxLength={200} className={field} value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Pengembangan manajer · November" /></label>
        <label className="block text-sm font-semibold">Dibagikan melalui<select className={field} value={channel} onChange={e => setChannel(e.target.value)}>{INBOUND_CHANNELS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="block text-sm font-semibold">Halaman tujuan<select className={field} value={path} onChange={e => setPath(e.target.value)}>{INBOUND_DESTINATIONS.map(item => <option key={item.path} value={item.path}>{item.label}</option>)}</select></label>
        <label className="block text-sm font-semibold">Sumber yang disetujui<select className={field} value={sourceId} onChange={e => setSourceId(e.target.value)}>{available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Penanggung jawab<input required type="email" maxLength={320} className={field} value={owner} onChange={e => setOwner(e.target.value)} /></label>
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-[#0B2C6B]" />Saya menyetujui penggunaan kampanye ini dengan sumber dan tujuan yang dipilih.</label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
      <button type="submit" disabled={busy || !approved} className="min-h-11 w-full rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Menyiapkan…' : saved ? 'Coba buka kampanye' : 'Buat tautan kampanye'}</button>
    </form>}
  </AdminModal>;
}
