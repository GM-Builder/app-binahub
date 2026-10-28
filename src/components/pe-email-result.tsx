"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, ChartNoAxesCombined, ListChecks, Loader2, LockKeyhole, MailCheck } from 'lucide-react';
import { guestRequest } from '@/lib/pe-guest';
import { PERequestError, type PEReport, type PEReviewAccess } from '@/lib/individual-assessment';
import { PEResult } from './pe-report';
import { PEReviewAccessPanel } from './pe-review-access';
import { PEConsultationRequest } from './pe-consultation-request';
import { DiagnosisShell } from './diagnosis-shell';
import shared from './diagnosis.module.css';
import styles from './pe-diagnosis.module.css';

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
  return <DiagnosisShell organization>
    <div className={hasResult ? styles.layout : styles.accessLayout}>
      {deleted ? <section className={styles.receipt}><h1>Pengisian sudah dihapus.</h1><p>Jawaban, hasil, dan akses terkait pengisian ini telah dihapus dari sistem aktif.</p><Link href="/diagnose" className={`${shared.primaryButton} mt-6`}>Pilihan diagnosis<ArrowRight size={16} aria-hidden="true" /></Link></section>
        : result ? <div ref={resultContainer} tabIndex={-1} aria-label="Hasil Self Diagnostic Anda"><PEResult report={result.report} retentionUntil={result.retentionUntil} headingLevel={1} presentation="reference" />
          <PEConsultationRequest key={id} id={id} shared={result.access.shared} className={styles.resultExtras}/>
          <PEReviewAccessPanel id={id} access={result.access} token={async () => ''} className={styles.privacyExtras} onChange={access => setResult({ ...result, access })} update={body => guestRequest(`/${id}/result`, 'PATCH', body)}
            onErase={async () => { await guestRequest(`/${id}/result`, 'DELETE'); setResult(null); setDeleted(true); }} /></div>
        : <div className={styles.accessGrid}><div className={styles.accessStory}>
          <span className={`${shared.iconTile} ${shared.iconGold}`}><ChartNoAxesCombined size={26} aria-hidden="true" /></span>
          <h1>Lihat hasil Self Diagnostic Anda.</h1><p>Kenali profil pengembangan diri dan langkah praktis yang dapat Anda mulai.</p>
          <ul className={styles.accessFeatures}><li><span className={styles.areaIcon}><ChartNoAxesCombined size={19} aria-hidden="true" /></span>Grafik profil per area</li><li><span className={styles.areaIcon}><ListChecks size={19} aria-hidden="true" /></span>Fokus latihan dan langkah pengembangan</li></ul>
        </div><section className={styles.accessCard} aria-busy={checking || busy} aria-labelledby="pe-access-title">
          <span className={shared.iconTile}><LockKeyhole size={22} aria-hidden="true" /></span><h2 id="pe-access-title" className="mt-4">Akses laporan pribadi</h2><p>Gunakan tautan dari email untuk membuka hasil Anda. Tidak perlu membuat akun.</p>
          {error && <p id="pe-result-error" role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">{error}</p>}
          {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">{message}</p>}
          <button disabled={checking || busy || !validId(id) || (!token && !sessionReady)} onClick={() => void open()} aria-describedby={error ? 'pe-result-error' : 'pe-result-help'}
            className={`${shared.primaryButton} ${styles.accessAction}`}>
            {(checking || action === 'open') && <Loader2 className="motion-safe:animate-spin" size={17} aria-hidden="true" />}
            {checking ? 'Memeriksa akses…' : action === 'open' ? 'Membuka hasil…' : 'Lihat hasil saya'}
            {!checking && action !== 'open' && <ArrowRight size={17} aria-hidden="true" />}
          </button>
          <p id="pe-result-help" className={styles.hint}>
            {!checking && !token && !sessionReady ? 'Buka tautan pribadi dari email Anda, atau minta tautan baru di bawah.' : 'Akses pribadi. Tidak perlu akun atau password.'}
          </p>
          <details open={recovery} onToggle={event => setRecovery(event.currentTarget.open)} className={styles.accessRecovery}>
            <summary>Butuh tautan baru?</summary>
            <form onSubmit={event => {
              event.preventDefault(); void run('link', async () => {
                await guestRequest(validId(id) ? `/${id}/request-link` : '/request-link', 'POST', { email: email.trim().toLowerCase() });
                setMessage('Jika email sesuai dengan data pengisian, tautan hasil akan dikirim ke alamat tersebut.');
              });
            }}>
              <label className={styles.field}>Email pengisian<input required type="email" autoComplete="email" placeholder="Alamat email saat mengisi" value={email} maxLength={254} disabled={busy || checking} aria-describedby="pe-link-help"
                onChange={event => setEmail(event.target.value)} /></label>
              <p id="pe-link-help" className={styles.help}>Gunakan alamat email yang sama saat mengisi Self Diagnostic. Periksa juga folder spam atau promosi.</p>
              <button disabled={busy || checking} className={shared.primaryButton}>
                {action === 'link' ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <MailCheck size={16} aria-hidden="true" />}{action === 'link' ? 'Mengirim tautan…' : 'Kirim tautan baru'}
              </button>
            </form>
          </details>
          <details className={styles.accessSecurity}><summary>Tentang keamanan akses</summary><p>Gunakan tautan pribadi dari email Anda. Sesi hasil dibatasi selama 30 menit; masa akses hasil dan ketentuan pembukaan ulang tercantum dalam email. Jangan membagikan tautan hasil kepada orang lain.</p></details>
        </section></div>}
      {!hasResult && <p className={styles.support}>Butuh bantuan? <a href="mailto:admin@binahub.id">Hubungi BinaHub</a></p>}
    </div>
  </DiagnosisShell>;
}
