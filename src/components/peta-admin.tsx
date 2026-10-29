"use client";
import {useCallback,useEffect,useState} from 'react';
import {Copy,RefreshCw} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {petaDate,petaRequest,type PetaReportData} from '@/lib/peta';
import {PetaReport} from './peta-report';
import styles from './peta.module.css';
type Workspace={id:string;name:string;consultantAccess:boolean;privacyReference:string};
type Invitation={id:string;workspaceId:string;participantCode:string;purpose:string;expiresAt:string;status:string};
type Session={id:string;workspaceId:string;participantCode:string;status:string;completedBlocks:number;retentionUntil:string;submittedAt:string|null;canReadResult:boolean;instrumentVersion:string;consentVersion:string;consentedAt:string;reviewConsent:boolean};
type AccessEvent={id:string;workspaceId:string;participantCode:string|null;event:string;createdAt:string;adminAction:boolean};
type Dashboard={sourceReady:boolean;workspaces:Workspace[];invitations:Invitation[];sessions:Session[];audit:AccessEvent[]};
const statusText:Record<string,string>={invited:'Belum dimulai',used:'Sudah digunakan',expired:'Kedaluwarsa',revoked:'Dicabut',in_progress:'Sedang diisi',submitted:'Selesai'};
const eventText:Record<string,string>={workspace_created:'Ruang dibuat',invitation_created:'Undangan dibuat',consented:'Persetujuan peserta dicatat',access_recovered:'Akses peserta dipulihkan',submitted:'Jawaban akhir dikirim',participant_result_opened:'Peserta membuka hasil',consultant_result_opened:'Konsultan membuka hasil berizin',recovery_issued_after_verification:'Tautan pemulihan dibuat setelah verifikasi',invitation_revoked:'Undangan dicabut',revoke:'Akses sesi dicabut',erase:'Data sesi dihapus',retention_erased:'Data melewati retensi dihapus'};
async function adminRequest<T>(path='',input?:unknown){const {data}=await supabase.auth.getSession();if(!data.session)throw Error('Sesi admin berakhir. Silakan masuk kembali.');return petaRequest<T>('admin'+path,input?'POST':'GET',input,{Authorization:'Bearer '+data.session.access_token});}
export function PetaAdmin(){
 const [data,setData]=useState<Dashboard|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[link,setLink]=useState(''),[linkExpiry,setLinkExpiry]=useState(''),[copied,setCopied]=useState(false),[report,setReport]=useState<PetaReportData|null>(null);
 const [name,setName]=useState(''),[reference,setReference]=useState(''),[approved,setApproved]=useState(false),[consultant,setConsultant]=useState(false),[workspace,setWorkspace]=useState(''),[code,setCode]=useState(''),[filter,setFilter]=useState('all');
 const load=useCallback(async()=>{setLoading(true);try{setData(await adminRequest<Dashboard>());setError('');}catch(e){setError(e instanceof Error?e.message:'Data belum dapat dimuat.');}finally{setLoading(false);}},[]);
 useEffect(()=>{let live=true;void adminRequest<Dashboard>().then(value=>{if(live)setData(value);}).catch(e=>{if(live)setError(e instanceof Error?e.message:'Data belum dapat dimuat.');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};},[]);
 async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(e){setError(e instanceof Error?e.message:'Tindakan belum dapat diselesaikan.');}finally{setBusy(false);}}
 async function createWorkspace(){await run(async()=>{const created=await adminRequest<{id:string}>('/workspaces',{name,privacyReference:reference,consultantAccess:consultant,privacyApproved:approved,contentRightsConfirmed:approved,pilotAcknowledged:approved});setWorkspace(created.id);setName('');setReference('');setApproved(false);await load();});}
 async function invite(){await run(async()=>{const result=await adminRequest<{invitationPath:string;expiresAt:string}>('/invitations',{workspaceId:workspace,participantCode:code});setLink(new URL(result.invitationPath,window.location.origin).href);setLinkExpiry(result.expiresAt);setCopied(false);setCode('');await load();});}
 async function sessionAction(s:Session,action:'result'|'recover'|'revoke'|'erase'){
  let verified=false;
  if(action==='recover'){verified=window.confirm('Identitas peserta sudah Anda verifikasi melalui saluran yang disepakati? Tautan baru berlaku 30 menit dan menggantikan akses perangkat lama setelah digunakan.');if(!verified)return;}
  if(action==='erase'){verified=window.prompt('Hapus jawaban dan hasil PETA dari penyimpanan utama? Tindakan ini tidak dapat dibatalkan. Ketik kode peserta: '+s.participantCode)===s.participantCode;if(!verified)return;}
  if(action==='revoke'&&!window.confirm('Cabut akses peserta '+s.participantCode+'? Data tersimpan tidak langsung dihapus.'))return;
  await run(async()=>{const result=await adminRequest<{report?:PetaReportData;invitationPath?:string;expiresAt?:string}>('/session-action',{id:s.id,action,verified});
   if(result.report)setReport(result.report);if(result.invitationPath){setLink(new URL(result.invitationPath,window.location.origin).href);setLinkExpiry(result.expiresAt||'');setCopied(false);}if(action==='erase'||action==='revoke')setReport(null);await load();});
 }
 const currentWorkspace=data?.workspaces.find(w=>w.id===workspace),visible=(data?.sessions||[]).filter(s=>filter==='all'||s.workspaceId===filter);
 return <div className={styles.admin}>
  <p className={styles.notice}>Pilot melalui undangan · 24 situasi · retensi satu tahun. Tidak terhubung ke penjualan, AI, laporan kelompok, atau pembagian hasil otomatis ke perusahaan.</p>
  <div className={styles.actions}><p className={styles.fine}>Ruang dan peserta yang tampil hanya yang Anda kelola. Daftar dibatasi 100 entri terbaru per jenis.</p><button className={styles.secondary} onClick={()=>void load()} disabled={loading||busy}><RefreshCw size={15} aria-hidden="true"/>Perbarui</button></div>
  {error&&<div role="alert" className={styles.error}>{error}<p>Jika instalasi belum tersedia: siapkan SQL 76, sumber terenkripsi SQL 76B, dan konfigurasi runtime API sesuai panduan PETA.</p></div>}
  {loading&&!data&&<p role="status" className={styles.status}>Memuat pengelolaan PETA…</p>}
  {data&&!data.sourceReady&&<p className={styles.error}>Sumber PETA atau kunci runtime belum siap. Undangan baru dinonaktifkan; tidak ada pengisian yang dibuka tanpa sumber tervalidasi.</p>}
  <div className={styles.adminCols}>
   <section className={styles.panel}><h2>Siapkan ruang PETA</h2><p>Gunakan satu ruang per kegiatan atau organisasi. Simpan nama kegiatan, bukan nama peserta.</p><form className={styles.adminForm} onSubmit={e=>{e.preventDefault();void createWorkspace();}}>
    <label>Nama kegiatan atau organisasi<input value={name} onChange={e=>setName(e.target.value)} maxLength={100} required/></label>
    <label>Acuan pemberitahuan privasi<textarea value={reference} onChange={e=>setReference(e.target.value)} minLength={10} maxLength={500} rows={3} required placeholder="Contoh: Kebijakan PETA kegiatan internal, disahkan 29 Oktober 2026"/></label>
    <label className={styles.check} style={{display:'flex'}}><input type="checkbox" checked={consultant} onChange={e=>setConsultant(e.target.checked)}/><span>Tetapkan akun saya sebagai konsultan peninjau ruang ini. Hasil hanya dapat dibuka jika peserta memberikan izin terpisah.</span></label>
    <label className={styles.check} style={{display:'flex'}}><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/><span>Saya memastikan hak penggunaan konten dan pemberitahuan privasi telah disetujui, serta memahami status pilot dan retensi satu tahun. Ini bukan pengesahan validitas psikometrik.</span></label>
    <button type="submit" className={styles.primary} disabled={busy||!approved||!data}>Simpan ruang</button>
   </form></section>
   <section className={styles.panel}><h2>Buat undangan peserta</h2><p>Gunakan kode acak, bukan nama, email, nomor pegawai, atau nomor telepon. Kirim tautan melalui saluran pribadi yang sudah disepakati.</p><form className={styles.adminForm} onSubmit={e=>{e.preventDefault();void invite();}}>
    <label>Ruang<select value={workspace} onChange={e=>setWorkspace(e.target.value)} required><option value="">Pilih ruang</option>{data?.workspaces.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></label>
    <label>Kode peserta<input value={code} onChange={e=>setCode(e.target.value)} pattern="[A-Za-z0-9_-]{1,64}" maxLength={64} required placeholder="Contoh: PETA-7R2K"/></label>
    {currentWorkspace&&<p className={styles.fine}>Akses hasil: {currentWorkspace.consultantAccess?'peserta, serta akun Anda jika peserta memberi izin':'peserta saja'}. Retensi satu tahun sejak sesi pertama.</p>}
    <button type="submit" className={styles.primary} disabled={busy||!workspace||!data?.sourceReady}>Buat tautan undangan</button>
   </form>{!data?.workspaces.length&&<p className={styles.fine}>Buat ruang yang disetujui terlebih dahulu.</p>}</section>
  </div>
  {link&&<section className={styles.panel} aria-label="Tautan baru"><h2>Tautan pribadi siap dibagikan</h2><p>Tautan ditampilkan sekali di sesi halaman ini. Jangan bagikan di grup atau saluran publik.</p><div className={styles.linkOutput}>{link}</div><div className={styles.actions}><p className={styles.fine}>{linkExpiry?'Berlaku sampai '+new Date(linkExpiry).toLocaleString('id-ID'):''}</p><button className={styles.secondary} onClick={()=>void navigator.clipboard.writeText(link).then(()=>setCopied(true)).catch(()=>setError('Salin manual tautan yang tampil. Clipboard tidak tersedia.'))}><Copy size={15} aria-hidden="true"/>{copied?'Tersalin':'Salin tautan'}</button><button className={styles.textButton} onClick={()=>setLink('')}>Tutup tautan</button></div></section>}
  <section className={styles.panel} style={{marginTop:24}}><h2>Pengisian peserta</h2><label className={styles.adminForm}>Tampilkan ruang<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Semua ruang saya</option>{data?.workspaces.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></label>
   {!visible.length?<p className={styles.status}>Belum ada sesi pada pilihan ini. Sesi dibuat setelah peserta menyetujui penggunaan data melalui undangan.</p>:<ul className={styles.adminList}>{visible.map(s=><li key={s.id}><h3>{s.participantCode} · {statusText[s.status]||s.status}</h3><p>{s.completedBlocks}/24 situasi lengkap · batas simpan {petaDate(s.retentionUntil)}</p><p>Instrumen {s.instrumentVersion} · Persetujuan {s.consentVersion}, {petaDate(s.consentedAt)} · Izin tinjau konsultan: {s.reviewConsent?'diberikan':'tidak diberikan'}.</p><div className={styles.smallActions}>
    {s.canReadResult?<button className={styles.textButton} disabled={busy} onClick={()=>void sessionAction(s,'result')}>Buka hasil berizin</button>:s.status==='submitted'&&<span className={styles.fine}>Hasil tidak dibuka: tidak ada izin tinjau untuk akun Anda.</span>}
    {!['expired','revoked'].includes(s.status)&&<><button className={styles.textButton} disabled={busy} onClick={()=>void sessionAction(s,'recover')}>Pulihkan akses</button><button className={styles.textButton} disabled={busy} onClick={()=>void sessionAction(s,'revoke')}>Cabut akses</button></>}
    <button className={styles.textButton} disabled={busy} onClick={()=>void sessionAction(s,'erase')}>Hapus data PETA</button></div></li>)}</ul>}
  </section>
  <details className={styles.panel} style={{marginTop:24}}><summary className={styles.textButton}>Riwayat undangan terbaru</summary><ul className={styles.adminList}>{data?.invitations.filter(i=>filter==='all'||i.workspaceId===filter).map(i=><li key={i.id}><h3>{i.participantCode} · {statusText[i.status]||i.status}</h3><p>{i.purpose==='resume'?'Pemulihan':'Undangan awal'} · batas tautan {petaDate(i.expiresAt)}</p>{i.status==='invited'&&<button className={styles.textButton} disabled={busy} onClick={()=>{if(window.confirm('Cabut undangan ini?'))void run(async()=>{await adminRequest('/invitation-revoke',{id:i.id});await load();});}}>Cabut undangan</button>}</li>)}</ul></details>
  <details className={styles.panel} style={{marginTop:24}}><summary className={styles.textButton}>Riwayat akses dan tindakan</summary><p>100 kejadian terbaru pada ruang yang Anda kelola. Tidak memuat isi jawaban, hasil, atau token.</p><ul className={styles.adminList}>{data?.audit?.filter(a=>filter==='all'||a.workspaceId===filter).map(a=><li key={a.id}><h3>{eventText[a.event]||'Kejadian PETA'}</h3><p>{new Date(a.createdAt).toLocaleString('id-ID')}{a.participantCode?' · '+a.participantCode:''}{a.adminAction?' · oleh admin':''}</p></li>)}</ul>{!data?.audit?.length&&<p className={styles.fine}>Belum ada catatan akses pada ruang Anda.</p>}</details>
  {report&&<section style={{marginTop:32}} aria-label="Hasil peserta berizin"><PetaReport report={report} headingLevel={2}/></section>}
  <p className={styles.auditNote}>Pembukaan hasil dan tindakan admin dicatat tanpa isi jawaban atau token. Pembersihan retensi memerlukan worker terjadwal; akses data yang melewati satu tahun tetap ditolak meskipun worker belum berjalan. Penghapusan dari backup mengikuti kebijakan penyimpanan backup operator.</p>
 </div>;
}
