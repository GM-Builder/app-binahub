'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { AdminSelect } from './shared';
import { useCampaignArchive, type ArchiveAction, type ArchiveKind, type ArchiveRecord } from '../_lib/use-campaign-archive';

const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0B2C6B] transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B] disabled:cursor-not-allowed disabled:opacity-50 [&[aria-pressed=true]]:border-[#0B2C6B] [&[aria-pressed=true]]:bg-blue-50';
const names: Record<string, string> = { campaigns: 'Kampanye', prospects: 'Daftar penerima', deliveries: 'Pengiriman email', batches: 'Riwayat impor', events: 'Aktivitas admin', journeys: 'Kunjungan inbound', journey_events: 'Aktivitas kunjungan',
  draft: 'Draf', approved: 'Disetujui', active: 'Aktif', paused: 'Dijeda', completed: 'Selesai', cancelled: 'Dibatalkan', valid: 'Valid', invalid: 'Tidak valid', duplicate: 'Ganda', suppressed: 'Jangan dihubungi', excluded: 'Dikecualikan', pending: 'Menunggu validasi',
  queued: 'Dalam antrean', processing: 'Sedang diproses', sent: 'Diterima penyedia email', blocked: 'Tidak dikirim', uncertain: 'Perlu diperiksa', staged: 'Menunggu tinjauan', rejected: 'Ditolak', failed: 'Gagal',
  browsing: 'Menjelajah', converted: 'Form terkirim', inbound: 'Inbound', outbound: 'Outbound', partner: 'Mitra', offline: 'Offline',
  unknown: 'Belum tercatat', opted_in: 'Mengizinkan', opted_out: 'Menolak', not_required: 'Tidak disyaratkan',
  landing_view: 'Membuka website', catalog_view: 'Melihat katalog', catalog_module_selected: 'Memilih modul', inquiry_started: 'Mulai inquiry', inquiry_submitted: 'Inquiry terkirim', assessment_started: 'Mulai diagnosis', assessment_submitted: 'Diagnosis terkirim', lead_linked: 'Terhubung ke kontak' };
const label = (value: string) => names[value] || value.replaceAll('_', ' ');
const number = (value: number) => value.toLocaleString('id-ID');
function date(value: string | null | undefined) {
  const parsed = value ? new Date(value) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(parsed) + ' WIB' : 'Waktu belum tercatat';
}

function ArchiveList({ kind, campaignId, journeyId, onAction, onSelect }: { kind: ArchiveKind; campaignId?: string; journeyId?: string; onAction: ArchiveAction; onSelect?: (row: ArchiveRecord) => void }) {
  const [search, setSearch] = useState(''), [status, setStatus] = useState(''), [channel, setChannel] = useState('');
  const archive = useCampaignArchive(onAction, { kind, campaignId, journeyId, search, status, channel });
  const { data, page } = archive;
  const filtered = !!(search || status || channel);
  return <section aria-label={names[kind]} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{names[kind]}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{kind === 'campaigns' ? 'Termasuk draf, kampanye selesai, serta sumber yang dijeda. Cari berdasarkan nama, kode, sumber, atau penanggung jawab.' : 'Pencarian dan status diterapkan ke seluruh riwayat kampanye ini, bukan hanya data terbaru.'}</p></div><button type="button" className={button} onClick={archive.refresh} disabled={archive.loading}><RefreshCw size={15} aria-hidden="true" />Perbarui arsip</button></header>
    <div className={`mt-5 grid grid-cols-2 gap-3 [&_select]:mt-2 [&_select]:h-11 [&_select]:text-base ${kind === 'campaigns' ? 'lg:grid-cols-[minmax(0,1fr)_180px_180px]' : 'sm:grid-cols-[minmax(0,1fr)_200px]'}`}>
      <label className={`block text-sm font-medium text-slate-700 ${kind === 'campaigns' ? 'col-span-2 lg:col-span-1' : 'col-span-2 sm:col-span-1'}`}>Cari {names[kind].toLowerCase()}<input type="search" maxLength={150} value={search} onChange={e => setSearch(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/20" /></label>
      <label className="block text-sm font-medium text-slate-700">Status<AdminSelect ariaLabel={`Status ${names[kind].toLowerCase()}`} value={status} onChange={setStatus} options={[["", "Semua status"], ...Array.from(new Set([...Object.keys(data?.statusCounts || {}), ...(status ? [status] : [])])).sort().map(value => [value, label(value)] as [string, string])]} /></label>
      {kind === 'campaigns' && <label className="block text-sm font-medium text-slate-700">Asal kampanye<AdminSelect ariaLabel="Asal kampanye" value={channel} onChange={setChannel} options={[["", "Semua asal"], ["inbound", "Inbound"], ["outbound", "Outbound"], ["partner", "Mitra"], ["offline", "Offline"]]} /></label>}
    </div>
    {archive.loading ? <p role="status" className="py-10 text-sm text-slate-600">Memuat {names[kind].toLowerCase()}…</p> : archive.error ? <div role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p>{archive.error}</p><p>Data belum tersedia, bukan berarti kosong.</p><button type="button" className={`${button} mt-3`} onClick={archive.refresh}>Coba muat arsip lagi</button></div> : data && <>
      <div role="status" className="mt-5 flex flex-wrap justify-between gap-2 text-sm text-slate-600"><p>{number(data.total)} catatan cocok{data.total > 0 ? ` · ${number(page * 20 + 1)}–${number(page * 20 + data.records.length)} ditampilkan` : ''}</p><p>Seluruh lingkup ini: <span className="font-semibold tabular-nums text-slate-900">{number(data.all)}</span></p></div>
      <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">{data.records.map(row => <article key={row.id} className="grid min-w-0 gap-3 py-5 md:grid-cols-[minmax(0,1fr)_180px_180px] md:items-start">
        <div className="min-w-0"><h4 className="break-words text-base font-semibold">{kind === 'events' || kind === 'journey_events' ? label(row.title) : row.title}</h4><p className="mt-1 break-all text-sm text-slate-600">{row.subtitle}</p><p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600">{row.context}</p>
          {kind === 'campaigns' && <p className="mt-2 break-all text-sm text-slate-600">{label(row.sourceChannel || '')} · {row.channel} · {row.owner}</p>}
          {kind === 'prospects' && <p className="mt-2 text-sm text-slate-600">Izin tercatat: {label(row.consentStatus || 'unknown')}. Bukan persetujuan kirim baru.</p>}
          {kind === 'deliveries' && <p className="mt-2 text-sm text-slate-600">{row.kind === 'test' ? 'Email uji' : 'Email awal'} · {row.locale === 'en' ? 'English' : 'Indonesia'}</p>}
          {kind === 'batches' && <p className="mt-2 text-sm leading-6 text-slate-600">{number(row.totalRows || 0)} baris · {number(row.validRows || 0)} valid · {number(row.invalidRows || 0)} tidak valid · {number(row.duplicateRows || 0)} ganda · {number(row.suppressedRows || 0)} tersaring</p>}
          {kind === 'journeys' && <p className="mt-2 break-all text-sm leading-6 text-slate-600">Terakhir: {row.lastPath || '/'} · {row.linked ? 'Tertaut ke kontak' : 'Belum tertaut ke kontak'}</p>}
        </div><p className="text-sm font-medium text-slate-700">{label(row.status)}</p><div className="space-y-3"><p className="text-sm text-slate-600">{date(row.occurredAt)}</p>{onSelect && <button type="button" className={button} onClick={() => onSelect(row)}>{kind === 'campaigns' ? 'Buka riwayat' : 'Lihat aktivitas'}<ArrowRight size={14} aria-hidden="true" /></button>}</div>
      </article>)}</div>
      {!data.records.length && <div className="py-10"><h4 className="text-base font-semibold">{filtered ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan pada lingkup ini'}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{filtered ? 'Ubah pencarian atau status. Filter tidak menghapus riwayat.' : 'Membuka arsip tidak membuat data baru atau memproses pengiriman.'}</p></div>}
      <nav aria-label={`Halaman ${names[kind].toLowerCase()}`} className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" className={button} disabled={page === 0} onClick={() => archive.setPage(page - 1)}>Sebelumnya</button><p className="text-sm tabular-nums text-slate-600">Halaman {number(page + 1)} dari {number(Math.max(1, Math.ceil(data.total / 20)))}</p><button type="button" className={button} disabled={(page + 1) * 20 >= data.total || page >= 10000} onClick={() => archive.setPage(page + 1)}>Berikutnya</button></nav>
      {data.total > 200020 && <p className="mt-3 text-sm text-slate-600">Persempit pencarian untuk menemukan catatan di luar batas 10.001 halaman.</p>}
      <p className="mt-4 text-xs leading-5 text-slate-600">Jumlah seluruh lingkup dihitung sebelum filter. Dibaca {date(data.snapshotAt)}. Riwayat dapat berubah jika admin lain memperbarui data.</p>
    </>}
  </section>;
}

function CampaignHistory({ campaign, onAction, onBack }: { campaign: ArchiveRecord; onAction: ArchiveAction; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const [kind, setKind] = useState<ArchiveKind>(campaign.sourceChannel === 'inbound' ? 'journeys' : 'deliveries');
  const [journey, setJourney] = useState<ArchiveRecord | null>(null);
  const kinds: ArchiveKind[] = campaign.sourceChannel === 'inbound' ? ['journeys', 'events'] : ['deliveries', 'prospects', 'batches', 'events', 'journeys'];
  return <div className="space-y-5"><button type="button" className={button} onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Kembali ke daftar arsip</button>
    <header className="border-b border-slate-200 pb-5"><h2 ref={heading} tabIndex={-1} className="break-words text-xl font-semibold">{campaign.title}</h2><p className="mt-2 break-all text-sm text-slate-600">{campaign.subtitle} · {label(campaign.status)} · {campaign.owner}</p><p className="mt-2 text-sm leading-6 text-slate-600">{campaign.context}. Ini riwayat baca; pengaturan dan pengiriman tetap dilakukan melalui halaman kampanye.</p></header>
    <nav aria-label="Jenis riwayat kampanye" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">{kinds.map(value => <button type="button" key={value} className={button} aria-pressed={kind === value} onClick={() => { setKind(value); setJourney(null); }}>{names[value]}</button>)}</nav>
    {kind === 'deliveries' && <p className="max-w-3xl text-sm leading-6 text-slate-600">“Diterima penyedia email” bukan bukti masuk inbox. Email uji dan email awal diberi label terpisah. Status perlu diperiksa tidak otomatis dikirim ulang.</p>}
    {(kind === 'journeys' || journey) && <p className="max-w-3xl text-sm leading-6 text-slate-600">Kunjungan dicocokkan dengan UTM pertama yang tercatat, bukan kunjungan terakhir. UTM yang dipakai ulang dapat cocok dengan beberapa kampanye. Ini bukan jumlah orang unik atau bukti bahwa kampanye menyebabkan respons.</p>}
    {journey ? <><button type="button" className={button} onClick={() => setJourney(null)}><ArrowLeft size={15} aria-hidden="true" />Kembali ke kunjungan</button><ArchiveList key={journey.id} kind="journey_events" campaignId={campaign.id} journeyId={journey.id} onAction={onAction} /></> : <ArchiveList key={kind} kind={kind} campaignId={campaign.id} onAction={onAction} onSelect={kind === 'journeys' ? setJourney : undefined} />}
  </div>;
}

export function CampaignArchivePanel({ onAction, onBack }: { onAction: ArchiveAction; onBack: () => void }) {
  const [selected, setSelected] = useState<ArchiveRecord | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  return <section className="space-y-5" aria-label="Arsip kampanye"><div hidden={!!selected} className="space-y-5"><button type="button" className={button} onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />Kembali ke kampanye</button><header><h2 ref={heading} tabIndex={-1} className="text-xl font-semibold">Arsip kampanye</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Temukan kampanye dan riwayat lama. Arsip ini hanya untuk dibaca; tidak memproses pengiriman atau mengubah data.</p></header><ArchiveList kind="campaigns" onAction={onAction} onSelect={setSelected} /></div>{selected && <CampaignHistory key={selected.id} campaign={selected} onAction={onAction} onBack={() => { setSelected(null); requestAnimationFrame(() => heading.current?.focus()); }} />}</section>;
}
