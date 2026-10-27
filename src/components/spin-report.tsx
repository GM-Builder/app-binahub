import { ArrowDown, ArrowRight, Check, CircleHelp } from 'lucide-react';
import { type SpinReport as Report } from '@/lib/spin-client';
import styles from './spin-report.module.css';
import { spinSummaryPoints } from '@/lib/spin-summary-points';

const money=(amount:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(amount);
export function SpinReport({report:r}:{report:Report}){
 const programs=r.solutions.length?r.solutions:r.exploration||[];
 const review=!r.solutions.length&&programs.length>0;
 const advisory=r.advisory||{
  title:programs.length?'Arah pengembangan yang direkomendasikan':'Mari perjelas arah pengembangan Anda',
  description:programs.length?'Hubungkan kebutuhan kerja Anda dengan fokus pembelajaran dan program berikut.':'Informasi yang tersedia belum menghasilkan rekomendasi program yang dapat ditetapkan. Gunakan ringkasan ini sebagai bahan diskusi bersama BinaHub.',
  reasons:[],
 };
 return <article className={styles.report} aria-label="Laporan rekomendasi pengembangan organisasi">
  <header className={styles.masthead}>
   <div><h1>Rekomendasi pengembangan organisasi</h1><p className={styles.company}>{r.company}</p></div>
   <dl className={styles.reference}><div><dt>Disusun pada</dt><dd>{new Date(r.issuedAt).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})}</dd></div><div><dt>Referensi</dt><dd>{r.reference.slice(0,8).toUpperCase()}</dd></div></dl>
  </header>
  <section className={styles.overview} aria-labelledby="spin-direction-title">
   <h2 id="spin-direction-title">Arah pengembangan, dalam satu pandangan</h2>
   <p className={styles.intro}>Dari tantangan yang Anda sampaikan menuju hasil yang ingin dicapai.</p>
   <div className={styles.path} role="group" aria-label="Hubungan kebutuhan, dampak, dan hasil yang diharapkan">
    {[['Kebutuhan utama',r.summary.problem],['Dampak pada pekerjaan',r.summary.impact],['Hasil yang diharapkan',r.summary.outcome]].map(([label,text],index)=><div className={styles.pathItem} key={label}>
     <div className={styles.pathLabel}><span>{label}</span>{index<2&&<ArrowRight size={17} aria-hidden="true"/>}</div>
     <ul className={styles.summaryPoints}>{spinSummaryPoints(text).slice(0,3).map(point=><li key={point}>{point}</li>)}</ul>
     {spinSummaryPoints(text).length>3&&<details className={styles.summaryMore}><summary>Lihat {spinSummaryPoints(text).length-3} poin lainnya</summary><ul className={styles.summaryPoints}>{spinSummaryPoints(text).slice(3).map(point=><li key={point}>{point}</li>)}</ul></details>}
    </div>)}
   </div>
   <div className={styles.advisory}><div className={styles.advisoryHeading}><span className={styles.status}>{review?'Perlu penyelarasan':programs.length?'Rekomendasi awal':'Perlu pembahasan'}</span><h3>{advisory.title}</h3></div><p>{advisory.description}</p>
    {advisory.reasons.length>0&&<ul>{advisory.reasons.map(reason=><li key={reason}><CircleHelp size={16} aria-hidden="true"/><span>{reason}</span></li>)}</ul>}
   </div>
  </section>
  <section className={styles.section} aria-labelledby="spin-programs-title">
   <div className={styles.sectionHeading}><div><h2 id="spin-programs-title">{review?'Opsi program untuk konsultasi':'Program yang relevan'}</h2><p>{review?'Bahan diskusi, bukan penawaran yang telah ditetapkan.':'Alasan kecocokan, kompetensi yang dikembangkan, dan hasil program.'}</p></div>{programs.length>0&&<span className={styles.count}>{programs.length} program</span>}</div>
   {programs.length?<div>{programs.map(program=>{
    const investment=r.investments.find(item=>item.name===program.name);
    return <section key={program.code} className={styles.program} aria-label={program.name}>
     <header className={styles.programHeading}><span className={styles.programCode}>{program.code}</span><h3>{program.name}</h3></header>
     <div className={styles.programGrid}><div><h4>Kenapa program ini relevan?</h4>
      <dl className={styles.evidence}>{program.evidence.map((e,index)=><div key={index}><dt>{e.need}</dt><dd><ArrowDown size={14} aria-hidden="true"/><span>{e.objective}</span></dd></div>)}</dl>
      {!!program.competencies?.length&&<div className={styles.competencies}><h4>Kompetensi yang dikembangkan</h4><ul>{program.competencies.map(name=><li key={name}>{name}</li>)}</ul><p>Fokus pengembangan program, bukan skor atau hasil pengukuran kompetensi Anda.</p></div>}
     </div><aside className={styles.scope}><h4>{review?'Ruang lingkup untuk dibahas':'Investasi indikatif'}</h4>
      <p className={styles.price}>{investment?.baseAmountIdr!=null?money(investment.baseAmountIdr):'Disesuaikan setelah konsultasi'}</p>
      {investment&&<><dl><div><dt>Durasi</dt><dd>{investment.duration}</dd></div><div><dt>Kapasitas</dt><dd>{investment.capacity}</dd></div></dl><p className={styles.included}>Termasuk {investment.included.join(' dan ')}.</p><p className={styles.note}>{investment.note}</p></>}
      {program.outputs.length>0&&<><h4>Hasil yang dibawa pulang</h4><ul className={styles.outputs}>{program.outputs.map(text=><li key={text}><Check size={15} aria-hidden="true"/><span>{text}</span></li>)}</ul></>}
      {review&&<p className={styles.note}>Program merupakan salah satu bagian dari pendekatan pengembangan. Kebutuhan proses, dukungan kerja, dan investasi perlu diselaraskan bersama.</p>}
     </aside></div>
     {program.components.length>0&&<details className={styles.details}><summary>Lihat materi dan komponen program</summary><ul>{program.components.map(text=><li key={text}>{text}</li>)}</ul></details>}
    </section>;
   })}</div>:<div className={styles.empty}><h3>Belum ada program yang ditetapkan</h3><p>{advisory.description}</p><a href="mailto:admin@binahub.id">Bahas kebutuhan dengan BinaHub <ArrowRight size={16} aria-hidden="true"/></a></div>}
  </section>
  <section className={styles.section} aria-labelledby="spin-planning-title"><div className={styles.planning}>
   <div><h2 id="spin-planning-title">Sebelum pelaksanaan</h2><p className={styles.intro}>Hal yang perlu dipastikan bersama agar program sesuai kebutuhan.</p><ul className={styles.checklist}>{r.confirmations.map(text=><li key={text}><span className={styles.checkBox} aria-hidden="true"/><span>{text}</span></li>)}</ul><p className={styles.note}>{r.taxNote}</p></div>
   <aside className={styles.next}><h2>Langkah berikutnya</h2><ol><li>Selaraskan sasaran dan prioritas.</li><li>Tentukan peserta, ruang lingkup, dan jadwal.</li><li>Finalisasi proposal dan pelaksanaan.</li></ol><p>Preferensi Anda: {r.nextStep}</p><a className={styles.action} href={r.bookingUrl||'mailto:admin@binahub.id'} {...(r.bookingUrl?{target:'_blank',rel:'noopener noreferrer'}:{})}>{r.bookingUrl?'Jadwalkan konsultasi':'Hubungi tim BinaHub'}<ArrowRight size={17} aria-hidden="true"/></a></aside>
  </div></section>
  <details className={styles.context}><summary>Lihat konteks dan rincian kebutuhan</summary><p>{r.summary.situation}</p><dl>{r.snapshot.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl><p className={styles.note}>Dampak dan konsekuensi berdasarkan informasi responden, belum diverifikasi secara independen.</p></details>
  <footer className={styles.footer}><p>{r.disclaimer}</p><a href="mailto:admin@binahub.id">admin@binahub.id</a><span>BinaHub · People. Learning. Elevated.</span></footer>
 </article>;
}
