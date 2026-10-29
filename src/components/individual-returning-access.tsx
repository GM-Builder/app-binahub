import Link from 'next/link';
import {ArrowRight,FileText,History} from 'lucide-react';
import styles from './individual-packages.module.css';

export function IndividualReturningAccess(){
 return <section className={styles.returning} aria-labelledby="returning-diagnosis-title" id="hasil-sebelumnya">
  <div><h2 id="returning-diagnosis-title">Sudah pernah melakukan diagnosis?</h2><p>Buka hasil atau lanjutkan pengisian individu Anda.</p></div>
  <div className={styles.returningActions}>
   <Link href="/insight/individual/result"><FileText size={18} aria-hidden="true"/><span>Lihat hasil individu</span><ArrowRight size={15} aria-hidden="true"/></Link>
   <Link href="/insight/individual"><History size={18} aria-hidden="true"/><span>Lanjutkan draf individu</span><ArrowRight size={15} aria-hidden="true"/></Link>
  </div>
  <p className={styles.accountHistory}>Memiliki akun BinaHub? <Link href="/insight/individual/history">Riwayat pengisian akun</Link></p>
 </section>;
}
