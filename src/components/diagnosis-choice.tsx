"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Building2, Check, ChevronRight, FileText, History, LoaderCircle, RefreshCw, Sparkles, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { personalEntryPath } from '@/lib/individual-assessment';
import { DiagnosisShell } from './diagnosis-shell';
import styles from './diagnosis.module.css';

type Availability = 'checking' | 'ready' | 'paused' | 'error';

const cardClass = styles.choiceCard;
const actionClass = styles.primaryButton + ' ' + styles.fullButton;

function DiagnosisChoiceFrame({ children }: { children: ReactNode }) {
  return (
    <DiagnosisShell>
      <div className={styles.choiceLayout}>
        <div>
          <p className={styles.eyebrow}>BinaInsights · Diagnosis pengembangan</p>
          <h1 className={styles.choiceTitle}>Mulai perjalanan pengembangan Anda</h1>
          <p className={styles.subtitle}>Pilih diagnosis yang paling sesuai dengan kebutuhan Anda.</p>
        </div>

        <section aria-label="Pilihan diagnosis" className={styles.choiceGrid}>
          {children}
        </section>

        <section className={styles.returning} aria-labelledby="returning-diagnosis-title">
          <h2 id="returning-diagnosis-title">Sudah pernah melakukan diagnosis?</h2>
          <p>Akses hasil atau lanjutkan pengisian diagnosis individu Anda.</p>
          <div className={styles.returningPanel}>
            <Link href="/insight/individual/result" className={styles.returningRow} aria-labelledby="individual-result-link">
              <span className={styles.iconTile + ' ' + styles.rowIcon}><FileText size={20} aria-hidden="true" /></span>
              <span className={styles.rowContent}><span id="individual-result-link" className={styles.rowTitle}>Lihat hasil individu</span><span className={styles.rowDescription}>Buka ringkasan hasil dan rekomendasi Anda.</span></span>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
            <Link href="/insight/individual" className={styles.returningRow} aria-labelledby="individual-draft-link">
              <span className={styles.iconTile + ' ' + styles.rowIcon}><History size={20} aria-hidden="true" /></span>
              <span className={styles.rowContent}><span id="individual-draft-link" className={styles.rowTitle}>Lanjutkan draf individu</span><span className={styles.rowDescription}>Lanjutkan pengisian pada perangkat ini.</span></span>
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.accountHistory}>Memiliki akun BinaHub? <Link href="/insight/individual/history" className={styles.textLink}>Riwayat pengisian akun<ArrowRight size={12} aria-hidden="true" /></Link></div>
        </section>
        <section className={styles.programCallout} aria-labelledby="program-recommendation-title">
          <Sparkles size={25} strokeWidth={1.7} className="text-[#ad7415]" aria-hidden="true" />
          <div><h2 id="program-recommendation-title">Sudah tahu kebutuhan organisasi Anda?</h2><p>Temukan rekomendasi program pengembangan yang sesuai.</p></div>
          <Link href="/discovery" className={styles.programLink}>Dapatkan rekomendasi program<ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
        <p className={styles.footnote}>Hasil diagnosis untuk refleksi dan pengembangan, bukan diagnosis klinis.</p>
      </div>
    </DiagnosisShell>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return <li><span className={styles.featureCheck}><Check size={13} strokeWidth={2.2} aria-hidden="true" /></span>{children}</li>;
}

export function DiagnosisChoiceLoading() {
  return (
    <DiagnosisChoiceFrame>
      {[0, 1].map(key => <div key={key} className={`${cardClass} min-h-80`} aria-hidden="true">
        <div className="h-11 w-11 rounded-xl bg-slate-100" />
        <div className="mt-5 h-6 w-40 rounded bg-slate-100" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" />
        <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
        <div className="mt-auto h-12 rounded-xl bg-slate-100" />
      </div>)}
      <p role="status" className="sr-only">Menyiapkan pilihan diagnosis…</p>
    </DiagnosisChoiceFrame>
  );
}

export function DiagnosisChoice() {
  const [availability, setAvailability] = useState<Availability>('checking');
  const [checkVersion, setCheckVersion] = useState(0);
  const params = useSearchParams();
  const query = params.toString();
  const search = query ? `?${query}` : '';

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => {
      if (active) setAvailability('error');
      controller.abort();
    }, 8_000);

    void fetch('/api/assessment/individual/availability', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Availability request failed');
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object' || !('available' in body) || typeof body.available !== 'boolean') {
          throw new Error('Invalid availability response');
        }
        if (active && !controller.signal.aborted) setAvailability(body.available ? 'ready' : 'paused');
      })
      .catch(() => { if (active && !controller.signal.aborted) setAvailability('error'); })
      .finally(() => clearTimeout(timeout));

    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [checkVersion]);

  function retryAvailability() {
    setAvailability('checking');
    setCheckVersion(version => version + 1);
  }

  return (
    <DiagnosisChoiceFrame>
      <article aria-labelledby="team-diagnosis-title" className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <span className={styles.iconTile}><Building2 size={26} strokeWidth={1.7} aria-hidden="true" /></span>
        </div>
        <h2 id="team-diagnosis-title">Tim / Organisasi</h2>
        <p className={styles.cardDescription}>Pahami tantangan dan peluang pengembangan tim.</p>
        <ul className={styles.features}>
          <Feature>Kinerja, kolaborasi, dan kesiapan tim</Feature>
          <Feature>Rekomendasi untuk kebutuhan organisasi</Feature>
        </ul>
        <div className={styles.cardAction}>
          <Link href={`${params.get('lang') === 'en' ? '/en/insight' : '/insight'}${search}`} className={actionClass}>
            Mulai diagnosis tim<ArrowRight size={17} aria-hidden="true" className="shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </div>
      </article>

      <article aria-labelledby="individual-diagnosis-title" className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <span className={styles.iconTile + ' ' + styles.iconGold}><UserRound size={26} strokeWidth={1.7} aria-hidden="true" /></span>
        </div>
        <h2 id="individual-diagnosis-title">Individu</h2>
        <p className={styles.cardDescription}>Kenali pola kerja dan potensi pengembangan diri.</p>
        <ul className={styles.features}>
          <Feature>3 Area Personal Effectiveness · 18 soal</Feature>
          <Feature>Refleksi dan arah pengembangan pribadi</Feature>
        </ul>
        <div className={styles.cardAction}>
          {availability === 'ready' ? (
            <Link href={personalEntryPath(search)} className={actionClass}>
              Mulai diagnosis individu<ArrowRight size={17} aria-hidden="true" className="shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div>
              <button type="button" disabled className={styles.primaryButton + ' w-full'}>
                {availability === 'checking' ? <><LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />Memeriksa ketersediaan…</> : 'Diagnosis individu belum tersedia'}
              </button>
              <div role="status" aria-live="polite" className={styles.availability}>
                {availability === 'checking' ? <span className="sr-only">Memeriksa ketersediaan diagnosis individu.</span> : availability === 'error' ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3">
                    <span>Ketersediaan belum dapat diperiksa.</span>
                    <button type="button" onClick={retryAvailability} className={styles.textLink}><RefreshCw size={13} aria-hidden="true" />Coba lagi</button>
                  </div>
                ) : <p className="mt-3">Pengisian baru sedang dijeda. Draft dan hasil sebelumnya tetap dapat dibuka.</p>}
              </div>
            </div>
          )}
        </div>
      </article>
    </DiagnosisChoiceFrame>
  );
}
