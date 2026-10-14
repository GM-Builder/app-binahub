"use client";
import Link from 'next/link';
import { useEffect,useRef,useState } from 'react';
import { ArrowLeft,ArrowRight,Check,CheckCircle2,Loader2,LockKeyhole,ShieldCheck,Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PEReviewAccessPanel } from './pe-review-access';
import { countAnswered,firstUnanswered,peRequest,PERequestError,personalSignInPath,peChannel,
  type PEAnswer,type PEAttempt,type PEContext,type PEDefinition,type PEReport,type PEReviewAccess } from '@/lib/individual-assessment';

const button='inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-4';
const secondary='inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4';
const input='mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-800 focus:ring-2 focus:ring-blue-100';
type State={definition:PEDefinition;attempt?:PEAttempt;report?:PEReport|null;access?:PEReviewAccess};

export function IndividualAssessment() {
  const [state,setState]=useState<State|null>(null),[loading,setLoading]=useState(true),[signedIn,setSignedIn]=useState(false);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[saved,setSaved]=useState('');
  const [pendingChoice,setPendingChoice]=useState<{id:string;value:PEAnswer}|null>(null);
  const [index,setIndex]=useState(0),[consent,setConsent]=useState(false),[deleteConfirm,setDeleteConfirm]=useState(false);
  const [context,setContext]=useState<PEContext>({role:'',goal:'',relevance:{'PE-02':'normal','PE-04':'normal','PE-06':'normal'}});
  const tokenRef=useRef(''),userRef=useRef(''),locked=useRef(false);
  const startRef=useRef<Record<string,unknown>|null>(null),submissionKey=useRef('');
  const questions=state?[...state.definition.selfReportItems,...state.definition.sjtItems]:[];
  const storageKey=()=>`binahub.pe.attempt.${userRef.current}`;
  const readId=()=>{try{return localStorage.getItem(storageKey());}catch{return null;}};
  const storeId=(id:string|null)=>{try{if(id)localStorage.setItem(storageKey(),id);else localStorage.removeItem(storageKey());}catch{/* Only an opaque ID, never answers. */}};
  async function token() {
    const {data}=await supabase.auth.getSession();
    if(!data.session?.access_token||data.session.user.id!==userRef.current){
      setState(null);setSignedIn(false);throw new Error('Sesi Anda berubah atau berakhir. Silakan masuk kembali.');
    }
    tokenRef.current=data.session.access_token;return tokenRef.current;
  }
  useEffect(()=>{
    let alive=true;
    async function load(){
      try{
        const {data}=await supabase.auth.getSession();
        if(!alive)return;
        if(!data.session){setSignedIn(false);return;}
        userRef.current=data.session.user.id;tokenRef.current=data.session.access_token;setSignedIn(true);
        const {definition}=await peRequest<{definition:PEDefinition}>(tokenRef.current,'');
        let attempt:PEAttempt|undefined,report:PEReport|null= null,access:PEReviewAccess|undefined;
        const requested=new URLSearchParams(window.location.search).get('attempt');
        let id:string|null=requested&&/^[a-f0-9-]{36}$/i.test(requested)?requested:null;
        if(!id)try{id=localStorage.getItem(`binahub.pe.attempt.${data.session.user.id}`);}catch{}
        if(id){
          try{const result=await peRequest<{attempt:PEAttempt;report:PEReport|null;access?:PEReviewAccess}>(tokenRef.current,`/${encodeURIComponent(id)}`);attempt=result.attempt;report=result.report;access=result.access;}
          catch(failure){if(failure instanceof PERequestError&&failure.status===404){try{localStorage.removeItem(`binahub.pe.attempt.${data.session.user.id}`);}catch{}}else throw failure;}
        }
        if(alive&&userRef.current===data.session.user.id){setState({definition,attempt,report,access});if(attempt){setContext(attempt.context);
          setIndex(firstUnanswered([...definition.selfReportItems,...definition.sjtItems],attempt.responses));}}
      }catch(failure){if(alive)setError(failure instanceof Error?failure.message:'Asesmen belum dapat dimuat.');}
      finally{if(alive)setLoading(false);}
    }
    void load();return()=>{alive=false;};
  },[]);
  useEffect(()=>{
    const listener=supabase.auth.onAuthStateChange?.((_event,session)=>{
      if(userRef.current&&session?.user.id!==userRef.current){userRef.current='';tokenRef.current='';setState(null);setSignedIn(false);}
    });
    return()=>listener?.data.subscription.unsubscribe();
  },[]);

  async function run(action:()=>Promise<void>){
    if(locked.current)return;locked.current=true;setBusy(true);setError('');
    try{await action();}catch(failure){setError(failure instanceof Error?failure.message:'Perubahan belum tersimpan. Coba kembali.');}
    finally{locked.current=false;setBusy(false);}
  }
  async function start(){await run(async()=>{
    if(!state||!consent)return;
    if(!startRef.current)startRef.current={id:crypto.randomUUID(),context,
      consentVersion:state.definition.consentVersion,privacyVersion:state.definition.privacyVersion,
      ...(state.definition.sharingConsentVersion?{sharingConsentVersion:state.definition.sharingConsentVersion,channel:peChannel(window.location.search)}:{})};
    storeId(String(startRef.current.id));
    const result=await peRequest<{attempt:PEAttempt}>(await token(),'','POST',startRef.current);
    await token();
    setState({...state,attempt:result.attempt});setIndex(0);setSaved('Draft tersimpan');
  });}
  async function answer(value:PEAnswer){
    if(locked.current)return;
    setPendingChoice({id:questions[index].id,value});
    await run(async()=>{
    if(!state?.attempt)return;
    const responses={...state.attempt.responses,[questions[index].id]:value};
    const result=await peRequest<{attempt:PEAttempt}>(await token(),`/${state.attempt.id}`,'PATCH',
      {revision:state.attempt.revision,responses});
    await token();
    setState({...state,attempt:result.attempt});setSaved('Jawaban tersimpan');
    });
    setPendingChoice(null);
  }
  async function submit(){await run(async()=>{
    if(!state?.attempt)return;
    if(!submissionKey.current)submissionKey.current=crypto.randomUUID();
    const result=await peRequest<{attempt:PEAttempt}>(await token(),`/${state.attempt.id}`,'PATCH',
      {revision:state.attempt.revision,responses:state.attempt.responses,submissionKey:submissionKey.current});
    await token();
    // Keep the submitted state even if loading the report fails; never re-submit with a new key.
    setState({...state,attempt:result.attempt});
    const full=await peRequest<{attempt:PEAttempt;report:PEReport}>(await token(),`/${state.attempt.id}`);
    await token();
    setState({...state,...full});setSaved('Jawaban berhasil dikirim');
  });}
  async function reload(){await run(async()=>{
    const id=state?.attempt?.id||readId();if(!id)return;
    const full=await peRequest<{attempt:PEAttempt;report:PEReport|null}>(await token(),`/${id}`);
    await token();
    setState(current=>current?{...current,...full}:current);setSaved('Versi terbaru dimuat');
  });}
  async function erase(){await run(async()=>{
    if(!state?.attempt)return;
    await peRequest(await token(),`/${state.attempt.id}`,'DELETE');await token();storeId(null);startRef.current=null;submissionKey.current='';
    setState({...state,attempt:undefined,report:null});setIndex(0);setConsent(false);setDeleteConfirm(false);setSaved('Data pengisian dihapus');
  });}
  const progress=state?.attempt?countAnswered(questions,state.attempt.responses):0;
  const question=questions[index];
  const area=state?.definition.competencies.find(c=>c.code===question?.competencyCode);

  return <main className="min-h-screen bg-[#F5F7FA] px-4 pb-12 text-[#0B2C6B] sm:px-6">
    <header className="mx-auto flex max-w-5xl items-center justify-between py-6">
      <Link href="/diagnose" className="flex min-h-11 items-center gap-2 text-sm"><ArrowLeft size={16} aria-hidden="true"/>Pilihan diagnosis</Link>
      <span className="text-xl font-bold tracking-tight">Bina<span className="text-[#BA8B35]">Hub</span></span>
    </header>
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Personal Effectiveness</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Ruang untuk bertumbuh.</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">Kenali kebiasaan kerja dan cara Anda merespons situasi sehari-hari. Mulai dari tiga Area pengembangan, gratis.</p>
      {error&&<div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        {error}<div className="mt-3 flex gap-3">{state?.attempt&&<button className={secondary} disabled={busy} onClick={()=>void reload()}>Muat draft terbaru</button>}
          {!state&&signedIn&&<button className={secondary} onClick={()=>window.location.reload()}>Coba lagi</button>}</div></div>}
      {loading?<div role="status" className="mt-8 flex min-h-60 items-center justify-center gap-3 rounded-3xl bg-white"><Loader2 className="animate-spin motion-reduce:animate-none"/>Menyiapkan asesmen…</div>
      :!signedIn?<section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10">
        <LockKeyhole className="text-[#BA8B35]" aria-hidden="true"/><h2 className="mt-5 text-xl font-semibold">Hasil pribadi, akses yang aman.</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">Masuk atau buat akun untuk menyimpan pengisian dan membuka hasil kapan saja. Akun BinaHub yang sudah ada dapat digunakan.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link className={button} href={personalSignInPath('signin',window.location.search)}>Masuk dan mulai<ArrowRight size={17}/></Link>
          <Link className={secondary} href={personalSignInPath('signup',window.location.search)}>Buat akun</Link></div></section>
      :state?.report?<PEResult report={state.report} retentionUntil={state.attempt!.retentionUntil}/>
      :state?.attempt?.status==='submitted'?<section className="mt-8 rounded-3xl bg-white p-8"><CheckCircle2 aria-hidden="true"/>
        <h2 className="mt-4 text-xl font-semibold">Jawaban sudah tersimpan.</h2><p className="mt-2 text-sm text-slate-600">Buka hasil Anda tanpa mengirim ulang jawaban.</p>
        <button className={`${button} mt-5`} disabled={busy} onClick={()=>void reload()}>Buka hasil</button></section>
      :state&&!state.attempt&&state.definition.acceptingNew===false?<section role="status" className="mt-8 rounded-3xl bg-white p-8"><h2 className="text-xl font-semibold">Pengisian baru sedang dijeda.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Draft dan hasil Anda tetap tersedia melalui Riwayat diagnosis.</p></section>
      :state&&!state.attempt?<form className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9" onSubmit={e=>{e.preventDefault();void start();}}>
        <div className="grid gap-3 sm:grid-cols-3">{state.definition.competencies.map(c=><div key={c.code} className="rounded-2xl bg-slate-50 p-4">
          <CheckCircle2 size={18} className="text-emerald-600" aria-hidden="true"/><h2 className="mt-3 text-sm font-semibold">{c.name}</h2><p className="mt-1 text-xs text-slate-500">4 pengalaman kerja · 2 studi kasus</p></div>)}</div>
        <label className="block text-sm font-medium">Peran atau pekerjaan Anda<input required maxLength={100} className={input} value={context.role} placeholder="Contoh: HR Manager, founder, profesional" disabled={busy} onChange={e=>setContext({...context,role:e.target.value})}/></label>
        <label className="block text-sm font-medium">Apa yang ingin Anda kembangkan?<textarea required maxLength={600} className={input} value={context.goal} rows={3} placeholder="Ceritakan tujuan Anda secara singkat." disabled={busy} onChange={e=>setContext({...context,goal:e.target.value})}/></label>
        <fieldset><legend className="text-sm font-medium">Seberapa relevan setiap Area dengan pekerjaan Anda?</legend><div className="mt-3 space-y-3">{state.definition.competencies.map(c=><label key={c.code} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm">
          {c.name}<select aria-label={`Relevansi ${c.name}`} disabled={busy} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm" value={context.relevance[c.code]}
            onChange={e=>setContext({...context,relevance:{...context.relevance,[c.code]:e.target.value as 'low'|'normal'|'high'}})}>
            <option value="low">Kurang relevan</option><option value="normal">Relevan</option><option value="high">Sangat relevan</option></select></label>)}</div></fieldset>
        <div className="rounded-2xl bg-blue-50 p-4 text-xs leading-6 text-slate-600"><p>{state.definition.notice}</p><p className="mt-2">{state.definition.privacyNotice}</p>{state.definition.sharingNotice&&<p className="mt-2">{state.definition.sharingNotice}</p>}</div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" checked={consent} required disabled={busy} className="mt-1 h-5 w-5 accent-blue-900" onChange={e=>setConsent(e.target.checked)}/>
          {state.definition.sharingConsentVersion?'Saya memahami tujuan asesmen dan mengizinkan tim BinaHub meninjau profil, konteks, jawaban, serta hasil untuk rekomendasi pengembangan.':'Saya memahami tujuan asesmen dan menyetujui penggunaan jawaban untuk hasil pengembangan pribadi saya.'}</label>
        <button className={`${button} w-full`} disabled={busy||!consent}>{busy?<Loader2 className="animate-spin motion-reduce:animate-none" size={18}/>:<ArrowRight size={18}/>}Mulai 18 soal</button>
      </form>
      :state?.attempt&&<section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
        <div className="flex items-center justify-between text-xs text-slate-500"><span>{progress} dari {questions.length} soal terisi</span><span role="status" aria-live="polite">{busy?'Menyimpan…':saved||'Draft tersedia'}</span></div>
        <progress className="mt-3 h-2 w-full accent-blue-900" value={progress} max={questions.length} aria-label="Kemajuan pengisian"/>
        {question?<>
          <div className="mt-7 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-3 py-1.5">Area {area?.name}</span><span className="rounded-full bg-slate-100 px-3 py-1.5">{question.type==='behavioral_self_report'?'Pengalaman kerja · 3 bulan terakhir':'Studi kasus'}</span></div>
          {question.scenario&&<p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{question.scenario}</p>}
          <fieldset className="mt-6"><legend className="text-xl font-medium leading-8 tracking-tight">{question.prompt||question.question}</legend>
            <div className="mt-5 space-y-3">{(question.type==='behavioral_self_report'?state.definition.selfReportScale.map(o=>({value:o.value,label:o.label})):
              question.options!.map(o=>({value:o.id as PEAnswer,label:o.text}))).map(o=>{
                const selected=(pendingChoice?.id===question.id?pendingChoice.value:state.attempt!.responses[question.id])===o.value;
                return <label key={o.value} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm leading-6 transition ${selected?'border-blue-900 bg-blue-50':'border-slate-200 hover:bg-slate-50'} ${busy?'cursor-wait opacity-70':''}`}>
                  <input type="radio" name={question.id} value={o.value} checked={selected} disabled={busy} className="h-5 w-5 shrink-0 accent-blue-900" onChange={()=>void answer(o.value)}/>
                  <span className="flex-1">{o.label}</span>{selected&&<Check size={16} aria-hidden="true"/>}</label>;
              })}</div></fieldset>
          <div className="mt-7 flex items-center justify-between gap-3"><button className={secondary} disabled={busy||index===0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={16}/>Kembali</button>
            <button className={button} disabled={busy||!Object.hasOwn(state.attempt.responses,question.id)} onClick={()=>{setIndex(i=>i+1);window.scrollTo({top:0,behavior:'smooth'});}}>{index===questions.length-1?'Tinjau jawaban':'Lanjut'}<ArrowRight size={16}/></button></div>
        </>:<><h2 className="mt-7 text-2xl font-semibold">Periksa sebelum mengirim.</h2><p className="mt-2 text-sm leading-7 text-slate-600">Jawaban akan dikunci setelah dikirim. Skor dihitung langsung; Anda tidak perlu menunggu analisis AI.</p>
          <div className="mt-5 space-y-2">{state.definition.competencies.map(c=>{
            const items=questions.filter(q=>q.competencyCode===c.code);const answered=countAnswered(items,state.attempt!.responses);
            const na=items.filter(q=>state.attempt!.responses[q.id]==='NA').length;
            return <button key={c.code} className="flex min-h-14 w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left text-sm" onClick={()=>setIndex(questions.findIndex(q=>q.competencyCode===c.code))}>
              <span>{c.name}<span className="mt-1 block text-xs text-slate-500">{na?`${na} jawaban tanpa kesempatan relevan`:'Tidak ada jawaban NA'}</span></span><span>{answered}/6 · Tinjau</span></button>;
          })}</div>
          <p className="mt-4 text-xs leading-6 text-slate-500">Jawaban tanpa kesempatan relevan tidak dinilai nol. Bila bukti terlalu sedikit, skor Area tersebut tidak ditampilkan.</p>
          <button className={`${button} mt-6 w-full`} disabled={busy||progress!==questions.length} onClick={()=>void submit()}>{busy?<Loader2 size={18} className="animate-spin motion-reduce:animate-none"/>:<CheckCircle2 size={18}/>}Kirim dan lihat hasil</button></>}
      </section>}
      {signedIn&&state?.definition.features?.history&&<a href="/insight/individual/history" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Riwayat diagnosis saya</a>}
      {signedIn&&state?.attempt&&state.report&&state.access&&<PEReviewAccessPanel key={state.attempt.id} id={state.attempt.id} access={state.access} token={token} onChange={access=>setState(current=>current?{...current,access}:current)}/>}
      {signedIn&&state?.attempt&&<div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-2"><ShieldCheck size={15}/>Jawaban tersimpan di akun Anda.</span>
        <button className="min-h-11 text-slate-500 underline underline-offset-4" disabled={busy} onClick={()=>setDeleteConfirm(true)}>Hapus data pengisian</button></div>}
      {deleteConfirm&&<section role="alertdialog" aria-modal="false" aria-labelledby="pe-delete-title" className="mt-4 rounded-2xl border border-red-200 bg-white p-5">
        <h2 id="pe-delete-title" className="font-semibold">Hapus jawaban dan hasil ini?</h2><p className="mt-2 text-sm text-slate-600">Data pengisian ini tidak dapat dipulihkan setelah dihapus.</p>
        <div className="mt-4 flex gap-3"><button className={secondary} disabled={busy} onClick={()=>setDeleteConfirm(false)}>Batal</button><button className={button} disabled={busy} onClick={()=>void erase()}><Trash2 size={16}/>Ya, hapus data</button></div></section>}
    </div>
  </main>;
}

export function PEResult({report,retentionUntil}:{report:PEReport;retentionUntil:string}) {
  return <section className="mt-8 space-y-5">
    <div className="rounded-3xl bg-[#0B2C6B] p-7 text-white"><p className="text-xs uppercase tracking-widest text-blue-200">Hasil pengembangan pribadi</p>
      <h2 className="mt-3 text-2xl font-semibold">Langkah kecil yang lebih terarah.</h2><p className="mt-3 text-sm leading-7 text-blue-100">Tujuan Anda: {report.goal}</p></div>
    {report.summary&&<div className="rounded-3xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold">Ringkasan diagnosis</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{report.summary.description}</p>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Peran</dt><dd className="mt-1">{report.summary.role}</dd></div>
        <div><dt className="text-xs text-slate-500">Tanggal diagnosis</dt><dd className="mt-1">{report.metadata?new Date(report.metadata.assessmentDate).toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'}):'—'}</dd></div>
        <div><dt className="text-xs text-slate-500">Kelengkapan pengisian</dt><dd className="mt-1">{report.summary.answeredCount} dari {report.summary.expectedCount} soal · {report.summary.naCount} NA</dd></div>
        <div><dt className="text-xs text-slate-500">Area dengan bukti kedua metode</dt><dd className="mt-1">{report.summary.areasWithBothMethods} dari {report.areas.length} Area</dd></div></dl>
      <p className="mt-4 text-sm leading-7 text-slate-600">{report.summary.focusNames.length?`Kandidat fokus: ${report.summary.focusNames.join(', ')}.`:'Belum cukup bukti atau relevansi untuk menetapkan fokus latihan.'}</p></div>}
    <div className="rounded-3xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-semibold">Cara membaca hasil</h3><p className="mt-3 text-sm leading-7 text-slate-600">{report.methodology}</p></div>
    <div className="grid gap-4">{report.areas.map(a=><article key={a.code} className="rounded-3xl border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-semibold">{a.name}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{a.definition}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">{[{label:'Pengalaman kerja',score:a.selfReport.score,detail:`${a.selfReport.validCount} jawaban valid · ${a.selfReport.naCount} NA`},
        {label:'Studi kasus',score:a.sjt.score,detail:`${a.sjt.validCount} skenario dijawab`}].map(s=><div key={s.label} className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">{s.label}</p><p className="mt-2 text-3xl font-semibold">{s.score===null?'—':s.score.toLocaleString('id-ID',{maximumFractionDigits:2})}<span className="ml-1 text-xs font-normal text-slate-400">{s.score===null?'':'/100'}</span></p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{s.score===null?'Bukti belum cukup untuk menampilkan skor.':s.detail}</p></div>)}</div>
      {a.interpretation&&<p className="mt-4 text-sm leading-7 text-slate-600">{a.interpretation}</p>}
    </article>)}</div>
    <div className="rounded-3xl border border-slate-200 bg-white p-6"><h3 className="text-xl font-semibold">Kandidat fokus latihan</h3>
      <p className="mt-3 text-xs leading-6 text-slate-500">{report.priorityExplanation}</p>
      {report.priorities.length===0?<p className="mt-4 text-sm text-slate-600">Belum cukup bukti atau relevansi untuk menentukan fokus. Gunakan hasil sebagai awal percakapan pengembangan.</p>:
        report.priorities.map(p=><article key={p.code} className="mt-5 rounded-2xl bg-slate-50 p-5"><h4 className="font-semibold">{p.name}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{p.reason}</p>
          {p.practice&&<div className="mt-3 space-y-2 text-sm leading-6 text-slate-700"><p><span className="font-medium">Latihan: </span>{p.practice.focus}</p><p>{p.practice.context}</p><p>{p.practice.successIndicator}</p><p>{p.practice.followUp}</p></div>}</article>)}
    </div>
    {!!report.solutions?.items.length&&<div className="rounded-3xl border border-slate-200 bg-white p-6"><h3 className="text-xl font-semibold">Pilihan pengembangan terkait</h3>
      <div className="mt-5 space-y-3">{report.solutions.items.map(s=><a key={s.title} href={s.url} className="block rounded-2xl border border-slate-200 p-5 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4">
        <h4 className="font-semibold">{s.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{s.reason}</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-medium">Jelajahi katalog<ArrowRight size={15}/></span></a>)}</div></div>}
    {report.metadata&&<details className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-600"><summary className="min-h-8 cursor-pointer font-medium">Versi dan metodologi laporan</summary>
      <p className="mt-3">Instrumen: {report.metadata.instrumentId} · {report.metadata.instrumentVersion}</p><p>Skoring: {report.metadata.scoringVersion}</p><p>Laporan: {report.metadata.reportVersion}</p><p>Prioritas: {report.metadata.priorityVersion}</p><p>Instrumen dalam tahap pengembangan/pilot; bukan validasi empiris.</p></details>}
    {report.privacy&&<div className="rounded-2xl bg-white p-5 text-xs leading-6 text-slate-600"><h3 className="font-semibold">Penggunaan data dan bantuan</h3><p className="mt-2">{report.privacy.purpose}</p><p>{report.privacy.access}</p><p className="mt-2">{report.privacy.process}</p><a className="inline-flex min-h-11 items-center underline" href={`mailto:${report.privacy.contact}`}>{report.privacy.contact}</a></div>}
    <p className="px-2 text-xs leading-6 text-slate-500">{report.notice} Akses data sampai {new Date(retentionUntil).toLocaleDateString('id-ID')}.</p>
  </section>;
}
