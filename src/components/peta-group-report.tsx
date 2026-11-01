"use client";
import {useEffect,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {petaDate,petaRequest,type PetaGroupReportData} from '@/lib/peta';
import {PetaPDFDownload} from './peta-pdf-download';
import styles from './peta-admin.module.css';

const dimensions={D:'Mendorong penyelesaian',I:'Membangun pengaruh',S:'Menjaga kerja sama',C:'Memeriksa standar'};
export function PetaGroupReport({workspaceId}:{workspaceId?:string}){
 const [data,setData]=useState<PetaGroupReportData|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const requestId=useRef(0);
 useEffect(()=>()=>{requestId.current++;},[workspaceId]);
 async function load(){
  if(!workspaceId)return;const current=++requestId.current;setLoading(true);setData(null);setError('');
  try{
   const {data:auth}=await supabase.auth.getSession();if(!auth.session)throw Error('Sesi admin berakhir. Silakan masuk kembali.');
   const response=await petaRequest<{report:PetaGroupReportData}>('admin/reports/group','POST',{workspaceId},{Authorization:'Bearer '+auth.session.access_token});
   if(current===requestId.current)setData(response.report);
  }catch(e){if(current===requestId.current)setError(e instanceof Error?e.message:'Laporan belum tersedia. Silakan coba kembali.');}
  finally{if(current===requestId.current)setLoading(false);}
 }
 const pattern:Record<keyof typeof dimensions,number>={D:0,I:0,S:0,C:0};let balanced=0,tied=0;
 for(const member of data?.members||[]){const rows=member.report.result.rows,max=Math.max(...rows.map(r=>r.net)),tops=rows.filter(r=>r.net===max);if(tops.length===4){balanced++;continue;}if(tops.length>1)tied++;for(const r of tops)pattern[r.dimension]++;}
 return <section className={styles.participants} aria-labelledby="peta-group-title" aria-busy={loading}>
  <div className={styles.sectionHeading}><div><h2 id="peta-group-title">Laporan grup PETA</h2><p>Ringkasan satu program, khusus internal admin pendamping.</p></div>{workspaceId&&<button type="button" className={styles.secondary} disabled={loading} onClick={()=>void load()}>{loading?'Menyiapkan laporan…':data?'Perbarui laporan':'Siapkan laporan grup'}</button>}</div>
  {!workspaceId?<div className={styles.empty}><h3>Pilih satu program terlebih dahulu</h3><p>Gunakan pilihan program di atas. Hasil dari program berbeda tidak dicampur dalam satu laporan.</p></div>:<>
   <p className={styles.footnote}>Mencakup seluruh hasil yang memenuhi syarat pada program ini, bukan hanya halaman daftar atau filter pencarian. Hanya hasil selesai, masih berlaku, dan diizinkan untuk ditinjau yang disertakan.</p>
   {loading&&<p role="status" className={styles.footnote}>Memeriksa hasil dan izin peninjauan peserta…</p>}
   {error&&<p role="alert" className={styles.error}>{error}</p>}
   {data&&<>
    <dl className={styles.counts}><div><dt>Pengisian tercatat</dt><dd>{data.counts.total}</dd></div><div><dt>Hasil disertakan</dt><dd>{data.counts.included}</dd></div><div><dt>Tidak disertakan</dt><dd>{data.counts.total-data.counts.included}</dd></div></dl>
    <p className={styles.footnote}>Belum selesai: {data.counts.unfinished}. Peninjauan tidak diizinkan/tidak tersedia: {data.counts.restricted}. Akses dicabut, kedaluwarsa, atau hasil tidak tersedia: {data.counts.unavailable}.</p>
    {!data.members.length?<div className={styles.empty}><h3>Belum ada hasil yang dapat disertakan</h3><p>Peserta perlu menyelesaikan PETA dan memberikan izin peninjauan. Tidak ada skor kosong yang dihitung sebagai nol.</p><button type="button" className={styles.secondary} onClick={()=>void load()}>Periksa kembali</button></div>:<>
     <div className={styles.reportActions}><p>Data diperiksa pada {petaDate(data.issuedAt)}. Izin dan kelayakan diperiksa ulang saat PDF dibuat.</p><PetaPDFDownload target={{kind:'group',workspaceId}}/></div>
     <h3 className={styles.groupHeading}>Kecenderungan yang muncul dalam kelompok</h3>
     <ul className={styles.patternList}>{Object.entries(dimensions).map(([d,label])=><li key={d}><span><strong>{d}</strong> {label}</span><span>{pattern[d as keyof typeof dimensions]} peserta</span></li>)}</ul>
     <p className={styles.footnote}>Hitungan menunjukkan dimensi dengan selisih tertinggi dalam diri peserta, bukan kemampuan. Pola seri di dua atau tiga dimensi dihitung pada setiap dimensi terkait ({tied} peserta). Pola berimbang di keempat dimensi dicatat terpisah ({balanced} peserta); total empat baris tidak harus sama dengan jumlah peserta.</p>
     <div className={styles.groupTable} tabIndex={0} role="region" aria-label="Rincian hasil grup, geser horizontal jika diperlukan"><table><caption>Rincian hasil peserta · urutan alfabetis, bukan peringkat</caption><thead><tr><th scope="col">Peserta</th>{Object.keys(dimensions).map(d=><th key={d} scope="col">{d}</th>)}</tr></thead><tbody>{data.members.map((m,i)=><tr key={m.report.participantCode+':'+i}><th scope="row">{m.participantName||'Peserta '+(i+1)}</th>{Object.keys(dimensions).map(d=>{const r=m.report.result.rows.find(row=>row.dimension===d)!;return <td key={d}>{r.most} / {r.least} / {r.net>0?'+'+r.net:r.net}</td>;})}</tr>)}</tbody></table></div>
     <p className={styles.footnote}>Setiap sel: paling sesuai / paling kurang sesuai / selisih. Bukan nilai kemampuan atau tipe kelompok. PDF memuat hasil pribadi; jangan dibagikan kepada perusahaan atau pihak lain tanpa dasar dan izin yang sesuai.</p>
    </>}
   </>}
  </>}
 </section>;
}
