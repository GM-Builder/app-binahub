"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Check,ChevronDown} from 'lucide-react';
import {DiagnosisShell} from './diagnosis-shell';
import {PetaReport} from './peta-report';
import {petaParticipantRequest,PetaRequestError,validPetaPair,type PetaPair,type PetaSession,type PetaInvitation,type PetaBlock,type PetaReportData} from '@/lib/peta';
import {PetaAnswerSync,type PetaSaveState} from '@/lib/peta-answer-sync';
import styles from './peta.module.css';

const empty=():PetaPair=>({most:null,least:null});
const practice:PetaBlock={id:'practice',order:0,context:'Latihan — menyiapkan kegiatan bersama',options:[{id:'practice-A',code:'A',text:'Saya mengajak orang lain bertukar gagasan.'},{id:'practice-B',code:'B',text:'Saya menentukan apa yang perlu diselesaikan.'},{id:'practice-C',code:'C',text:'Saya membantu menjaga kegiatan berjalan teratur.'},{id:'practice-D',code:'D',text:'Saya memeriksa informasi yang diperlukan.'}]};
const saveLabels:Record<PetaSaveState,string>={saved:'Semua jawaban tersimpan.',pending:'Jawaban menunggu disimpan. Anda dapat melanjutkan.',saving:'Menyimpan jawaban di latar belakang…',error:'Ada jawaban yang belum tersimpan. Coba simpan kembali sebelum menutup halaman.'};
export function PetaSelector({block,pair,onChange,disabled=false}:{block:PetaBlock;pair:PetaPair;onChange:(pair:PetaPair)=>void;disabled?:boolean}){
 return <table className={styles.selector}><caption>Pilih satu pada setiap kolom. Pilihan yang sama tidak dapat digunakan untuk keduanya.</caption><thead><tr><th scope="col">Pernyataan</th><th scope="col">1. Paling sesuai</th><th scope="col">2. Paling kurang sesuai</th></tr></thead><tbody>{block.options.map(option=><tr key={option.code}><td>{option.text}</td>{(['most','least'] as const).map(kind=><td key={kind}><label><input type="radio" name={block.id+'-'+kind} value={option.code} checked={pair[kind]===option.code} disabled={disabled||pair[kind==='most'?'least':'most']===option.code} aria-label={(kind==='most'?'Paling sesuai dengan saya: ':'Paling kurang sesuai dengan saya: ')+option.text} onChange={()=>onChange({...pair,[kind]:option.code})}/></label></td>)}</tr>)}</tbody></table>;
}
export function PetaJourney({resultOnly=false,programMode=false}:{resultOnly?:boolean;programMode?:boolean}){
 const [phase,setPhase]=useState<'loading'|'welcome'|'consent'|'practice'|'questions'|'review'|'result'>('loading');
 const [invitation,setInvitation]=useState<PetaInvitation|null>(null),[session,setSession]=useState<PetaSession|null>(null),[report,setReport]=useState<PetaReportData|null>(null);
 const [answers,setAnswers]=useState<Record<string,PetaPair>>({}),[index,setIndex]=useState(0),[practiceAnswer,setPracticeAnswer]=useState(empty);
 const [consent,setConsent]=useState(false),[reviewConsent,setReviewConsent]=useState(false),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saveState,setSaveState]=useState<PetaSaveState>('saved'),[direction,setDirection]=useState('forward');
 const token=useRef(''),csrf=useRef(''),current=useRef<PetaSession|null>(null),sync=useRef<PetaAnswerSync|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),submission=useRef(''),heading=useRef<HTMLHeadingElement>(null),alive=useRef(true);
 const request=useCallback(<T,>(path:string,method='GET',input?:unknown,headers:Record<string,string>={})=>petaParticipantRequest<T>(programMode,path,method,input,headers),[programMode]);
 const showError=useCallback((value:unknown)=>{if(alive.current)setError(value instanceof Error?value.message:'Terjadi kendala. Silakan coba lagi.');},[]);
 const apply=useCallback((s:PetaSession)=>{
  sync.current?.dispose();current.current=s;setSession(s);setAnswers(s.answers);setSaveState('saved');
  const next=s.blocks.findIndex(b=>!validPetaPair(s.answers[b.id]));setIndex(next<0?0:next);
  sync.current=new PetaAnswerSync(s,{
   save:async(revision,blockId,pair)=>(await request<{session:PetaSession}>('answer','PUT',{blockId,...pair},{'X-CSRF-Token':csrf.current,'If-Match':String(revision)})).session,
   read:async()=>(await request<{session:PetaSession}>('session')).session,
   state:value=>{if(alive.current){setSaveState(value);if(value==='saved')setError('');}},
   session:value=>{current.current=value;if(alive.current)setSession(value);},
  });
 },[request]);
 const loadResult=useCallback(async()=>{const data=await request<{report:PetaReportData}>('result');if(alive.current){setReport(data.report);setPhase('result');}},[request]);
 const resume=useCallback(async()=>{
  const data=await request<{session:PetaSession;csrfToken:string}>(programMode?'program/resume':'session',programMode?'POST':'GET');
  if(!alive.current)return;csrf.current=data.csrfToken;apply(data.session);
  if(data.session.status==='submitted')await loadResult();else setPhase(Object.keys(data.session.answers).length?'questions':'practice');
 },[apply,loadResult,programMode,request]);
 useEffect(()=>{
  alive.current=true;const fragment=new URLSearchParams(window.location.hash.slice(1));const provided=fragment.get('invite');
  if(provided&&!programMode){token.current=provided;window.history.replaceState(null,'',window.location.pathname+window.location.search);}
  void (async()=>{try{
   if(programMode){
    const data=await request<{invitation:PetaInvitation;hasSession:boolean}>('program');
    if(!alive.current)return;
    if(data.hasSession)await resume();else{setInvitation(data.invitation);setPhase('consent');}
   }else if(provided){
    if(!/^[a-f0-9]{64}$/.test(provided))throw Error('Tautan tidak berlaku. Hubungi penyelenggara.');
    const data=await request<{invitation:PetaInvitation}>('invitation','POST',{token:provided});
    if(alive.current){setInvitation(data.invitation);setPhase('consent');}
   }else await resume();
  }catch(e){if(!alive.current)return;setPhase('welcome');if(programMode||provided||resultOnly||!(e instanceof PetaRequestError)||e.code!=='PETA_SESSION_REQUIRED')showError(e);}})();
  const warn=(event:BeforeUnloadEvent)=>{if(sync.current?.dirty){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',warn);
  return()=>{alive.current=false;sync.current?.dispose();if(timer.current)clearTimeout(timer.current);window.removeEventListener('beforeunload',warn);};
 },[programMode,request,resultOnly,resume,showError]);
 useEffect(()=>{if(phase!=='loading')heading.current?.focus();},[phase,index]);
 const flush=useCallback(()=>{
  if(timer.current){clearTimeout(timer.current);timer.current=null;}
  return sync.current?.flush()??Promise.resolve();
 },[]);
 function choose(block:PetaBlock,pair:PetaPair){
  setAnswers(old=>({...old,[block.id]:pair}));sync.current?.enqueue(block.id,pair);
  if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void flush().catch(showError),180);
 }
 async function begin(){
  if(!consent||!invitation||busy)return;setBusy(true);setError('');
  try{
   const data=await request<{session:PetaSession;csrfToken:string}>(programMode?'program/start':'start','POST',{...(!programMode?{token:token.current}:{}),consentVersion:invitation.consentVersion,consentAccepted:true,reviewConsent});
   token.current='';csrf.current=data.csrfToken;apply(data.session);
   if(data.session.status==='submitted')await loadResult();else setPhase(Object.keys(data.session.answers).length?'questions':'practice');
  }catch(e){showError(e);}finally{setBusy(false);}
 }
 function next(){
  if(!validPetaPair(answers[session!.blocks[index].id]))return;
  setDirection('forward');if(index===23)setPhase('review');else setIndex(i=>Math.min(i+1,23));
  void flush().catch(showError);
 }
 function back(){setDirection('back');setIndex(i=>Math.max(0,i-1));}
 async function submit(){
  if(!confirm||busy)return;setBusy(true);setError('');
  try{
   await flush();submission.current||=crypto.randomUUID();
   await request('submit','POST',undefined,{'X-CSRF-Token':csrf.current,'If-Match':String(current.current!.revision),'Idempotency-Key':submission.current});
   await loadResult();
  }catch(e){showError(e);}finally{setBusy(false);}
 }
 const completed=session?.blocks.filter(b=>validPetaPair(answers[b.id])).length||0,block=session?.blocks[index];
 return <DiagnosisShell organization editorial><div className={styles.page}>
  {programMode&&<Link className={styles.textButton} href="/client/program"><ArrowLeft size={15} aria-hidden="true"/>Kembali ke program</Link>}
  {phase!=='result'&&<header className={styles.intro}><h1 ref={heading} tabIndex={-1}>{phase==='questions'?block?.context:phase==='review'?'Periksa pilihan Anda.':phase==='practice'?'Coba satu situasi terlebih dahulu.':'Kenali kecenderungan cara Anda bekerja.'}</h1>
   <p>{phase==='questions'?'Pilih berdasarkan kebiasaan Anda, bukan jawaban yang terasa paling ideal.':phase==='practice'?'Latihan ini tidak dihitung dan tidak disimpan sebagai jawaban resmi.':phase==='review'?'Anda masih dapat mengubah pilihan sebelum mengirimkan jawaban akhir.':'Refleksikan pilihan perilaku Anda dalam 24 situasi kerja. Hasilnya menggambarkan kecenderungan Anda, bukan penilaian kemampuan atau label kepribadian permanen.'}</p>
   {['welcome','consent','loading'].includes(phase)&&<><p className={styles.brandName}>PETA · Pemetaan Tabiat</p><p className={styles.tagline}>Developed using a DISC-based behavioral framework.</p></>}
  </header>}
  <div className={phase==='result'?'':styles.task}>
   {error&&<div className={styles.error} role="alert"><p>{error}</p>{saveState==='error'&&<div className={styles.smallActions}>
    <button className={styles.textButton} disabled={busy} onClick={()=>void flush().then(()=>setError('')).catch(showError)}>Coba simpan kembali</button>
    <button className={styles.textButton} disabled={busy} onClick={()=>{if(window.confirm('Muat jawaban tersimpan? Pilihan yang belum tersimpan pada halaman ini akan diganti.')){if(timer.current)clearTimeout(timer.current);sync.current?.dispose();void resume().then(()=>setError('')).catch(showError);}}}>Muat versi tersimpan</button>
   </div>}</div>}
   {phase==='loading'&&<div className={styles.panel} role="status" aria-busy="true"><p>Menyiapkan akses PETA…</p></div>}
   {phase==='welcome'&&<section className={styles.panel}><h2>{programMode?'PETA program belum dapat dibuka.':'PETA tersedia melalui undangan.'}</h2><p>{programMode?'Masuk melalui akses peserta dan pastikan penyelenggara telah membuka modul PETA pada program Anda.':'Gunakan QR atau kode program dari penyelenggara, lalu buka modul PETA. Jika Anda menerima undangan pilot berupa tautan pribadi, buka tautan tersebut untuk memulai.'}</p><p className={styles.notice}>PETA membantu refleksi dan pendampingan. Hasilnya tidak digunakan sebagai dasar tunggal untuk keputusan seleksi atau promosi.</p><div className={styles.actions}><Link href="/client/access" className={styles.textButton}>Masuk ke program<ArrowRight size={16} aria-hidden="true"/></Link><button className={styles.secondary} disabled={busy} onClick={()=>{setBusy(true);void resume().then(()=>setError('')).catch(showError).finally(()=>setBusy(false));}}>Lanjutkan sesi pada perangkat ini</button></div></section>}
   {phase==='consent'&&invitation&&<section className={styles.panel}>
    <h2>Sebelum memulai</h2>
    <p>Dalam setiap situasi, pilih pernyataan yang paling sesuai dan yang paling kurang sesuai dengan kebiasaan Anda.</p>
    <ol className={styles.instructions}><li>Baca situasi dan keempat pernyataan dengan saksama.</li><li>Pilih satu pernyataan pada setiap kolom. Kedua pilihan harus berbeda.</li><li>Jawab sesuai kebiasaan Anda. Tidak ada jawaban benar atau salah.</li><li>Gunakan tombol Sebelumnya untuk mengubah pilihan sebelum mengirim jawaban akhir.</li></ol>
    <p className={styles.notice}>PETA membantu Anda mengenali kecenderungan perilaku sebagai bahan refleksi dan pengembangan diri. Hasilnya bukan penilaian kemampuan atau diagnosis psikologis, dan tidak digunakan sebagai dasar tunggal untuk seleksi atau promosi. PETA masih dalam tahap uji pengembangan.</p>
    <details className={styles.privacyDetails}><summary>Penggunaan data dan hasil Anda<ChevronDown size={18} aria-hidden="true"/></summary>
     <p>Kegiatan: <strong>{invitation.workspaceName}</strong>. BinaHub menggunakan jawaban Anda untuk menyusun laporan refleksi. {programMode?'Pengisian terhubung dengan identitas peserta Anda dalam program ini.':'Pengisian dicatat menggunakan kode peserta.'}</p>
     <p>Anda dapat melihat hasil pribadi setelah selesai. Hasil dapat ditinjau oleh tim pendamping yang ditugaskan pada program tersebut jika Anda memberikan izin. Hasil tidak dibagikan otomatis kepada perusahaan.</p>
     <p>Jawaban dan hasil disimpan selama satu tahun sejak Anda mulai. Untuk bantuan akses, koreksi, atau penghapusan data, hubungi <a href="mailto:admin@binahub.id">admin@binahub.id</a>.</p>
    </details>
    {invitation.purpose==='start'&&invitation.consultantAccess&&<label className={styles.check}><input type="checkbox" checked={reviewConsent} onChange={e=>setReviewConsent(e.target.checked)}/><span>Saya mengizinkan tim pendamping BinaHub yang ditugaskan pada program ini untuk meninjau hasil PETA saya. Pilihan ini opsional.</span></label>}
    <label className={styles.check}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>Saya telah membaca petunjuk dan informasi penggunaan data, serta menyetujui penggunaan jawaban untuk menyusun hasil PETA.</span></label>
    <div className={styles.actions}><Link className={styles.textButton} href={programMode?'/client/program':'/diagnose'}>Tidak melanjutkan</Link><button className={styles.primary} disabled={!consent||busy} onClick={()=>void begin()}>{busy?'Menyiapkan sesi…':invitation.purpose==='resume'?'Pulihkan akses':'Saya setuju dan lanjutkan'}<ArrowRight size={16} aria-hidden="true"/></button></div>
   </section>}
   {phase==='practice'&&<section className={styles.panel}><h2>{practice.context}</h2><p>Semua pilihan sama-sama wajar. Pilih satu yang paling menggambarkan Anda dan satu yang paling kurang menggambarkan Anda.</p><PetaSelector block={practice} pair={practiceAnswer} onChange={setPracticeAnswer}/><div className={styles.actions}><span className={styles.fine}>Tidak ada jawaban benar atau salah.</span><button className={styles.primary} disabled={!validPetaPair(practiceAnswer)} onClick={()=>setPhase('questions')}>Mulai 24 situasi<ArrowRight size={16} aria-hidden="true"/></button></div></section>}
   {phase==='questions'&&session&&block&&<section key={block.id} data-peta-question data-direction={direction} className={styles.panel+' '+styles.questionStep} aria-label={'Situasi '+(index+1)+' dari 24'}>
    <div className={styles.meta}><span>Situasi {index+1} dari 24</span><span>{completed} lengkap</span></div><progress className={styles.progress} value={completed} max={24} aria-label="Situasi lengkap"/>
    <PetaSelector block={block} pair={answers[block.id]||empty()} disabled={busy} onChange={pair=>choose(block,pair)}/>
    <div className={styles.actions}><button className={styles.textButton} disabled={busy||index===0} onClick={back}><ArrowLeft size={16} aria-hidden="true"/>Sebelumnya</button><button className={styles.primary} disabled={busy||!validPetaPair(answers[block.id])} onClick={next}>{index===23?'Tinjau jawaban':'Lanjut'}<ArrowRight size={16} aria-hidden="true"/></button></div>
    <p className={styles.status} role="status">{saveLabels[saveState]}</p><p className={styles.fine}>Anda dapat mengubah pilihan dengan menekan tombol Sebelumnya sebelum mengirim.</p>
   </section>}
   {phase==='review'&&session&&<section className={styles.panel}><h2>Ringkasan 24 situasi</h2><p>{completed} dari 24 situasi lengkap. Periksa kembali pilihan Anda sebelum mengirim.</p><p className={styles.status} role="status">{saveLabels[saveState]}</p><ol className={styles.reviewList}>{session.blocks.map((b,i)=><li key={b.id}><div>{i+1}. {b.context}<span>{validPetaPair(answers[b.id])?'Lengkap':'Perlu dilengkapi'}</span></div><button className={styles.textButton} disabled={busy} aria-label={'Ubah situasi '+(i+1)} onClick={()=>{setIndex(i);setPhase('questions');setConfirm(false);setDirection('back');}}>Ubah</button></li>)}</ol><label className={styles.check}><input type="checkbox" checked={confirm} disabled={busy} onChange={e=>setConfirm(e.target.checked)}/><span>Saya memahami bahwa pilihan akan terkunci setelah dikirim.</span></label><div className={styles.actions}><button className={styles.textButton} disabled={busy} onClick={()=>setPhase('questions')}>Kembali</button><button className={styles.primary} disabled={busy||!confirm||completed!==24} onClick={()=>void submit()}>{busy?'Memastikan jawaban dan menyiapkan hasil…':'Kirim dan lihat hasil'}<Check size={16} aria-hidden="true"/></button></div></section>}
   {phase==='result'&&report&&<PetaReport report={report}/>}
   <p className={styles.help}>Bantuan pengisian: <a href="mailto:admin@binahub.id" className={styles.textButton}>admin@binahub.id</a>. Hasil PETA digunakan untuk refleksi dan pengembangan diri.</p>
  </div>
 </div></DiagnosisShell>;
}
