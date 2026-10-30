import {useEffect,useId,useRef} from 'react';
import {type PetaReportData,petaDate} from '@/lib/peta';
import styles from './peta.module.css';
const descriptions={D:{title:'D — Mendorong penyelesaian',text:'Kecenderungan mengambil keputusan dan menggerakkan pekerjaan menuju hasil.'},I:{title:'I — Membangun pengaruh',text:'Kecenderungan bertukar gagasan dan melibatkan orang lain melalui komunikasi.'},S:{title:'S — Menjaga kerja sama',text:'Kecenderungan menjaga dukungan, kesinambungan, dan kerja sama.'},C:{title:'C — Memeriksa standar',text:'Kecenderungan memperhatikan ketelitian, bukti, dan standar pekerjaan.'}};
export function PetaReport({report,headingLevel=1}:{report:PetaReportData;headingLevel?:1|2}){
 const id=useId(),{result}=report,heading=useRef<HTMLHeadingElement>(null),Heading=headingLevel===1?'h1':'h2';
 useEffect(()=>{heading.current?.focus();},[]);
 return <article className={styles.report} aria-labelledby={id+'-title'}>
  <header className={styles.reportHeader}><Heading ref={heading} tabIndex={-1} id={id+'-title'}>Peta preferensi perilaku kerja Anda</Heading><p>{report.participantCode} · {petaDate(report.submittedAt)} · Versi {result.instrumentVersion}</p>
   <p className={styles.notice}><strong>Hasil pilot, bukan ukuran kompetensi.</strong> Skor menunjukkan pilihan relatif dalam diri Anda, bukan perbandingan antarpeserta atau label kepribadian permanen.</p>
  </header>
  <section className={styles.panel} aria-label="Ringkasan preferensi"><h2>Baca pola Anda secara utuh</h2>
   <p>{result.topDimensions.length===4?'Keempat dimensi memiliki selisih yang setara. Tidak ada satu dimensi tertinggi.':result.topIsTied?'Dimensi '+result.topDimensions.join(', ')+' memiliki selisih tertinggi yang sama. Tidak perlu memaksakan satu tipe tunggal.':'Dimensi '+result.topDimensions.join(', ')+' relatif lebih sering muncul dalam selisih pilihan Anda.'}</p>
   {result.closeTopScores&&result.topDimensions.length!==4&&<p>Skor teratas berdekatan. Pertimbangkan seluruh pola dan konteks pekerjaan Anda.</p>}
   <p>Nilai positif bukan berarti lebih baik, dan nilai negatif bukan berarti kemampuan yang buruk.</p>
   <div className={styles.charts}>
    <figure className={styles.chart} aria-labelledby={id+'-net'} aria-describedby={id+'-table'}><figcaption id={id+'-net'}>Selisih pilihan relatif</figcaption>
     <svg viewBox="0 0 360 240" role="img" aria-label="Selisih paling sesuai dikurangi paling kurang sesuai. Angka lengkap tersedia pada tabel.">
      {[-24,-12,0,12,24].map(n=><g key={n}><line x1={180+n*140/24} x2={180+n*140/24} y1={30} y2={205} stroke={n===0?'#405779':'#dce4ef'} strokeWidth={n===0?1.5:1}/><text x={180+n*140/24} y={225} fontSize={14} textAnchor="middle" fill="currentColor">{n>0?'+'+n:n}</text></g>)}
      {result.rows.map((r,i)=><g key={r.dimension}><text x={8} y={62+i*43} fontSize={16} fill="currentColor">{r.dimension}</text><rect data-net={r.net} x={r.net<0?180+r.net*140/24:180} y={44+i*43} width={Math.abs(r.net)*140/24} height={25} rx={3} fill={r.net<0?'#647ca5':'#0b2c6b'}/><text x={355} y={61+i*43} textAnchor="end" fontSize={14} fill="currentColor">{r.net>0?'+'+r.net:r.net}</text></g>)}
     </svg><p>Rentang tetap −24 hingga +24. Garis tengah menunjukkan nol.</p>
    </figure>
    <figure className={styles.chart} aria-labelledby={id+'-counts'} aria-describedby={id+'-table'}><figcaption id={id+'-counts'}>Frekuensi pilihan per dimensi</figcaption>
     <p>Baris atas: paling sesuai · Baris bawah: paling kurang sesuai</p>
     <svg viewBox="0 0 360 240" role="img" aria-label="Frekuensi dua pilihan pada empat dimensi, rentang nol sampai 24. Angka lengkap tersedia pada tabel.">
      {[0,6,12,18,24].map(n=><g key={n}><line x1={40+n*280/24} x2={40+n*280/24} y1={10} y2={202} stroke="#dce4ef"/><text x={40+n*280/24} y={225} fontSize={14} textAnchor="middle" fill="currentColor">{n}</text></g>)}
      {result.rows.map((r,i)=><g key={r.dimension}><text x={8} y={36+i*48} fontSize={16} fill="currentColor">{r.dimension}</text>{[{value:r.most,color:'#0b2c6b'},{value:r.least,color:'#647ca5'}].map((bar,j)=><g key={j}><rect data-count={bar.value} x={40} y={15+i*48+j*18} width={bar.value*280/24} height={13} rx={2} fill={bar.color}/><text x={355} textAnchor="end" y={27+i*48+j*18} fontSize={14} fill="currentColor">{bar.value}</text></g>)}</g>)}
     </svg><p>Setiap kelompok berisi dua frekuensi, bukan dua nilai kemampuan.</p>
    </figure>
   </div>
   <div className={styles.tableWrap} id={id+'-table'}><table className={styles.table}><caption>Rincian angka pilihan</caption><thead><tr><th scope="col">Dimensi</th><th scope="col">Paling sesuai</th><th scope="col">Paling kurang sesuai</th><th scope="col">Selisih</th></tr></thead><tbody>{result.rows.map(r=><tr key={r.dimension}><th scope="row">{r.dimension}</th><td>{r.most}</td><td>{r.least}</td><td>{r.net>0?'+'+r.net:r.net}</td></tr>)}</tbody></table></div>
   <div className={styles.dimensions}>{result.rows.map(r=><section key={r.dimension}><h3>{descriptions[r.dimension].title}</h3><p>{descriptions[r.dimension].text}</p></section>)}</div>
  </section>
  <section className={styles.panel} style={{marginTop:24}}><h2>Bawa hasil ini ke situasi nyata</h2><ol className={styles.reflections}><li>Dalam situasi apa cara kerja ini paling membantu saya?</li><li>Kapan saya perlu mencoba pendekatan berbeda?</li><li>Langkah konkret apa yang akan saya lakukan dalam dua minggu ke depan?</li></ol></section>
 </article>;
}
