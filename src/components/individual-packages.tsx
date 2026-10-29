import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight,Check,LockKeyhole} from 'lucide-react';
import {DiagnosisShell} from './diagnosis-shell';
import {IndividualReturningAccess} from './individual-returning-access';
import styles from './individual-packages.module.css';

export const individualPackages=[
 {name:'Personal Effectiveness',price:59000},
 {name:'Relationship Management',price:89000},
 {name:'Leadership Effectiveness',price:69000},
 {name:'Work & Business Results',price:119000},
 {name:'Paket lengkap',price:299000},
];
export function IndividualPackages({freeHref='/insight/individual'}:{freeHref?:string}){
 const complete=individualPackages[individualPackages.length-1];
 const categories=individualPackages.slice(0,-1);
 const money=(price:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(price);
 return <DiagnosisShell organization editorial><div className={styles.page}><div className={styles.container}>
  <header className={styles.intro}>
   <h1>Pilih Self Diagnostic Anda.</h1>
   <div><p>Mulai mengenali kebutuhan pengembangan diri, lalu pilih fokus yang sesuai dengan tujuan Anda.</p>
    <p className={styles.availability} id="package-availability">Paket gratis tersedia sekarang. Paket berbayar belum dapat dibeli.</p>
   </div>
   <figure className={styles.introArt} aria-hidden="true"><Image src="/diagnosis/hero-competencies.webp" alt="" fill priority sizes="(max-width:767px) 90px, 220px"/></figure>
  </header>
  <IndividualReturningAccess/>

  <div className={styles.featuredPlans}>
   <section aria-labelledby="free-diagnostic" className={styles.freePlan}>
    <div className={styles.planHeading}><h2 id="free-diagnostic">Self Diagnostic gratis</h2><span className={styles.available}>Tersedia</span></div>
    <p className={styles.description}>Langkah awal untuk mengenali tiga Area Personal Effectiveness.</p>
    <p className={styles.price}><span className={styles.currency}>Rp</span><span>0</span></p>
    <p className={styles.scopeLabel}>Area yang dapat Anda jelajahi</p>
    <ul className={styles.freeAreas}>{['Self-Development','Adaptability','Pressure Management'].map(name=><li key={name}><Check size={16} aria-hidden="true"/>{name}</li>)}</ul>
    <div className={styles.freeAction}><Link href={freeHref} className={styles.primary}>Mulai Self Diagnostic gratis<ArrowRight size={17} aria-hidden="true"/></Link><p>Tanpa membuat akun.</p></div>
   </section>

   <section aria-labelledby="complete-diagnostic" className={styles.completePlan}>
    <h2 id="complete-diagnostic">{complete.name}</h2>
    <p className={styles.description}>Pilihan pengembangan lintas Area dalam satu paket.</p>
    <p className={styles.price}>{money(complete.price)}</p>
    <p className={styles.scopeLabel}>Kategori pengembangan</p>
    <ul className={styles.completeAreas}>{categories.map(pack=><li key={pack.name}><Check size={16} aria-hidden="true"/>{pack.name}</li>)}</ul>
    <button type="button" disabled className={styles.locked} aria-describedby="package-availability" aria-label={'Coming soon: '+complete.name}><LockKeyhole size={15} aria-hidden="true"/>Coming soon</button>
   </section>
  </div>

  <section className={styles.categories} aria-labelledby="paid-diagnostics" aria-describedby="package-availability">
   <div className={styles.categoryIntro}><h2 id="paid-diagnostics">Pilih fokus pengembangan Anda.</h2><p>Jelajahi pilihan paket berdasarkan Area yang ingin Anda kembangkan.</p></div>
   <ul className={styles.categoryGrid}>
    {categories.map((pack,index)=><li key={pack.name} className={styles.categoryPlan}>
     <h3 id={'category-'+index}>{pack.name}</h3>
     <p className={styles.categoryPrice}>{money(pack.price)}</p>
     <button type="button" disabled className={styles.locked} aria-describedby="package-availability" aria-label={'Coming soon: '+pack.name}><LockKeyhole size={15} aria-hidden="true"/>Coming soon</button>
    </li>)}
   </ul>
  </section>
  <footer className={styles.footer}><p>Self Diagnostic membantu refleksi dan pengembangan diri, bukan diagnosis klinis.</p><p>Butuh bantuan? <a href="mailto:admin@binahub.id">Hubungi tim BinaHub<ArrowRight size={14} aria-hidden="true"/></a></p></footer>
 </div></div></DiagnosisShell>;
}
