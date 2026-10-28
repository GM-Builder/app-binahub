"use client";

import { useId } from 'react';
import { ArrowDown, ArrowRight, CalendarDays } from 'lucide-react';
import type { PEReport } from '@/lib/individual-assessment';
import { PEProfileChart, formatPEScore } from './pe-profile-chart';
import styles from './pe-diagnosis.module.css';

const date = (value: string) => new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'long', year: 'numeric',hour:'2-digit',minute:'2-digit', timeZone: 'Asia/Jakarta',
}).format(new Date(value));

export function PEResult({ report, retentionUntil, headingLevel = 2, presentation }: {
  report: PEReport; retentionUntil: string; headingLevel?: 1 | 2; presentation?: 'reference';
}) {
  const reference = presentation === 'reference';
  const prefix = useId().replace(/:/g, '');
  const Title = headingLevel === 1 ? 'h1' : 'h2';
  const Heading = headingLevel === 1 ? 'h2' : 'h3';
  const Subheading = headingLevel === 1 ? 'h3' : 'h4';
  const sections = [{ key: 'summary', title: 'Ringkasan' }, { key: 'plan', title: 'Langkah praktis' },
    { key: 'profile', title: 'Area Pengembangan' }, { key: 'method', title: 'Catatan hasil' }];
  const target = (key: string) => `${prefix}-${key}`;
  return <section aria-label="Laporan Self Diagnostic individu" className={reference ? styles.report : 'mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900'}>
    <header className={reference ? styles.reportHeader : 'border-b border-slate-200 px-5 py-5 sm:px-8 sm:py-6'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Title className="text-2xl font-semibold tracking-tight text-[#0B2C6B] sm:text-3xl">Hasil Self Diagnostic individu</Title>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Profil Anda, fokus latihan, dan langkah berikutnya dalam satu laporan.</p></div>
        {report.metadata && <p className="inline-flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={16} aria-hidden="true" />{date(report.metadata.assessmentDate)}</p>}
      </div>
      <nav aria-label="Bagian laporan" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-2">
        {sections.map(section => <a key={section.key} href={`#${target(section.key)}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[#0B2C6B] underline-offset-4 hover:underline">{section.title}<ArrowDown size={13} aria-hidden="true" /></a>)}
      </nav>
    </header>

    <div className={reference ? styles.reportBody : 'px-5 sm:px-8'}>
      <section id={target('summary')} aria-labelledby={target('summary-heading')} className="scroll-mt-6 py-6 sm:py-7">
        <Heading id={target('summary-heading')} className="text-xl font-semibold text-[#0B2C6B]">Ringkasan Anda</Heading>
        <div className={reference ? `mt-5 grid ${styles.reportSummary}` : 'mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]'}>
          <PEProfileChart areas={report.areas} combined />
          <aside aria-label="Fokus pengembangan Anda" className={reference ? styles.focusPanel : 'min-w-0 border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0'}>
            <Subheading className="text-base font-semibold text-[#0B2C6B]">Fokus latihan Anda</Subheading>
            {report.priorities.length ? <><p className="mt-2 text-sm leading-6 text-slate-600">Mulai dari area berikut, sesuai tujuan dan relevansi pekerjaan Anda.</p><ol className="mt-3 divide-y divide-slate-100">{report.priorities.map(item => <li key={item.code}><a href={`#${target(`practice-${item.code}`)}`} className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm font-semibold text-[#0B2C6B] underline-offset-4 hover:underline">{item.name}<ArrowRight size={16} aria-hidden="true" className="shrink-0" /></a></li>)}</ol></>
              : <p className="mt-2 text-sm leading-6 text-slate-600">Belum cukup bukti atau relevansi untuk menetapkan fokus latihan. Gunakan profil sebagai awal refleksi.</p>}
          </aside>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-4"><p className="text-xs font-medium text-slate-500">Tujuan pengembangan{report.summary?.role ? ` · ${report.summary.role}` : ''}</p><p className="mt-1.5 max-w-3xl break-words text-sm leading-7 text-slate-800">{report.goal}</p></div>
      </section>

      <section id={target('plan')} aria-labelledby={target('plan-heading')} className="scroll-mt-6 border-t border-slate-200 py-7 sm:py-8">
        <Heading id={target('plan-heading')} className="text-xl font-semibold text-[#0B2C6B]">Langkah pengembangan</Heading>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">Gunakan fokus berikut sebagai arah latihan, bukan label kemampuan yang menetap.</p>
        {report.priorities.length === 0 ? <p className="mt-5 text-sm leading-7 text-slate-600">Belum cukup bukti atau relevansi untuk menentukan fokus. Gunakan hasil sebagai awal percakapan pengembangan.</p>
          : <ol className="mt-6 divide-y divide-slate-200">{report.priorities.map((priority, index) => <li id={target(`practice-${priority.code}`)} key={priority.code} className="scroll-mt-6 py-6 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#0B2C6B]" aria-hidden="true">{index + 1}</span>
              <div className="min-w-0"><Subheading className="text-lg font-semibold text-[#0B2C6B]">{priority.name}</Subheading><p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{priority.reason}</p></div></div>
            {priority.practice && <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[{ title: 'Mulai dari sini', value: priority.practice.focus }, { title: 'Terapkan dalam pekerjaan', value: priority.practice.context },
                { title: 'Amati perkembangannya', value: priority.practice.successIndicator }, { title: 'Latihan dan refleksi', value: 'Latih kemampuan ini mulai sekarang. Tinjau kembali kompetensi Anda dalam satu bulan ke depan.' }]
                .map(item => <div key={item.title}><dt className="text-sm font-semibold text-slate-900">{item.title}</dt><dd className="mt-1.5 break-words text-sm leading-7 text-slate-600">{item.value}</dd></div>)}
            </dl>}
          </li>)}</ol>}
      </section>

      <section id={target('profile')} aria-labelledby={target('profile-heading')} className="scroll-mt-6 border-t border-slate-200 py-7 sm:py-8">
        <Heading id={target('profile-heading')} className="text-xl font-semibold text-[#0B2C6B]">Area Pengembangan</Heading>
        <div className="mt-3"><div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm"><caption className="sr-only">Perbandingan skor pengalaman kerja dan studi kasus per area. Tanda garis berarti bukti belum cukup, bukan skor nol.</caption>
            <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th scope="col" className="py-3 pr-3 font-medium">Area</th><th scope="col" className="px-2 py-3 text-right font-medium">Pengalaman nyata</th><th scope="col" className="py-3 pl-2 text-right font-medium">Studi kasus</th></tr></thead>
            <tbody>{report.areas.map(area => <tr key={area.code} className="border-b border-slate-100 last:border-b-0">
              <th scope="row" className="py-4 pr-3 text-left font-medium text-[#0B2C6B]">{area.name}</th>
              {[area.selfReport, area.sjt].map((method, i) => <td key={i} className="px-2 py-4 text-right align-top tabular-nums"><span className="text-lg font-semibold">{formatPEScore(method.score)}</span>{method.score !== null && <span className="ml-1 text-xs text-slate-500">/100</span>}
                {method.score === null && <span className="mt-1 block text-xs leading-5 text-slate-600">Bukti belum cukup</span>}</td>)}
            </tr>)}</tbody>
          </table>
        </div></div>
        <div className="mt-5 divide-y divide-slate-200">{report.areas.map(area => <details key={area.code} className="group py-1">
          <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold text-[#0B2C6B]">Rincian {area.name}</summary>
          <div className="space-y-3 pb-5 text-sm leading-7 text-slate-600">
            {(area.selfReport.score === null || area.sjt.score === null) && <p>Bukti belum cukup untuk menampilkan skor.</p>}
            {area.interpretation && <p>{area.interpretation}</p>}
          </div>
        </details>)}</div>
      </section>

      {!!report.solutions?.items.length && <section aria-labelledby={target('solutions-heading')} className="border-t border-slate-200 py-7 sm:py-8">
        <Heading id={target('solutions-heading')} className="text-xl font-semibold text-[#0B2C6B]">Pilihan pengembangan terkait</Heading>
        <div className="mt-5 divide-y divide-slate-200">{report.solutions.items.map(solution => <a key={solution.title} href={solution.code&&/^SS-\d{2}$/.test(solution.code)?`/catalog?solution=${encodeURIComponent(solution.code)}`:solution.url} className="flex min-h-11 items-start justify-between gap-4 py-4 first:pt-0 hover:underline underline-offset-4">
          <div><Subheading className="font-semibold text-[#0B2C6B]">{solution.title}</Subheading><p className="mt-2 text-sm leading-7 text-slate-600">{solution.reason}</p><span className="mt-2 inline-block text-sm font-medium text-[#0B2C6B]">Lihat program</span></div><ArrowRight size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#0B2C6B]" />
        </a>)}</div>
      </section>}

      <section id={target('method')} aria-labelledby={target('method-heading')} className="scroll-mt-6 border-t border-slate-200 py-7 sm:py-8">
        <Heading id={target('method-heading')} className="text-xl font-semibold text-[#0B2C6B]">Catatan hasil</Heading>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{report.notice}</p>
        {report.metadata && <details className="mt-4 text-sm leading-7 text-slate-600"><summary className="min-h-11 cursor-pointer py-2 font-medium text-[#0B2C6B]">Versi instrumen dan laporan</summary>
          <dl className="grid gap-3 pb-3 sm:grid-cols-2">{[{ label: 'Instrumen', value: `${report.metadata.instrumentId} · ${report.metadata.instrumentVersion}` }, { label: 'Skoring', value: report.metadata.scoringVersion },
            { label: 'Laporan', value: report.metadata.reportVersion }, { label: 'Aturan prioritas', value: report.metadata.priorityVersion }].map(item => <div key={item.label}><dt className="font-medium text-slate-800">{item.label}</dt><dd className="break-words">{item.value}</dd></div>)}</dl>
        </details>}
      </section>
    </div>
    <footer className={reference ? styles.reportFooter : 'border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600 sm:px-8'}>
      {report.privacy && <div className="mb-3 max-w-3xl space-y-2"><p>{report.privacy.purpose} {report.privacy.access}</p><p>{report.privacy.process}</p></div>}
      <p>Hasil tersimpan sampai {date(retentionUntil)}. Butuh bantuan? <a href={`mailto:${report.privacy?.contact || 'admin@binahub.id'}`} className="font-medium text-[#0B2C6B] underline underline-offset-4">Hubungi BinaHub</a>.</p>
    </footer>
  </section>;
}
