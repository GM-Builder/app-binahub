'use client';

import { useId } from 'react';
import { Search } from 'lucide-react';

export type SpinInboxRow = {
  id: string;
  status: string;
  contact: { name: string; company: string; email: string };
  submitted_at: string;
  error_code?: string;
  has_source?: boolean;
  meeting_status?: string | null;
};

const statusLabels: Record<string, string> = {
  draft: 'Draf', queued: 'Dalam antrean', processing: 'Menyusun laporan',
  ready: 'Laporan tersedia', failed: 'Perlu penanganan',
};

export function SpinInbox({ rows, total, page, search, loading, error, selected, meetingReady, onSearch, onPage, onOpen, onRetry }: {
  rows: SpinInboxRow[]; total: number; page: number; search: string;
  loading: boolean; error: string; selected: string; meetingReady: boolean;
  onSearch: (value: string) => void; onPage: (value: number) => void;
  onOpen: (row: SpinInboxRow) => void; onRetry: () => void;
}) {
  const id = useId();
  const pages = Math.max(1, Math.ceil(total / 20));
  const from = total ? page * 20 + 1 : 0;
  const to = Math.min((page + 1) * 20, total);
  const actionClass = 'min-h-11 rounded-lg px-2 text-sm font-semibold text-[#0B2C6B] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B] disabled:opacity-40';

  return <section aria-label="Daftar kebutuhan program" className="min-w-0 rounded-2xl border border-slate-200 bg-white">
    <div className="border-b border-slate-200 p-4">
      <label htmlFor={id} className="text-sm font-semibold text-slate-950">Cari kebutuhan klien</label>
      <div className="mt-2 flex items-center gap-2">
        <Search size={16} aria-hidden="true" className="shrink-0 text-slate-600" />
        <input id={id} type="search" maxLength={150} placeholder="Nama, perusahaan, email" value={search} onChange={(event) => onSearch(event.target.value)}
          className="min-h-11 w-full min-w-0 rounded-lg bg-slate-50 px-3 text-base text-slate-950 placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B] sm:text-sm" />
      </div>
      <p className="mt-2 text-sm text-slate-600" role="status" aria-live="polite">
        {loading ? 'Memuat daftar…' : error ? 'Daftar belum dapat dimuat.' : `${total.toLocaleString('id-ID')} ${search.trim() ? 'hasil pencarian' : meetingReady ? 'pengisian dan checklist' : 'pengisian klien'}`}
      </p>
    </div>
    <div aria-busy={loading}>
      {loading ? <p className="p-5 text-sm leading-6 text-slate-600">Mencari pada seluruh pengisian, bukan hanya halaman ini.</p> : error ?
        <div className="p-5"><p role="alert" className="text-sm leading-6 text-red-700">{error}</p><button type="button" onClick={onRetry} className={actionClass + ' mt-2 underline underline-offset-4'}>Coba muat lagi</button></div> : rows.length ?
          <ul className="max-h-[min(60svh,640px)] divide-y divide-slate-100 overflow-y-auto overscroll-contain">{rows.map((row) => <li key={row.id}>
            <button type="button" onClick={() => onOpen(row)} aria-pressed={selected === row.id}
              className={'w-full p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B2C6B] ' + (selected === row.id ? 'bg-blue-50/70' : '')}>
              <p className="break-words text-base font-semibold text-slate-950 sm:text-sm">{row.contact.company}</p>
              <p className="mt-1 break-words text-sm leading-6 text-slate-600">{row.contact.name} · {row.contact.email}</p>
              <p className="mt-2 text-sm font-semibold text-[#0B2C6B]">{row.meeting_status === 'completed' ? 'Meeting selesai' : row.meeting_status === 'in_progress' ? 'Checklist sedang dilengkapi' : 'Siap untuk konsultasi'}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{row.has_source === false ? 'Checklist oleh admin' : statusLabels[row.status] || row.status} · {new Date(row.submitted_at).toLocaleDateString('id-ID')}</p>
            </button>
          </li>)}</ul> : <div className="p-5">
            <h3 className="text-base font-semibold text-slate-950">{search.trim() ? 'Tidak ada kebutuhan yang cocok' : 'Belum ada pengisian'}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{search.trim() ? 'Coba nama, perusahaan, atau email lain. Pencarian mencakup seluruh halaman.' : 'Bagikan formulir atau mulai checklist saat meeting. Draf klien yang belum dikirim tidak ditampilkan.'}</p>
            {search.trim() && <button type="button" onClick={() => onSearch('')} className={actionClass + ' mt-2 underline underline-offset-4'}>Hapus pencarian</button>}
          </div>}
    </div>
    <nav aria-label="Halaman kebutuhan program" className="border-t border-slate-200 p-3">
      <p className="mb-1 text-center text-sm tabular-nums text-slate-600">{loading || error ? '—' : `${from}–${to} dari ${total.toLocaleString('id-ID')}`}</p>
      <div className="flex items-center justify-between gap-1">
        <button type="button" disabled={page === 0 || loading || Boolean(error)} onClick={() => onPage(page - 1)} className={actionClass}>Sebelumnya</button>
        <span aria-label={loading ? 'Memuat halaman' : error ? 'Halaman belum tersedia' : `Halaman ${page + 1} dari ${pages}`} className="shrink-0 text-sm tabular-nums text-slate-600">{loading || error ? '…' : `${page + 1} / ${pages}`}</span>
        <button type="button" disabled={page + 1 >= pages || loading || Boolean(error)} onClick={() => onPage(page + 1)} className={actionClass}>Berikutnya</button>
      </div>
    </nav>
  </section>;
}
