import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './diagnosis.module.css';

export function DiagnosisShell({ children, organization = false, editorial = false }: { children: ReactNode; organization?: boolean; editorial?:boolean }) {
  return (
    <main className={`${styles.shell} ${editorial ? styles.editorial : ''}`}>
      <div className={styles.ambient} aria-hidden="true">
        <span className={styles.waveLeft} />
        <span className={styles.waveRight} />
        <span className={styles.waveBottom} />
      </div>
      <header className={styles.header}>
        <div className={styles.headerInner + (organization ? '' : ' ' + styles.choiceHeader)}>
          <Link href={organization ? '/diagnose' : 'https://binahub.id'} aria-label="BinaHub — beranda" className={styles.brand}>
            <Image src="/full-logo.png" width={126} height={36} alt="BinaHub" unoptimized className={styles.logo} />
          </Link>
          <Link href={organization ? '/diagnose' : 'https://binahub.id'} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            {organization ? 'Pilihan diagnosis' : 'Ke website'}
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}
