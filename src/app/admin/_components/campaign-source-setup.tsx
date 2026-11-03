'use client';
import { useRef, useState } from 'react';

export type CampaignSource = { id: string; name: string; channel: string; status: string; active: boolean };
export function CampaignSourceSetup({ onAction, onReady, onBusy, onDirty }: {
  onAction: (url: string, init?: RequestInit) => Promise<unknown>;
  onReady: (source: CampaignSource) => void; onBusy: (busy: boolean) => void; onDirty: () => void;
}) {
  const [form, setForm] = useState({ name: '', method: '', basis: '', days: '', owner: '', legal: '', privacy: '', note: '', approved: false });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const key = useRef(`manual_${crypto.randomUUID().replaceAll('-', '')}`), lock = useRef(false);
  const set = (field: keyof typeof form, value: string | boolean) => { onDirty(); setForm(current => ({ ...current, [field]: value })); };
  const save = async () => {
    if (lock.current || !form.approved) return;
    lock.current = true; setBusy(true); onBusy(true); setError('');
    try {
      // Recover a response lost after save without creating another source or changing it.
      const existing = await onAction('/api/admin/acquisition') as { sources?: (CampaignSource & { source_key: string })[] };
      if (!Array.isArray(existing.sources)) throw new Error('Asal daftar belum dapat diperiksa. Coba lagi sebelum menyimpan.');
      const previous = existing.sources?.find(source => source.source_key === key.current);
      if (previous) {
        if (previous.name !== form.name.trim() || previous.status !== 'approved' || !previous.active) throw new Error('Sumber sudah tercatat dengan perubahan. Periksa melalui pengaturan sumber sebelum melanjutkan.');
        onReady(previous); return;
      }
      const result = await onAction('/api/admin/acquisition', { method: 'POST', body: JSON.stringify({ action: 'source', payload: {
        sourceKey: key.current, name: form.name.trim(), providerType: 'manual_upload', channel: 'outbound', acquisitionMethod: form.method.trim(),
        lawfulBasis: form.basis, privacyNoticeUrl: form.privacy.trim(), retentionDays: Number(form.days), dataOwner: form.owner.trim(),
        legalOwner: form.legal.trim(), status: 'approved', active: true, humanApproved: true, approvalNote: form.note.trim(), config: {},
      } }) }) as { source?: CampaignSource };
      if (!result.source?.id) throw new Error('Respons penyimpanan belum lengkap. Coba lagi untuk memeriksa sumber yang sama.');
      onReady(result.source);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sumber belum dapat disiapkan. Isian Anda tetap tersedia.'); }
    finally { lock.current = false; setBusy(false); onBusy(false); }
  };
  const input = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base font-normal sm:text-sm';
  return <form className="space-y-5" onSubmit={event => { event.preventDefault(); void save(); }}>
    <p className="text-sm leading-6 text-slate-600">Catat asal dan aturan penggunaan daftar ini sekali. Setelah disetujui, admin lain dapat memilihnya lagi tanpa mengisi ulang. Menyiapkan sumber tidak mengirim email.</p>
    <fieldset disabled={busy} className="space-y-4"><legend className="text-sm font-semibold">Asal daftar</legend>
      <label className="block text-sm font-medium">Nama daftar<input required minLength={2} maxLength={200} className={input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Contoh: Kontak acara HR November" /></label>
      <label className="block text-sm font-medium">Bagaimana daftar diperoleh?<input required minLength={3} maxLength={500} className={input} value={form.method} onChange={e => set('method', e.target.value)} placeholder="Jelaskan asalnya agar admin lain memahami konteksnya" /></label>
      <label className="block text-sm font-medium">Dasar penggunaan yang telah ditetapkan<select required className={input} value={form.basis} onChange={e => set('basis', e.target.value)}><option value="">Pilih sesuai kebijakan organisasi</option><option value="consent">Persetujuan penerima</option><option value="legitimate_interest">Kepentingan sah yang telah ditinjau</option><option value="contract">Pelaksanaan kontrak</option><option value="legal_obligation">Kewajiban hukum</option><option value="public_task">Tugas publik</option><option value="not_applicable">Tidak berlaku sesuai tinjauan penanggung jawab</option></select></label>
      <label className="block text-sm font-medium">Tautan pemberitahuan privasi<input required type="url" maxLength={2000} className={input} value={form.privacy} onChange={e => set('privacy', e.target.value)} placeholder="https://…" /></label>
      <label className="block text-sm font-medium">Masa simpan yang disetujui (hari)<input required type="number" min={1} max={3650} step={1} className={input} value={form.days} onChange={e => set('days', e.target.value)} aria-describedby="source-retention-help" /><span id="source-retention-help" className="mt-2 block text-xs font-normal leading-5 text-slate-600">Gunakan kebijakan organisasi, bukan perkiraan. Sistem tidak memilih masa simpan untuk Anda.</span></label>
    </fieldset>
    <fieldset disabled={busy} className="space-y-4 border-t border-slate-200 pt-4"><legend className="text-sm font-semibold">Penanggung jawab dan persetujuan</legend>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Email pemilik data<input required type="email" maxLength={320} className={input} value={form.owner} onChange={e => set('owner', e.target.value)} /></label><label className="block text-sm font-medium">Email penanggung jawab legal<input required type="email" maxLength={320} className={input} value={form.legal} onChange={e => set('legal', e.target.value)} /></label></div>
      <label className="block text-sm font-medium">Catatan pemeriksaan<textarea required minLength={5} maxLength={2000} className={`${input} min-h-24`} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Catat dasar persetujuan penggunaan daftar ini" /></label>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" required checked={form.approved} onChange={e => set('approved', e.target.checked)} className="mt-1.5 h-4 w-4 shrink-0 accent-[#0B2C6B]" />Saya berwenang menyetujui sumber ini. Asal data, dasar penggunaan, masa simpan, dan penanggung jawab di atas sudah benar.</label>
    </fieldset>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <button type="submit" disabled={busy || !form.approved} className="min-h-11 w-full rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Menyiapkan sumber…' : 'Setujui sumber & lanjut'}</button>
  </form>;
}
