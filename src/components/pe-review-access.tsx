"use client";
import { useRef, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { peRequest, type PEReviewAccess } from '@/lib/individual-assessment';

export function PEReviewAccessPanel({ id, access, token, onChange, update, onErase }: {
  id: string; access: PEReviewAccess; token: () => Promise<string>;
  onChange: (access: PEReviewAccess) => void;
  update?: (body: unknown) => Promise<{ access: PEReviewAccess }>;
  onErase?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [share, setShare] = useState(access.shared);
  const [evaluate, setEvaluate] = useState(access.evaluationConsent);
  const [clarity, setClarity] = useState(access.clarity?.toString() || ''), [usefulness, setUsefulness] = useState(access.usefulness?.toString() || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lock = useRef(false), deleteButton = useRef<HTMLButtonElement>(null), cancelButton = useRef<HTMLButtonElement>(null);
  const legacyEvaluation = access.evaluationConsent && access.exportConsent !== true;
  const evaluationChanged = evaluate !== access.evaluationConsent
    || clarity !== (access.clarity?.toString() || '') || usefulness !== (access.usefulness?.toString() || '');
  const dirty = share !== access.shared || evaluationChanged;
  async function save() {
    if (lock.current) return;
    if (evaluate && (!!clarity !== !!usefulness)) { setError('Lengkapi kedua penilaian, atau biarkan keduanya kosong.'); return; }
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      // A share-only change never upgrades an older statistics consent to export consent.
      const body = {
        ...(evaluationChanged ? { evaluationVersion: 'pe-evaluation-v2' } : {}),
        share, consentVersion: share ? 'pe-consultant-review-v1' : null,
        evaluate: evaluationChanged ? evaluate : access.evaluationConsent,
        clarity: evaluationChanged ? evaluate && clarity ? Number(clarity) : null : access.clarity,
        usefulness: evaluationChanged ? evaluate && usefulness ? Number(usefulness) : null : access.usefulness,
      };
      const result = update ? await update(body) : await peRequest<{ access: PEReviewAccess }>(await token(), '/' + id + '/access', 'PATCH', body);
      if (!update) await token();
      onChange(result.access); setShare(result.access.shared); setEvaluate(result.access.evaluationConsent);
      setClarity(result.access.clarity?.toString() || ''); setUsefulness(result.access.usefulness?.toString() || '');
      setMessage('Pilihan privasi Anda telah disimpan.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Pilihan belum tersimpan. Silakan coba lagi.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function erase() {
    if (!onErase || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await onErase(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Data belum terhapus. Silakan coba lagi.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <details className="mt-5 rounded-xl border border-slate-200 bg-white text-slate-900" aria-busy={busy} onToggle={event => {
    if (!(event.currentTarget as HTMLDetailsElement).open) setConfirmDelete(false);
  }}>
    <summary className="min-h-12 cursor-pointer px-5 py-4 text-sm font-semibold text-[#0B2C6B] sm:px-6"><span className="ml-1 inline-flex items-center gap-2"><ShieldCheck size={17} aria-hidden="true" />Privasi & data</span></summary>
    <div className="border-t border-slate-200 p-5 sm:p-6">
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); void save(); }}>
        <fieldset disabled={busy} className="space-y-5">
          <legend className="sr-only">Pengaturan privasi hasil asesmen</legend>
          <div><label className="flex cursor-pointer items-start gap-3 text-sm font-medium leading-6"><input type="checkbox" checked={share} onChange={event => setShare(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-900" />Izinkan tim BinaHub meninjau hasil saya</label>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Tim BinaHub dapat melihat identitas, informasi pekerjaan, jawaban, dan hasil untuk memberi rekomendasi pengembangan. Jika izin dimatikan, hasil tetap dapat Anda baca, tetapi tidak lagi dapat ditinjau oleh tim. Hasil tidak dibagikan otomatis kepada perusahaan.</p></div>
          <div className="border-t border-slate-100 pt-5"><label className="flex cursor-pointer items-start gap-3 text-sm font-medium leading-6"><input type="checkbox" checked={evaluate} onChange={event => setEvaluate(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-blue-900" />Bantu meningkatkan kualitas asesmen (opsional)</label>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{legacyEvaluation
              ? 'Izin evaluasi statistik yang Anda berikan sebelumnya masih aktif. Izin ini tidak mencakup ekspor jawaban per orang. Matikan pilihan ini dan simpan untuk menghentikan izin tersebut.'
              : 'Dengan izin ini, tim evaluasi berwenang dapat menggunakan dan mengekspor jawaban, skor, waktu pengisian, serta penilaian Anda dengan kode pengganti, tanpa nama, email, atau informasi pekerjaan. Data berkode tetap perlu dilindungi. Data ini tidak digunakan untuk keputusan seleksi atau promosi.'}</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Izin ini terpisah dari akses rekomendasi. Mematikannya menghentikan penggunaan berikutnya; salinan yang sudah diekspor tidak dapat ditarik kembali secara otomatis.</p>
          </div>
          {evaluate && !legacyEvaluation && <div><p className="text-sm text-slate-600">Anda juga dapat memberi penilaian berikut. Keduanya opsional.</p><div className="mt-3 grid gap-4 sm:grid-cols-2">{[
            { label: 'Kejelasan pertanyaan', value: clarity, set: setClarity }, { label: 'Manfaat hasil asesmen', value: usefulness, set: setUsefulness },
          ].map(field => <label key={field.label} className="text-sm font-medium">{field.label}<select value={field.value} onChange={event => field.set(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal sm:text-sm"><option value="">Tidak memberi penilaian</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} — {['', 'Sangat kurang', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'][n]}</option>)}</select></label>)}</div></div>}
        </fieldset>
        <button disabled={busy || !dirty} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0B2C6B] px-4 text-sm font-semibold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50">{busy && <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" />}{busy ? 'Menyimpan…' : 'Simpan pilihan'}</button>
      </form>
      {onErase && <div className="mt-6 border-t border-slate-200 pt-5"><h3 className="text-sm font-semibold">Hapus jawaban dan hasil</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Menghapus data pengisian ini dari sistem aktif, termasuk hasil dan aksesnya. Tindakan ini tidak dapat dipulihkan dan berbeda dari mematikan izin tinjauan.</p>
        {!confirmDelete ? <button ref={deleteButton} type="button" disabled={busy} onClick={() => { setConfirmDelete(true); setTimeout(() => cancelButton.current?.focus(), 0); }} className="mt-2 min-h-11 text-sm font-medium text-red-700 underline underline-offset-4">Hapus data pengisian</button>
          : <div role="group" aria-label="Konfirmasi penghapusan" className="mt-4 rounded-lg bg-red-50 p-4"><p className="text-sm leading-6 text-red-900">Hapus jawaban dan hasil ini secara permanen? Salinan yang sudah diunduh atau diekspor tidak ikut terhapus.</p><div className="mt-3 flex flex-wrap gap-3"><button ref={cancelButton} type="button" disabled={busy} onClick={() => { setConfirmDelete(false); setTimeout(() => deleteButton.current?.focus(), 0); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium">Batal</button><button type="button" disabled={busy} onClick={() => void erase()} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Menghapus…' : 'Hapus permanen'}</button></div></div>}
      </div>}
      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-700">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm leading-6 text-emerald-800">{message}</p>}
    </div>
  </details>;
}
