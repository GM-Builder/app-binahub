'use client';
import { useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';
import type { MeetingChecklist } from '../_lib/spin-meeting';

export function SpinMeetingCreate({ onCreated, onCancel }: { onCreated: (value: MeetingChecklist) => void; onCancel: () => void }) {
  const id = useRef(crypto.randomUUID()), lock = useRef(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [contact, setContact] = useState({ name: '', company: '', email: '' }), [notice, setNotice] = useState(false);
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try {
      const response = await apiFetch('/api/admin/discovery/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id.current, contact, processingNoticeConfirmed: notice }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Checklist belum dibuat. Coba lagi.');
      onCreated(body.checklist);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Checklist belum dibuat.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={event => void create(event)} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <h3 className="text-lg font-semibold text-slate-950">Mulai checklist meeting</h3><p className="mt-2 text-sm leading-6 text-slate-600">Untuk klien yang belum mengisi formulir. Jika sudah mengisi, pilih namanya dari daftar agar jawaban sebelumnya ikut terbuka.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-3">{([['name', 'Nama klien'], ['company', 'Perusahaan / organisasi'], ['email', 'Email klien']] as const).map(([key, label]) => <label key={key} className="space-y-2 text-sm font-medium text-slate-800"><span>{label}</span><input required disabled={busy} type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'company' ? 'organization' : key} maxLength={key === 'company' ? 150 : key === 'name' ? 100 : 254} value={contact[key]} onChange={event => setContact(current => ({ ...current, [key]: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#0B2C6B]" /></label>)}</div>
    <label className="mt-5 flex min-h-11 items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" required disabled={busy} checked={notice} onChange={event => setNotice(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#0B2C6B]" /><span>Klien telah diberi tahu bahwa kontak dan jawaban dicatat oleh tim BinaHub untuk rekomendasi dan tindak lanjut kebutuhan, tanpa penghapusan otomatis. Permintaan koreksi atau penghapusan dapat disampaikan ke admin@binahub.id. Ini bukan izin pemasaran.</span></label>
    {error && <p role="alert" className="mt-3 text-sm leading-6 text-red-700">{error}</p>}
    <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}{busy ? 'Membuka checklist…' : 'Mulai sesi'}</button><button disabled={busy} type="button" onClick={onCancel} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-[#0B2C6B]">Batal</button></div>
  </form>;
}
