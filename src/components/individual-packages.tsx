import Link from 'next/link';
import {ArrowRight,LockKeyhole} from 'lucide-react';
import {DiagnosisShell} from './diagnosis-shell';
import styles from './diagnosis.module.css';

export const individualPackages=[
 {name:'Personal Effectiveness',price:59000},
 {name:'Relationship Management',price:89000},
 {name:'Leadership Effectiveness',price:69000},
 {name:'Work & Business Results',price:119000},
 {name:'Paket lengkap',price:299000},
];
export function IndividualPackages({freeHref='/insight/individual'}:{freeHref?:string}){
 return <DiagnosisShell organization><div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
  <h1 className="text-balance text-3xl font-semibold text-[#0b2c6b]">Pilih Self Diagnostic Anda</h1>
  <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-slate-600">Mulai dengan tiga kompetensi Personal Effectiveness, atau lihat paket pengembangan yang sedang kami siapkan.</p>
  <section aria-labelledby="free-diagnostic" className="mt-8 rounded-xl border border-[#dce4ef] bg-white p-6 sm:p-8">
   <div className="flex flex-wrap justify-between gap-4"><h2 id="free-diagnostic" className="text-xl font-semibold">Self Diagnostic gratis</h2><p className="font-semibold">Rp0</p></div>
   <p className="mt-3 text-sm leading-7 text-slate-600">Self-Development, Adaptability, dan Pressure Management.</p>
   <Link href={freeHref} className={`${styles.primaryButton} mt-5`}>Mulai Self Diagnostic gratis<ArrowRight size={17} aria-hidden="true"/></Link>
  </section>
  <section aria-labelledby="paid-diagnostics" className="mt-10">
   <h2 id="paid-diagnostics" className="text-xl font-semibold">Paket Self Diagnostic</h2>
   <p className="mt-2 text-sm leading-7 text-slate-600">Paket berbayar belum dapat dibeli. Pembayaran belum dibuka.</p>
   <ul className="mt-5 divide-y divide-[#dce4ef] rounded-xl border border-[#dce4ef] bg-white px-5 sm:px-7">
    {individualPackages.map(pack=><li key={pack.name} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h3 className="font-semibold">{pack.name}</h3><p className="mt-1 text-sm tabular-nums">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(pack.price)}</p></div><span className="inline-flex items-center gap-2 text-xs text-slate-600"><LockKeyhole size={15} aria-hidden="true"/>Coming soon</span></li>)}
   </ul>
  </section>
 </div></DiagnosisShell>;
}
