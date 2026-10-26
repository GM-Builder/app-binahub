'use client';
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft,ArrowRight,Check,ChevronDown,FileText,LoaderCircle,Mail,MessageSquare,RefreshCw,ShieldCheck,Target,TrendingUp } from 'lucide-react';
import { DiagnosisShell } from './diagnosis-shell';
import styles from './diagnosis.module.css';
import { SPIN_NOTICE_VERSION,SPIN_PRIVACY_NOTICE,spinArray,spinConflicts,spinErrors,spinOptions,spinLabel,spinSanitize,spinStage,spinSummary,spinVisible,type SpinAnswers,type SpinDefinition,type SpinField } from '@/lib/spin-form';
import { spinNewKey,spinRequest,type SpinAttempt,type SpinConfirmation } from '@/lib/spin-client';
const inputClass=styles.input;
const buttonClass=styles.primaryButton;
const STORAGE='binahub-spin-draft-v1';
function Frame({children}:{children:React.ReactNode}){return <DiagnosisShell organization><div className={styles.discoveryLayout}>{children}</div></DiagnosisShell>;}

export function DiscoverySteps({stages,active=0}:{stages:string[];active?:number}) {
 return <nav aria-label="Tahap pengisian"><ol className={styles.steps}>{stages.map((stage,i)=><li key={stage} aria-current={active===i?'step':undefined} className={styles.step+(i<active?' '+styles.stepComplete:'')}><span className={styles.stepNumber}>{i<active?<><Check size={17} aria-hidden="true"/><span className="sr-only">{i+1}, selesai</span></>:i+1}</span><span>{stage}</span></li>)}</ol></nav>;
}

function PrivacyNotice(){return <details className={styles.privacy}><summary><ShieldCheck size={21} strokeWidth={1.7} aria-hidden="true"/>Penggunaan dan penyimpanan data<ChevronDown size={17} aria-hidden="true" className={styles.privacyChevron}/></summary><p>{SPIN_PRIVACY_NOTICE}</p></details>;}

const stageContext=[
 {title:'Konteks organisasi',description:'Informasi ini membantu kami memahami kondisi organisasi Anda agar rekomendasi program lebih relevan.',icon:FileText},
 {title:'Tantangan utama',description:'Ceritakan hal yang ingin diperbaiki, pengalaman sebelumnya, dan hambatan yang masih dihadapi tim Anda.',icon:MessageSquare},
 {title:'Dampak pada organisasi',description:'Bantu kami memahami pengaruh tantangan tersebut terhadap pekerjaan dan organisasi Anda.',icon:TrendingUp},
 {title:'Hasil yang diharapkan',description:'Tentukan perubahan yang ingin Anda lihat dan bagaimana keberhasilannya dapat dikenali.',icon:Target},
 {title:'Arah rekomendasi',description:'Pilih pendekatan dan rencana pelaksanaan yang paling sesuai dengan kebutuhan organisasi Anda.',icon:FileText},
];

function DiscoveryIntroduction(){return <><h1 className={styles.choiceTitle}>Tentukan arah pengembangan organisasi Anda.</h1><p className={styles.subtitle}>Ceritakan tantangan, dampak, dan hasil yang Anda harapkan. BinaHub akan menyiapkan rekomendasi awal yang dapat dibahas bersama tim Anda.</p></>;}
export function SpinDiscovery(){
 const [definition,setDefinition]=useState<SpinDefinition|null>(null),[available,setAvailable]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [attempt,setAttempt]=useState<SpinAttempt|null>(null),[answers,setAnswers]=useState<SpinAnswers>({}),[screen,setScreen]=useState(0),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[saveState,setSaveState]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 const [contact,setContact]=useState({name:'',email:'',company:'',role:'',phone:''}),[marketing,setMarketing]=useState(false),[finalConsent,setFinalConsent]=useState(false),[ack,setAck]=useState(false);
 const [summaryMode,setSummaryMode]=useState<'confirmed'|'edited'|'supplemented'>('confirmed'),[corrections,setCorrections]=useState<SpinConfirmation['corrections']>({});
 const [challenge,setChallenge]=useState(''),[challengeAnswer,setChallengeAnswer]=useState('');
 const [website,setWebsite]=useState(''),[reload,setReload]=useState(0);
 const session=useRef<{id:string;key:string}|null>(null),current=useRef<SpinAttempt|null>(null),latest=useRef<SpinAnswers>({}),confirmation=useRef<SpinConfirmation|null>(null),chain=useRef<Promise<unknown>>(Promise.resolve()),submitKey=useRef(''),lock=useRef(false),heading=useRef<HTMLHeadingElement>(null),mounted=useRef(true),dirty=useRef(false),autosave=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{mounted.current=true;let active=true;
 void spinRequest<{definition:SpinDefinition;available:boolean}>('',undefined,'GET').then(async data=>{
 if(!active)return;setDefinition(data.definition);setAvailable(data.available);
 let stored:null|{id:string;key:string}=null;try{const raw=sessionStorage.getItem(STORAGE);if(raw)stored=JSON.parse(raw);}catch{}
 if(stored&&/^[a-f0-9-]{36}$/i.test(stored.id)&&/^[a-f0-9]{64}$/.test(stored.key)){
 const response=await fetch('/api/discovery/spin/'+stored.id,{headers:{Authorization:'Bearer '+stored.key},cache:'no-store'});
 if(response.ok){const body=await response.json();if(!active)return;session.current=stored;current.current=body.attempt;latest.current=body.attempt.answers;confirmation.current=body.attempt.confirmation;setAttempt(body.attempt);setAnswers(body.attempt.answers);setChallenge(body.challenge);}
 }
 }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
 return()=>{active=false;mounted.current=false;if(autosave.current)clearTimeout(autosave.current);};},[reload]);
 useEffect(()=>{heading.current?.focus();},[screen,attempt?.status]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[]);
 function save(snapshot:SpinAnswers,confirm:SpinConfirmation|null=confirmation.current,submit?:unknown){
 const run=async()=>{if(!session.current||!current.current)throw new Error('Mulai pengisian terlebih dahulu.');
 setSaveState('Menyimpan…');
 const response=await spinRequest<{attempt:SpinAttempt;summaryHash:string}>('/'+session.current.id,{key:session.current.key,revision:current.current.revision,answers:snapshot,confirmation:confirm,...(submit?{submit}:{})},'PATCH');
 current.current=response.attempt;
 if(mounted.current){setAttempt(response.attempt);setSaveState('Tersimpan');if(latest.current===snapshot)dirty.current=false;}return response;};
 const task=chain.current.catch(()=>{}).then(run);chain.current=task;
 return task.catch(e=>{if(mounted.current){setSaveState('Belum tersimpan');setError(e.message);}throw e;});
 }
 function change(key:string,value:SpinAnswers[string]){
 if(!definition)return;
 const next=spinSanitize(definition,{...latest.current,[key]:value});latest.current=next;setAnswers(next);setErrors({});setError('');setAck(false);dirty.current=true;
 const field=definition.fields.find(f=>f.key===key);
 if(field&&Number(field.questionId.slice(1))<=15)confirmation.current=null;
 setSaveState('Perubahan belum tersimpan');
 if(autosave.current)clearTimeout(autosave.current);
 autosave.current=setTimeout(()=>{if(mounted.current)void save(next,confirmation.current).catch(()=>{});},900);
 }
 async function start(){
 if(lock.current)return;lock.current=true;setBusy(true);setError('');
 try{let s=session.current;if(!s){s={id:crypto.randomUUID(),key:spinNewKey()};session.current=s;try{sessionStorage.setItem(STORAGE,JSON.stringify(s));}catch{}}
 const body=await spinRequest<{attempt:SpinAttempt;challenge:string}>('',{...s,processingConsent:true,noticeVersion:SPIN_NOTICE_VERSION,website});current.current=body.attempt;confirmation.current=body.attempt.confirmation;latest.current=body.attempt.answers;setAnswers(body.attempt.answers);setAttempt(body.attempt);setChallenge(body.challenge);
 }catch(e){setError(e instanceof Error?e.message:'Pengisian belum dapat dimulai.');}finally{lock.current=false;setBusy(false);}
 }
 function nextScreen(delta:number){if(!definition)return;let i=screen+delta;while(i>=0&&i<definition.screens.length&&!definition.screens[i].includes('Q16')&&!definition.screens[i].includes('Q28')&&!definition.fields.some(f=>definition.screens[i].includes(f.questionId)&&spinVisible(f,latest.current)))i+=delta;setScreen(Math.max(0,Math.min(i,definition.screens.length-1)));}
 async function next(){
 if(!definition||lock.current)return;
  if(autosave.current)clearTimeout(autosave.current);
 const questions=definition.screens[screen],invalid=spinErrors(definition,latest.current,true,questions);
 if(Object.keys(invalid).length){setErrors(invalid);setError('Lengkapi bagian yang ditandai.');return;}
 if(questions.includes('Q16')){
 lock.current=true;setBusy(true);
 try{const saved=await save(latest.current,null);const c={hash:saved.summaryHash,status:summaryMode,corrections:summaryMode==='confirmed'?{}:Object.fromEntries(Object.entries(corrections).filter(([,v])=>v?.trim()))};
 if(summaryMode!=='confirmed'&&!Object.values(c.corrections).some(Boolean)){setError('Tuliskan koreksi atau tambahan sebelum melanjutkan.');return;}
 await save(latest.current,c);confirmation.current=c;nextScreen(1);
 }catch{}finally{lock.current=false;setBusy(false);}
 }else{void save(latest.current).catch(()=>{});nextScreen(1);}
 }
 async function submit(){
 if(!definition||lock.current)return;
  if(autosave.current)clearTimeout(autosave.current);
  if(!contact.name.trim()||!contact.company.trim()||!/^\S+@\S+\.\S+$/.test(contact.email)||!contact.email.trim()){setError('Lengkapi nama, email yang valid, dan perusahaan/organisasi Anda.');return;}
 const invalid=spinErrors(definition,latest.current,true);setErrors(invalid);
 if(Object.keys(invalid).length||!confirmation.current){setError('Tinjau kembali jawaban dan konfirmasi ringkasan.');return;}
 if(!challengeAnswer.trim()){setError('Lengkapi verifikasi singkat sebelum mengirim.');return;}
 if(!finalConsent||spinConflicts(latest.current).length&&!ack){setError('Konfirmasi persetujuan dan hal yang perlu diselaraskan.');return;}
 lock.current=true;setBusy(true);setError('');if(!submitKey.current)submitKey.current=spinNewKey();
 try{await save(latest.current,confirmation.current,{idempotencyKey:submitKey.current,contact,processingConsent:true,marketingConsent:marketing,noticeVersion:SPIN_NOTICE_VERSION,conflictsAcknowledged:ack,challengeAnswer:Number(challengeAnswer),website});dirty.current=false;}
 catch{}finally{lock.current=false;setBusy(false);}
 }
 if(loading)return <Frame><section className={styles.statusPanel+' '+styles.loadingPanel} aria-busy="true"><span className={styles.iconTile}><FileText size={24} aria-hidden="true"/></span><div className={styles.skeletonLine+' '+styles.skeletonHeading} aria-hidden="true"/><div className={styles.skeletonLine} aria-hidden="true"/><p role="status">Menyiapkan pengisian…</p></section></Frame>;
 if(!definition||!available)return <Frame><section className={styles.statusPanel}><span className={styles.iconTile}><FileText size={25} aria-hidden="true"/></span><h1>Rekomendasi kebutuhan organisasi</h1><p>{error||'Layanan sedang disiapkan. Anda tetap dapat menghubungi tim BinaHub untuk konsultasi.'}</p><div className={styles.statusActions}><button type="button" className={buttonClass} onClick={()=>setReload(x=>x+1)}><RefreshCw size={16} aria-hidden="true"/>Coba lagi</button><a href="mailto:admin@binahub.id" className={styles.textLink}>Hubungi BinaHub</a></div></section></Frame>;
 if(attempt&&attempt.status!=='draft')return <Frame><section className={styles.statusPanel}><span className={styles.iconTile+' '+styles.successIcon}><Check size={27} aria-hidden="true"/></span><h1>Permintaan Anda telah diterima</h1><p>Terima kasih telah berbagi kebutuhan organisasi Anda. Laporan rekomendasi akan dikirim melalui email. Anda dapat menutup halaman ini; proses tetap berjalan.</p><p>Periksa kotak masuk dan folder spam. Jika membutuhkan bantuan, hubungi admin@binahub.id.</p><div className={styles.statusActions}><Link href="/diagnose" className={buttonClass}>Kembali ke BinaHub<ArrowRight size={16} aria-hidden="true"/></Link></div></section></Frame>;
 if(!attempt)return <Frame><section className={styles.welcome}>
  <h1 className={styles.welcomeTitle}>Tentukan arah pengembangan organisasi Anda.</h1>
  <p className={styles.subtitle}>Ceritakan tantangan, dampak, dan hasil yang Anda harapkan. BinaHub akan menyiapkan rekomendasi awal yang dapat dibahas bersama tim Anda.</p>
  <DiscoverySteps stages={definition.stages}/>
  <section className={styles.beforeStart} aria-labelledby="before-start-title">
   <div className={styles.beforeStartIntro}><span className={styles.iconTile}><FileText size={27} strokeWidth={1.7} aria-hidden="true"/></span><div><h2 id="before-start-title">Sebelum memulai</h2><p>Pengisian ditujukan bagi tim dan organisasi. Tidak ada jawaban benar atau salah. Hindari nama karyawan, data sensitif, atau informasi rahasia pada jawaban.</p></div></div>
   <PrivacyNotice/>
  </section>
  <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} aria-describedby={!consent?'spin-start-hint':undefined}/>Saya memahami penggunaan data untuk menyusun rekomendasi dan menindaklanjuti kebutuhan ini.</label>
  <input aria-label="Website perusahaan (biarkan kosong)" tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)} className="hidden"/>
  <div className={styles.welcomeActions}><button type="button" disabled={!consent||busy} aria-busy={busy} onClick={start} className={buttonClass}>{busy&&<LoaderCircle className="motion-safe:animate-spin" size={17} aria-hidden="true"/>}Mulai pengisian<ArrowRight size={17} aria-hidden="true"/></button></div>
  {!consent&&<p id="spin-start-hint" className={styles.welcomeHint}>Centang persetujuan penggunaan data untuk mulai mengisi.</p>}
  {error&&<p role="alert" className={styles.formError}>{error}</p>}
 </section></Frame>;
 const questions=definition.screens[screen],isSummary=questions.includes('Q16'),isContact=questions.includes('Q28'),summary=spinSummary(definition,answers),conflicts=spinConflicts(answers);
 const stage=spinStage(screen),context=stageContext[stage],ContextIcon=isContact?Mail:context.icon;
 const stageScreens=definition.screens.map((group,index)=>({group,index})).filter(({group,index})=>spinStage(index)===stage&&(group.includes('Q16')||group.includes('Q28')||definition.fields.some(f=>group.includes(f.questionId)&&spinVisible(f,answers))));
 return <Frame><div className={styles.formIntro}><p className={styles.eyebrow}>Rekomendasi program organisasi</p><DiscoveryIntroduction/><DiscoverySteps stages={definition.stages} active={stage}/></div>
 <section className={styles.formCard} aria-labelledby="spin-screen-title">
 <aside className={styles.contextPanel} aria-label="Panduan pengisian"><span className={styles.iconTile}><ContextIcon size={24} strokeWidth={1.7} aria-hidden="true"/></span><p className={styles.contextTitle}>{isContact?'Laporan untuk Anda':isSummary?'Ringkasan kebutuhan':context.title}</p><p className={styles.contextText}>{isContact?'Laporan dan rekomendasi awal dikirim ke email Anda. Pastikan alamat yang dicantumkan dapat diakses.':isSummary?'Pastikan pemahaman kami sudah sesuai. Anda dapat mengoreksi atau menambahkan informasi sebelum melanjutkan.':context.description}</p><div className={styles.contextPrivacy}><ShieldCheck size={18} aria-hidden="true"/><div><strong>Jaga privasi jawaban Anda</strong><p>Hindari nama karyawan, data sensitif, atau informasi rahasia.</p></div></div><p className={styles.partCount}>Bagian {stageScreens.findIndex(s=>s.index===screen)+1} dari {stageScreens.length} di tahap ini</p></aside>
 <div className={styles.formMain}><h2 id="spin-screen-title" ref={heading} tabIndex={-1} className={isSummary||isContact?styles.formHeading:'sr-only'}>{isSummary?'Pemahaman kami':isContact?'Ke mana laporan Anda dikirim?':definition.stages[stage]}</h2><div className={styles.fields}>
 {isSummary?<><p className={styles.formNote}>Tinjau ringkasan berikut sebelum memilih pendekatan pengembangan.</p><dl className={styles.summaryList}>{Object.entries(summary).map(([key,value])=><div key={key}><dt>{{situation:'Situasi',problem:'Tantangan',impact:'Dampak',outcome:'Harapan'}[key]}</dt><dd>{value}</dd></div>)}</dl><label className={styles.fieldLabel}>Apakah ringkasan ini sudah sesuai?<select value={summaryMode} onChange={e=>setSummaryMode(e.target.value as typeof summaryMode)} className={inputClass}><option value="confirmed">Sudah tepat</option><option value="edited">Perlu dikoreksi</option><option value="supplemented">Ada hal penting yang belum tercakup</option></select></label>{summaryMode==='edited'&&Object.keys(summary).map(key=><label key={key} className={styles.fieldLabel}>Koreksi {{situation:'situasi',problem:'tantangan',impact:'dampak',outcome:'harapan'}[key]}<textarea maxLength={1000} value={corrections[key as keyof typeof corrections]||''} onChange={e=>setCorrections({...corrections,[key]:e.target.value})} className={inputClass}/><span className={styles.helper}>Biarkan kosong jika bagian ini sudah sesuai.</span></label>)}{summaryMode==='supplemented'&&<label className={styles.fieldLabel}>Tambahan Anda<textarea maxLength={300} value={corrections.problem||''} onChange={e=>setCorrections({problem:e.target.value})} className={inputClass}/></label>}</>
 :isContact?<><p className={styles.formNote}>Gunakan alamat email yang dapat Anda akses. PDF dan tautan pribadi akan dikirim ke alamat ini.</p><div className={styles.contactGrid}>{(['name','email','company','role','phone'] as const).map(key=><label key={key} className={styles.fieldLabel+(key==='company'?' '+styles.contactWide:'')}>{{name:'Nama',email:'Email kerja',company:'Perusahaan / organisasi',role:'Jabatan atau fungsi (opsional)',phone:'WhatsApp (opsional)'}[key]}<input required={['name','email','company'].includes(key)} autoComplete={{name:'name',email:'email',company:'organization',role:'organization-title',phone:'tel'}[key]} type={key==='email'?'email':key==='phone'?'tel':'text'} maxLength={key==='email'?254:key==='company'?150:key==='phone'?30:100} value={contact[key]} onChange={e=>setContact({...contact,[key]:e.target.value})} className={inputClass}/></label>)}</div><label className={styles.fieldLabel}>Verifikasi singkat: {challenge}<input inputMode="numeric" type="number" value={challengeAnswer} onChange={e=>setChallengeAnswer(e.target.value)} className={inputClass}/></label><PrivacyNotice/><label className={styles.consent}><input type="checkbox" checked={finalConsent} onChange={e=>setFinalConsent(e.target.checked)}/>Saya memahami penggunaan data untuk menyusun rekomendasi dan menindaklanjuti kebutuhan ini.</label><label className={styles.consent}><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)}/>Saya bersedia menerima informasi dan pembaruan BinaHub (opsional).</label>{conflicts.length>0&&<div className={styles.warning}><p>Jawaban Anda memuat hal yang perlu diselaraskan: prioritas dan waktu mulai, cakupan/jumlah peserta, dampak, atau dukungan di luar pelatihan. Anda dapat kembali meninjaunya atau meminta bantuan konsultan.</p><label className={styles.consent}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>Saya memahami hal tersebut dan ingin membahasnya bersama konsultan.</label></div>}</>
 :definition.fields.filter(f=>questions.includes(f.questionId)&&spinVisible(f,answers)).map(f=><SpinFieldControl key={f.key} definition={definition} field={f} answers={answers} error={errors[f.key]} onChange={value=>change(f.key,value)}/>)}
 {questions.includes('Q17')&&!answers.showSpiritual&&<button type="button" onClick={()=>change('showSpiritual','yes')} className={styles.textLink}>Lihat program spiritual dan transformasi diri</button>}
 </div>{error&&<p role="alert" className={styles.formError}>{error}</p>}<div className={styles.formFooter}><button type="button" disabled={screen===0||busy} onClick={()=>nextScreen(-1)} className={styles.secondaryButton}><ArrowLeft size={16} aria-hidden="true"/>Kembali</button><button type="button" disabled={busy} aria-busy={busy} onClick={isContact?submit:next} className={buttonClass}>{busy&&<LoaderCircle size={16} aria-hidden="true" className="motion-safe:animate-spin"/>}{isContact?'Kirim permintaan':isSummary?'Konfirmasi & lanjut':'Lanjut'}<ArrowRight size={16} aria-hidden="true"/></button></div><div className={styles.saveStatus}><p role="status">{saveState==='Tersimpan'&&<Check size={13} aria-hidden="true"/>}{saveState==='Menyimpan…'&&<LoaderCircle size={13} aria-hidden="true" className="motion-safe:animate-spin"/>}{saveState||'Jawaban dipertahankan saat Anda kembali.'}</p>{saveState==='Belum tersimpan'&&<button type="button" onClick={()=>void save(latest.current).catch(()=>{})} className={styles.textLink}>Coba simpan lagi</button>}</div></div></section><p className={styles.footnote}>Hasil berupa rekomendasi awal, bukan asesmen psikometrik atau penawaran final.<br/>Bantuan: <a href="mailto:admin@binahub.id" className="underline underline-offset-4">admin@binahub.id</a></p></Frame>;
}
export function SpinFieldControl({definition,field:f,answers:a,error,onChange}:{definition:SpinDefinition;field:SpinField;answers:SpinAnswers;error?:string;onChange:(v:SpinAnswers[string])=>void}){
 const id='spin-'+f.key,value=a[f.key],options=spinOptions(f,a);
 const selected=spinArray(a,f.key),ordinaryCount=selected.filter(v=>!options.find(o=>o.value===v)?.exclusive).length,atLimit=ordinaryCount>=(f.maxSelected||99);
 const hint=({role:'Pilih peran Anda dalam organisasi.',industry:'Pilih bidang usaha utama organisasi Anda.',orgSize:'Pilih rentang jumlah karyawan dalam organisasi Anda.'} as Record<string,string>)[f.key];
 const describedBy=[hint?id+'-hint':'',f.type==='multi'?id+'-limit':'',error?id+'-error':'',f.type==='text'?id+'-privacy':''].filter(Boolean).join(' ')||undefined;

 const observed=spinArray(a,'symptoms')[0],effect=spinArray(a,'implications')[0];
 const symptomField=definition.fields.find(item=>item.key==='symptoms')!;
 const effectField=definition.fields.find(item=>item.key==='implications')!;
 const observedLabel=observed&&observed!=='unknown'?spinOptions(symptomField,a).find(o=>o.value===observed)?.label:spinLabel(definition,a,'problemCluster');
 const effectLabel=effect&&effect!=='unknown'?spinOptions(effectField,a).find(o=>o.value===effect)?.label:null;
 const label=f.key==='implications'&&observedLabel?'Jika “'+observedLabel+'” belum banyak berubah dalam 3–6 bulan ke depan, apa yang paling mungkin terdampak?':f.key==='desiredOutcome'&&effectLabel?'Jika “'+effectLabel+'” dapat dikurangi, apa yang seharusnya dilakukan atau dihasilkan dengan lebih baik oleh peserta?':f.label;
 return <fieldset className={styles.field} aria-describedby={describedBy}><legend className={styles.legend}>{label}{!f.required&&<span className={styles.optional}>(opsional)</span>}</legend>
 {hint&&<p id={id+'-hint'} className={styles.helper}>{hint}</p>}
 {f.type==='select'?<><select aria-label={f.label} aria-required={f.required} aria-invalid={!!error} aria-describedby={describedBy} value={String(value||'')} onChange={e=>onChange(e.target.value)} className={inputClass}><option value="">Pilih jawaban</option>{options.map(o=><option key={o.value} value={o.value}>{o.label.replace(/\s*\(eksklusif\)/g,'').replace(/:\s*\[[^\]]+\]/g,'')}</option>)}</select>{value&&String(options.find(o=>o.value===value)?.label||'').length>70&&<p className={styles.formNote}>{options.find(o=>o.value===value)?.label}</p>}</>
 :f.type==='multi'?<><p id={id+'-limit'} role="status" className={styles.helper}>{selected.length} dari maksimal {f.maxSelected} jawaban dipilih.{atLimit?' Batas pilihan tercapai. Batalkan salah satu pilihan untuk menggantinya.':''}</p><div className={styles.options}>{options.map(o=>{const checked=selected.includes(o.value),disabled=atLimit&&!checked&&!o.exclusive;return <label key={o.value} className={styles.option+(checked?' '+styles.optionChecked:disabled?' '+styles.optionDisabled:'')}><input type="checkbox" checked={checked} disabled={disabled} aria-describedby={describedBy} aria-invalid={!!error} onChange={()=>{if(checked)onChange(selected.filter(v=>v!==o.value));else if(o.exclusive)onChange([o.value]);else{const next=selected.filter(v=>!options.find(x=>x.value===v)?.exclusive);if(next.length<(f.maxSelected||99))onChange([...next,o.value]);}}}/>{o.label.replace(/\s*\(eksklusif\)/g,'').replace(/:\s*\[[^\]]+\]/g,'')}</label>;})}</div></>
 :f.type==='number'?<input aria-label={f.label} aria-required={f.required} aria-invalid={!!error} aria-describedby={describedBy} className={inputClass} type="number" inputMode="numeric" min={1} max={f.max} value={typeof value==='number'?value:''} onChange={e=>onChange(e.target.value?Number(e.target.value):'')}/>
 :<><textarea aria-label={f.label} aria-required={f.required} aria-invalid={!!error} aria-describedby={describedBy} maxLength={f.maxLength} value={String(value||'')} onChange={e=>onChange(e.target.value)} className={inputClass}/><p id={id+'-privacy'} className={styles.helper}>Tanpa nama karyawan, data pribadi, atau informasi rahasia · {String(value||'').length}/{f.maxLength}</p></>}
 {error&&<p id={id+'-error'} className={styles.fieldError}>{error}</p>}</fieldset>;
}
