"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, History, LoaderCircle, RefreshCw, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { personalEntryPath } from '@/lib/individual-assessment';

type Availability = 'checking' | 'ready' | 'paused' | 'error';

const cardClass = 'flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_-4px_rgb(15_23_42_/_0.12)] sm:p-6';
const actionClass = 'group inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#0B2C6B] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#071F4E] focus-visible:outline-2 focus-visible:outline-offset-4';

function DiagnosisChoiceFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-[#F7F8FA] text-[#0B2C6B]">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="https://binahub.id" aria-label="BinaHub — beranda" className="shrink-0 rounded-md">
            <Image src="/full-logo.png" width={123} height={35} alt="BinaHub" className="h-auto w-[112px] sm:w-[123px]" />
          </a>
          <a href="https://binahub.id" className="inline-flex min-h-11 items-center gap-2 rounded-md text-xs font-medium text-slate-600 transition-colors hover:text-[#0B2C6B] sm:text-sm">
            <ArrowLeft size={15} aria-hidden="true" />Ke website
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[904px] px-5 pb-8 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">BinaInsights · Diagnosis pengembangan</p>
          <h1 className="mt-3 max-w-2xl text-[28px] font-semibold leading-[1.3] tracking-[-.035em] sm:text-[34px]">Apa yang ingin Anda kembangkan?</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Untuk diri sendiri atau untuk tim. Pilih diagnosis yang sesuai dengan kebutuhan Anda.</p>
        </div>

        <section aria-label="Pilihan diagnosis" className="grid items-stretch gap-4 min-[720px]:grid-cols-2">
          {children}
        </section>

        <div className="mt-5 flex flex-col gap-3 border-b border-slate-200 pb-5 min-[720px]:flex-row min-[720px]:items-center min-[720px]:justify-between min-[720px]:gap-6">
          <p className="text-xs leading-5 text-slate-500">Hasil individu dikirim melalui tautan email pribadi. Draft dapat dilanjutkan pada perangkat yang sama.</p>
          <div className="flex flex-wrap items-center gap-x-5"><Link href="/insight/individual/result" className="inline-flex min-h-11 items-center gap-2 rounded-md text-xs font-medium text-[#0B2C6B] underline-offset-4 hover:underline">Buka hasil individu<ArrowRight size={13} aria-hidden="true"/></Link>
          <Link href="/insight/individual/history" className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-md text-xs font-medium text-[#0B2C6B] underline-offset-4 hover:underline min-[720px]:self-auto">
            <History size={15} aria-hidden="true" />Riwayat pengisian akun<ArrowRight size={13} aria-hidden="true" />
          </Link></div>
        </div>
        <p className="mt-5 max-w-xl text-[11px] leading-5 text-slate-500">Hasil digunakan untuk refleksi dan pengembangan, bukan diagnosis klinis.</p>
        <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-sm text-slate-600">Sudah memiliki gambaran kebutuhan organisasi?</p><Link href="/discovery" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-[#0B2C6B] underline-offset-4 hover:underline">Dapatkan rekomendasi program<ArrowRight size={14} aria-hidden="true"/></Link></div>
      </div>
    </main>
  );
}

function Feature({ children }: { children: ReactNode }) {
  return <li className="flex items-start gap-2 text-[13px] leading-5 text-slate-600"><Check size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />{children}</li>;
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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#0B2C6B]"><Building2 size={22} strokeWidth={1.7} aria-hidden="true" /></span>
        </div>
        <h2 id="team-diagnosis-title" className="mt-5 text-xl font-semibold tracking-tight">Tim / Organisasi</h2>
        <p className="mt-2 text-[13px] leading-6 text-slate-600">Pahami tantangan tim dan tentukan fokus pengembangan organisasi.</p>
        <ul className="mb-6 mt-4 space-y-2">
          <Feature>Kinerja, kolaborasi, dan kesiapan tim</Feature>
          <Feature>Rekomendasi untuk kebutuhan organisasi</Feature>
        </ul>
        <div className="mt-auto border-t border-slate-100 pt-5">
          <Link href={`${params.get('lang') === 'en' ? '/en/insight' : '/insight'}${search}`} className={actionClass}>
            Mulai diagnosis tim<ArrowRight size={17} aria-hidden="true" className="shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </div>
      </article>

      <article aria-labelledby="individual-diagnosis-title" className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-[#956A1F]"><UserRound size={22} strokeWidth={1.7} aria-hidden="true" /></span>
        </div>
        <h2 id="individual-diagnosis-title" className="mt-5 text-xl font-semibold tracking-tight">Individu</h2>
        <p className="mt-2 text-[13px] leading-6 text-slate-600">Kenali pola kerja dan langkah pengembangan yang relevan untuk diri Anda.</p>
        <ul className="mb-6 mt-4 space-y-2">
          <Feature>3 Area Personal Effectiveness · 18 soal</Feature>
          <Feature>Refleksi dan arah pengembangan pribadi</Feature>
        </ul>
        <div className="mt-auto border-t border-slate-100 pt-5">
          {availability === 'ready' ? (
            <Link href={personalEntryPath(search)} className={actionClass}>
              Mulai diagnosis individu<ArrowRight size={17} aria-hidden="true" className="shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div>
              <button type="button" disabled className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-500">
                {availability === 'checking' ? <><LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true" />Memeriksa ketersediaan…</> : 'Diagnosis individu belum tersedia'}
              </button>
              <div role="status" aria-live="polite" className="text-xs leading-5 text-slate-600">
                {availability === 'checking' ? <span className="sr-only">Memeriksa ketersediaan diagnosis individu.</span> : availability === 'error' ? (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3">
                    <span>Ketersediaan belum dapat diperiksa.</span>
                    <button type="button" onClick={retryAvailability} className="inline-flex min-h-11 items-center gap-1.5 rounded-md font-medium text-[#0B2C6B] underline-offset-4 hover:underline"><RefreshCw size={13} aria-hidden="true" />Coba lagi</button>
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
