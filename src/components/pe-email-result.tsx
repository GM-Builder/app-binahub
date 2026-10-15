"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, ListChecks, Loader2, LockKeyhole } from 'lucide-react';
import { guestRequest } from '@/lib/pe-guest';
import { PERequestError, type PEReport, type PEReviewAccess } from '@/lib/individual-assessment';
import { PEResult } from './pe-report';
import { PEReviewAccessPanel } from './pe-review-access';

type Result = { report: PEReport; access: PEReviewAccess; retentionUntil: string };
const validId = (id: string) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id);
export function PEEmailResult() {
  const params = useSearchParams(), id = params.get('attempt') || '';
  return <PEEmailResultBody key={id} id={id} />;
}
function PEEmailResultBody({ id }: { id: string }) {
  const [token, setToken] = useState(''), [result, setResult] = useState<Result | null>(null);
  const [action, setAction] = useState<'open' | 'link' | null>(null), [checking, setChecking] = useState(true);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [email, setEmail] = useState(''), [deleted, setDeleted] = useState(false), [recovery, setRecovery] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const lock = useRef(false), openedByUser = useRef(false), resultContainer = useRef<HTMLDivElement>(null);
  const pendingLink = useRef({ id: '', token: '' });
  const hasResult = result !== null, busy = action !== null;
  useEffect(() => {
    let alive = true;
    const link = new URLSearchParams(window.location.hash.slice(1)).get('access') || '';
    if (pendingLink.current.id !== id) pendingLink.current = { id, token: '' };
    if (link) {
      pendingLink.current.token = /^[a-f0-9]{64}$/.test(link) ? link : '';
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    void Promise.resolve().then(async () => {
      if (!alive) return;
      try {
        if (!validId(id)) return;
        if (pendingLink.current.token) { setToken(pendingLink.current.token); return; }
        // A link is only exchanged on an explicit click, not by an email scanner.
        const value = await guestRequest<Result>(`/${id}/result`);
        if (alive) setResult(value);
      } catch (failure) {
        if (alive && !(failure instanceof PERequestError && [401, 403, 404, 410].includes(failure.status))) {
          setError('Akses hasil belum dapat diperiksa. Silakan coba buka kembali.');
          setSessionReady(true);
        }
      } finally { if (alive) setChecking(false); }
    });
    return () => { alive = false; };
  }, [id]);
  useEffect(() => {
    if (hasResult && openedByUser.current) {
      openedByUser.current = false;
      resultContainer.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [hasResult]);
  async function run(kind: 'open' | 'link', work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setAction(kind); setError(''); setMessage('');
    try { await work(); }
    catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Belum dapat terhubung. Silakan coba lagi.');
      if (kind === 'open' && failure instanceof PERequestError && [401, 403, 404, 410].includes(failure.status)) {
        setRecovery(true); setToken(''); pendingLink.current.token = ''; setSessionReady(false);
      }
    } finally { lock.current = false; setAction(null); }
  }
  async function open() {
    await run('open', async () => {
      if (token) {
        await guestRequest(`/${id}/result`, 'POST', { token });
        setToken(''); pendingLink.current.token = ''; setSessionReady(true);
      }
      const value = await guestRequest<Result>(`/${id}/result`);
      openedByUser.current = true; setResult(value);
    });
  }
  return <main className="min-h-screen bg-[#F7F8FA] px-4 pb-10 text-[#0B2C6B] sm:px-6">
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 py-5">
      <Link href="/diagnose" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium"><ArrowLeft size={16} aria-hidden="true" />Pilihan diagnosis</Link>
      <span className="text-sm font-semibold">BinaInsights</span>
    </header>
    <div className={hasResult ? 'mx-auto max-w-5xl' : 'mx-auto max-w-lg pt-3 sm:pt-8'}>
      {deleted ? <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"><h1 className="text-2xl font-semibold tracking-tight">Pengisian sudah dihapus.</h1><p className="mt-3 text-sm leading-7 text-slate-600">Jawaban, hasil, dan akses terkait pengisian ini telah dihapus dari sistem aktif.</p></section>
        : result ? <div ref={resultContainer} tabIndex={-1} aria-label="Hasil asesmen Anda"><PEResult report={result.report} retentionUntil={result.retentionUntil} headingLevel={1} />
          <PEReviewAccessPanel id={id} access={result.access} token={async () => ''} onChange={access => setResult({ ...result, access })} update={body => guestRequest(`/${id}/result`, 'PATCH', body)}
            onErase={async () => { await guestRequest(`/${id}/result`, 'DELETE'); setResult(null); setDeleted(true); }} /></div>
        : <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8" aria-busy={checking || busy}>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50"><LockKeyhole size={21} aria-hidden="true" /></span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Lihat hasil asesmen Anda.</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">Kenali profil pengembangan diri dan langkah praktis yang dapat Anda mulai.</p>
          <ul className="my-5 space-y-3 border-y border-slate-100 py-4 text-sm text-slate-700">
            <li className="flex items-center gap-3"><ChartNoAxesCombined size={18} aria-hidden="true" className="shrink-0 text-[#0B2C6B]" />Grafik profil per area</li>
            <li className="flex items-center gap-3"><ListChecks size={18} aria-hidden="true" className="shrink-0 text-[#0B2C6B]" />Fokus latihan dan langkah pengembangan</li>
          </ul>
          {error && <p id="pe-result-error" role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">{error}</p>}
          {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">{message}</p>}
          <button disabled={checking || busy || !validId(id) || (!token && !sessionReady)} onClick={() => void open()} aria-describedby={error ? 'pe-result-error' : 'pe-result-help'}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0B2C6B] px-5 text-sm font-semibold text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50">
            {(checking || action === 'open') && <Loader2 className="motion-safe:animate-spin" size={17} aria-hidden="true" />}
            {checking ? 'Memeriksa akses…' : action === 'open' ? 'Membuka hasil…' : 'Lihat hasil saya'}
            {!checking && action !== 'open' && <ArrowRight size={17} aria-hidden="true" />}
          </button>
          <p id="pe-result-help" className="mt-3 text-center text-xs leading-6 text-slate-600">
            {!checking && !token && !sessionReady ? 'Buka tautan pribadi dari email Anda, atau minta tautan baru di bawah.' : 'Akses pribadi. Tidak perlu akun atau password.'}
          </p>
          <details open={recovery} onToggle={event => setRecovery(event.currentTarget.open)} className="mt-5 border-t border-slate-100 pt-2">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Butuh tautan baru?</summary>
            <form className="space-y-3 pb-1" onSubmit={event => {
              event.preventDefault(); void run('link', async () => {
                await guestRequest(validId(id) ? `/${id}/request-link` : '/request-link', 'POST', { email: email.trim().toLowerCase() });
                setMessage('Jika email sesuai dengan data pengisian, tautan hasil akan dikirim ke alamat tersebut.');
              });
            }}>
              <label className="block text-sm font-medium">Email pengisian<input required type="email" autoComplete="email" value={email} maxLength={254} disabled={busy || checking} aria-describedby="pe-link-help"
                onChange={event => setEmail(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal sm:text-sm" /></label>
              <p id="pe-link-help" className="text-xs leading-6 text-slate-600">Gunakan alamat email yang sama saat mengisi asesmen. Periksa juga folder spam atau promosi.</p>
              <button disabled={busy || checking} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
                {action === 'link' && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}{action === 'link' ? 'Mengirim tautan…' : 'Kirim tautan baru'}
              </button>
            </form>
          </details>
          <details className="mt-1 text-xs leading-6 text-slate-600"><summary className="min-h-11 cursor-pointer py-3 font-medium">Tentang keamanan akses</summary><p className="pb-2">Tautan berlaku 48 jam dan hanya dapat digunakan sekali. Sesi hasil berlaku 30 menit. Jangan membagikan tautan hasil Anda kepada orang lain.</p></details>
        </section>}
      {!hasResult && <p className="mt-5 text-center text-xs leading-6 text-slate-600">Butuh bantuan? <a className="font-medium text-[#0B2C6B] underline underline-offset-4" href="mailto:admin@binahub.id">Hubungi BinaHub</a></p>}
    </div>
  </main>;
}
