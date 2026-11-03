'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Plus } from 'lucide-react';
import { AdminSearch, AdminSelect } from './shared';
import { InboundAttributionPanel } from './inbound-attribution-panel';
import { QuickInboundCampaign } from './quick-inbound-campaign';
import { inboundCampaignLink, type InboundCampaign } from '../_lib/inbound-campaign';
import type { CampaignSource } from './campaign-source-setup';
const statuses: Record<string, string> = { draft: 'Draf', approved: 'Siap dibagikan', active: 'Aktif', paused: 'Dijeda', completed: 'Selesai', cancelled: 'Dibatalkan' };
export function InboundCampaignsPanel({ sources, campaigns, onAction, onRefresh, onSetup }: {
  sources: CampaignSource[]; campaigns: InboundCampaign[]; onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onRefresh: () => Promise<void>; onSetup: () => void;
}) {
  const [creating, setCreating] = useState(false), [query, setQuery] = useState(''), [status, setStatus] = useState('all');
  const [responseCampaign, setResponseCampaign] = useState<string | null>(null), [copyNotice, setCopyNotice] = useState('');
  const [created, setCreated] = useState<InboundCampaign | null>(null);
  const [refreshing, setRefreshing] = useState(false), [refreshError, setRefreshError] = useState('');
  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true); setRefreshError('');
    try { await onRefresh(); } catch { setRefreshError('Daftar kampanye belum berhasil diperbarui. Data sebelumnya masih ditampilkan; coba lagi.'); }
    finally { setRefreshing(false); }
  };
  const records = [...campaigns, ...(created && !campaigns.some(item => item.id === created.id) ? [created] : [])]
    .filter(item => sources.some(source => source.id === item.source_id && source.channel === 'inbound'));
  const filtered = records.filter(item => (status === 'all' || item.status === status) && `${item.name} ${item.owner} ${item.campaign_code}`.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID')));
  const copy = async (link: string) => {
    try { await navigator.clipboard.writeText(link); setCopyNotice('Tautan disalin. Tempel di kanal kampanye Anda.'); }
    catch { setCopyNotice('Tautan belum dapat disalin otomatis. Pilih dan salin dari kolom tautan.'); }
  };
  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-[#0B2C6B]';
  return <section className="space-y-5" aria-label="Kampanye inbound">
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="max-w-2xl"><h2 className="text-xl font-semibold">Kampanye inbound</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bagikan tautan kampanye, lalu lihat respons yang masuk. Tidak ada email atau iklan dikirim dari halaman ini.</p></div><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white" onClick={() => setCreating(true)}><Plus size={15} aria-hidden="true" />Buat kampanye</button></header>
    <nav aria-label="Tampilan inbound" className="flex flex-wrap gap-2"><button type="button" className={button} aria-pressed={responseCampaign === null} onClick={() => setResponseCampaign(null)}>Daftar kampanye</button><button type="button" className={button} aria-pressed={responseCampaign !== null} onClick={() => setResponseCampaign('')}>Respons masuk</button>{responseCampaign === null && <button type="button" disabled={refreshing} className={`${button} disabled:opacity-50 sm:ml-auto`} onClick={() => void refresh()}>{refreshing ? 'Memperbarui…' : 'Perbarui daftar'}</button>}</nav>
    {refreshError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{refreshError}</p>}
    {responseCampaign === null ? <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Daftar kampanye inbound">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]"><AdminSearch placeholder="Cari kampanye atau penanggung jawab" value={query} onChange={setQuery} /><AdminSelect ariaLabel="Status kampanye inbound" value={status} onChange={setStatus} options={[["all", "Semua status"], ...Object.entries(statuses)]} /></div>
      {copyNotice && <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-[#0B2C6B]">{copyNotice}</p>}
      <div className="mt-4 divide-y divide-slate-200">{filtered.map(item => {
        const link = inboundCampaignLink(item), shareable = ['approved', 'active'].includes(item.status) && sources.some(source => source.id === item.source_id && source.status === 'approved' && source.active);
        return <article key={item.id} className="space-y-3 py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-base font-semibold">{item.name}</h3><p className="mt-1 break-all text-xs text-slate-600">Penanggung jawab: {item.owner}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{statuses[item.status] || item.status}</span></div>
          {link && shareable ? <label className="block text-xs font-semibold text-slate-600">Tautan kampanye<input readOnly aria-label={`Tautan ${item.name}`} value={link} onFocus={event => event.target.select()} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-normal sm:text-sm" /></label> : <p className="text-xs leading-5 text-slate-600">{!shareable ? 'Kampanye ini belum siap dibagikan atau sudah tidak aktif.' : 'Tujuan tautan kampanye lama belum tercatat dalam format terpandu. Pengaturan lengkapnya tetap tersedia.'}</p>}
          <div className="flex flex-wrap gap-3">{link && shareable && <button type="button" className={button} onClick={() => void copy(link)}><Copy size={14} aria-hidden="true" />Salin tautan</button>}<button type="button" className={button} onClick={() => setResponseCampaign(typeof item.utm_config.campaign === 'string' ? item.utm_config.campaign : item.campaign_code.toLowerCase())}>Lihat respons <ArrowRight size={14} aria-hidden="true" /></button></div>
        </article>;
      })}</div>
      {!filtered.length && <div className="py-10 text-center"><h3 className="text-sm font-semibold">{query || status !== 'all' ? 'Tidak ada kampanye yang cocok' : 'Belum ada kampanye inbound'}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{query || status !== 'all' ? 'Ubah pencarian atau status untuk melihat kampanye lain.' : 'Mulai dari Buat kampanye. Nama, kanal, dan tujuan tautan disiapkan dalam satu alur.'}</p></div>}
      <p className="mt-4 text-xs leading-5 text-slate-600">{records.length} kampanye dimuat. Aktivitas kunjungan dan formulir dilihat melalui Respons masuk; angka di sana adalah sampel data terbaru.</p>
    </section> : <><button type="button" className={button} onClick={() => setResponseCampaign(null)}><ArrowLeft size={14} aria-hidden="true" />Kembali ke daftar kampanye</button><InboundAttributionPanel key={responseCampaign} initialCampaign={responseCampaign} onAction={onAction} /></>}
    <details className="rounded-xl border border-slate-200 bg-white px-5 py-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Pengaturan sumber dan kampanye</summary><p className="mt-3 text-xs leading-5 text-slate-600">Sumber data, periode, anggaran, dan status kampanye lama tetap dapat dikelola di pengaturan lengkap.</p><button type="button" className={`${button} mt-3`} onClick={onSetup}>Buka pengaturan lengkap</button></details>
    {creating && <QuickInboundCampaign sources={sources} onAction={onAction} onCreated={async campaign => { setCreated(campaign); await onRefresh(); setResponseCampaign(null); }} onClose={() => setCreating(false)} onSetup={onSetup} />}
  </section>;
}
