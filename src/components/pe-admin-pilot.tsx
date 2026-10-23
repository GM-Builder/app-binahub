"use client";
import { useEffect,useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowRight,Download,Loader2,Pause,Play,RefreshCw,ShieldCheck,X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AssessmentAudienceNav } from './assessment-audience-nav';
import { PEResult } from './individual-assessment';
import { peAreaNames,peChannelNames,type PECase,type PEDetail,type PEPilotDashboard } from '@/lib/pe-pilot';

type Data={dashboard:PEPilotDashboard;cases:PECase[]};
const deliveryLabels:Record<string,string>={pending:'Menunggu diproses',processing:'Sedang diproses',sent:'Diterima layanan email',failed:'Perlu pemeriksaan pengiriman',uncertain:'Perlu konfirmasi status pengiriman'};
const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-blue-950 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4';
async function request<T>(query='',method='GET',body?:unknown):Promise<T>{
  const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('Sesi berakhir. Masuk kembali.');
  const response=await fetch('/api/admin/assessments/individual'+query,{method,cache:'no-store',signal:AbortSignal.timeout(20_000),
    headers:{Authorization:`Bearer ${data.session.access_token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const result=await response.json().catch(()=>null);if(!response.ok||result?.success!==true)throw new Error(result?.error||'Data belum dapat dimuat.');
  const current=await supabase.auth.getSession();if(current.data.session?.user.id!==data.session.user.id)throw new Error('Sesi berubah. Muat ulang halaman.');
  return result;
}

export function PEAdminPilot(){
  const [data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [revision,setRevision]=useState(0),[tab,setTab]=useState<'results'|'pilot'>('results'),[query,setQuery]=useState('');
  const [hasMore,setHasMore]=useState(false);
  const [selected,setSelected]=useState<string|null>(null),[detail,setDetail]=useState<PEDetail|null>(null),[detailError,setDetailError]=useState('');
  const lock=useRef(false),detailGeneration=useRef(0),entryHandled=useRef(false);
  useEffect(()=>{
    let alive=true;
    void request<Data>().then(value=>{if(alive){setData(value);setHasMore(value.cases.length===20);
      if(!entryHandled.current){entryHandled.current=true;const id=new URLSearchParams(window.location.search).get('attempt');
        if(id&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))setSelected(id);}
    }}).catch(failure=>{if(alive)setError(failure.message);}).finally(()=>{if(alive)setLoading(false);});
    const listener=supabase.auth.onAuthStateChange?.((event)=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN'){detailGeneration.current++;setData(null);setDetail(null);setError('Sesi berubah. Muat ulang halaman.');}});
    return()=>{alive=false;listener?.data.subscription.unsubscribe();};
  },[revision]);
  useEffect(()=>{
    let alive=true;const generation=++detailGeneration.current;if(!selected)return;
    void request<{detail:PEDetail}>(`?id=${selected}`).then(value=>{if(alive&&generation===detailGeneration.current)setDetail(value.detail);})
      .catch(failure=>{if(alive&&generation===detailGeneration.current)setDetailError(failure.message);});
    return()=>{alive=false;};
  },[selected,revision]);
  function refresh(){setLoading(true);setError('');setDetail(null);setDetailError('');setRevision(n=>n+1);}
  function choose(id:string){setDetail(null);setDetailError('');setSelected(id);}
  async function control(status:PEPilotDashboard['status']){
    if(lock.current||!data)return;lock.current=true;setBusy(true);setError('');
    try{const result=await request<{dashboard:PEPilotDashboard}>('','PATCH',{status,revision:data.dashboard.revision});
      setData(current=>current?{...current,dashboard:result.dashboard}:current);
    }catch(failure){setError(failure instanceof Error?failure.message:'Belum tersimpan.');}
    finally{lock.current=false;setBusy(false);}
  }
  async function more(){
    if(lock.current||!data?.cases.length)return;lock.current=true;setBusy(true);setError('');
    try{const last=data.cases.at(-1)!;const result=await request<Data>(`?before=${encodeURIComponent(last.createdAt)}&beforeId=${last.id}`);
      setHasMore(result.cases.length===20);
      setData(current=>current?{dashboard:result.dashboard,cases:[...current.cases,...result.cases.filter(c=>!current.cases.some(old=>old.id===c.id))]}:current);
    }catch(failure){setError(failure instanceof Error?failure.message:'Belum dapat memuat.');}finally{lock.current=false;setBusy(false);}
  }
  function download(){
    if(!data)return;const blob=new Blob([JSON.stringify({version:'pe-pilot-aggregate-v1',exportedAt:new Date().toISOString(),...data.dashboard},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='binainsights-pilot-agregat.json';anchor.click();URL.revokeObjectURL(url);
  }
  async function exportEvaluation(){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{
      const result=await request<{evaluation:unknown}>('/export');
      const url=URL.createObjectURL(new Blob([JSON.stringify(result.evaluation,null,2)],{type:'application/json'}));
      const anchor=document.createElement('a');anchor.href=url;anchor.download='binainsights-evaluasi-berkode.json';anchor.click();URL.revokeObjectURL(url);
    }catch(failure){setError(failure instanceof Error?failure.message:'Ekspor belum tersedia.');}finally{lock.current=false;setBusy(false);}
  }
  const visible=data?.cases.filter(c=>`${c.role} ${c.goal} ${peChannelNames[c.channel]}`.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID')))||[];
  return <div className="mx-auto max-w-7xl space-y-6 text-slate-900"><AssessmentAudienceNav individual/>
    <section className="rounded-3xl bg-[#0B2C6B] p-6 text-white sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-200">Personal Effectiveness</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Pahami orangnya. Arahkan pengembangannya.</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">Konteks, jawaban, dan rekomendasi dalam satu ruang tinjau. Terpisah dari assessment organisasi dan skor minat penjualan.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/assessments/individual/commerce" className={button}>Transaksi & paket<ArrowRight size={16} aria-hidden="true"/></Link><button onClick={refresh} disabled={loading||busy} className={button}><RefreshCw size={16}/>Perbarui</button></div></div>
      {data&&<dl className="mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-6 sm:grid-cols-4">{[
        ['Pengisian',data.dashboard.counts.started],['Hasil selesai',data.dashboard.counts.submitted],['Draft',data.dashboard.counts.drafts],['Izin tinjau',data.dashboard.counts.shared]
      ].map(([label,value])=><div key={label}><dt className="text-xs text-blue-200">{label}</dt><dd className="mt-2 text-3xl font-semibold">{value}</dd></div>)}</dl>}
    </section>
    {error&&<div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">{error} <button onClick={refresh} className="ml-2 underline">Muat ulang</button></div>}
    {loading?<div role="status" className="flex min-h-44 items-center justify-center gap-3"><Loader2 className="animate-spin"/>Memuat diagnosis individu…</div>:data&&<>
      <div role="tablist" aria-label="Ruang diagnosis individu" className="flex gap-2">{[{id:'results',label:'Hasil & konteks'},{id:'pilot',label:'Evaluasi pilot'}].map(t=>
        <button key={t.id} role="tab" aria-selected={tab===t.id} onClick={()=>setTab(t.id as typeof tab)} className={`${button} ${tab===t.id?'border-blue-900 bg-blue-50':''}`}>{t.label}</button>)}</div>
      {tab==='results'?<section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold">Pengisian yang dapat ditinjau</h3>
        <label className="sr-only" htmlFor="pe-case-search">Cari konteks atau sumber</label><input id="pe-case-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari peran, tujuan, sumber…" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm sm:max-w-xs"/></div>
        <p className="flex items-start gap-2 text-xs leading-6 text-slate-500"><ShieldCheck size={16} className="mt-1 shrink-0"/>Hanya pengisian dengan izin peserta yang muncul. Hasil lama tetap pribadi sampai peserta mengizinkan. Pencarian berlaku pada {data.cases.length} pengisian yang sudah dimuat.</p>
        {visible.length===0?<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8"><h4 className="font-semibold">{data.cases.length?'Tidak ada konteks yang cocok.':'Belum ada hasil dengan izin tinjau.'}</h4><p className="mt-3 text-sm leading-7 text-slate-500">Peserta dapat memberi izin saat mulai atau dari bagian Kendali hasil pada laporan pribadinya.</p><Link href="/insight/individual" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-900">Buka alur peserta<ArrowRight size={16}/></Link></div>:
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map(c=><button key={c.id} onClick={()=>choose(c.id)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-900 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4">
            <div className="flex items-center justify-between gap-3 text-xs"><span className={`rounded-full px-2.5 py-1 ${c.status==='submitted'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-800'}`}>{c.status==='submitted'?'Hasil tersedia':'Sedang mengisi'}</span><span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString('id-ID')}</span></div>
            <h4 className="mt-4 font-semibold">{c.role}</h4><p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">{c.goal}</p><p className="mt-4 text-xs text-slate-500">{peChannelNames[c.channel]} · {c.id.slice(0,8)}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-900">Tinjau konteks & hasil<ArrowRight size={15}/></span></button>)}</div>}
        {hasMore&&<button onClick={()=>void more()} disabled={busy} className={button}>Muat pengisian berikutnya</button>}
      </section>:<section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-semibold">Pilot pengembangan</h3><p className="mt-2 text-sm text-slate-600">Review substansi CEO sudah tercatat per versi. Tidak ada persetujuan manual untuk setiap peserta.</p></div><span className="self-start rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">{data.dashboard.status==='collecting'?'Pengisian baru aktif':data.dashboard.status==='paused'?'Pengisian baru dijeda':'Pengumpulan ditutup'}</span></div>
        <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={()=>void control(data.dashboard.status==='collecting'?'paused':'collecting')} className={button}>{busy?<Loader2 size={16} className="animate-spin"/>:data.dashboard.status==='collecting'?<Pause size={16}/>:<Play size={16}/>}{data.dashboard.status==='collecting'?'Jeda pengisian baru':'Lanjutkan pengisian baru'}</button>
          <button disabled={busy} onClick={download} className={button}><Download size={16}/>Ekspor statistik</button>
          <button disabled={busy} onClick={()=>void exportEvaluation()} className={button}><Download size={16}/>Ekspor data evaluasi</button></div>
        <p className="text-xs leading-6 text-slate-500">Jeda tidak menghapus data atau menghalangi draft/hasil lama. Ekspor statistik hanya berisi agregat. Ekspor data evaluasi berisi jawaban dan skor berkode dari sedikitnya lima pengisian dengan izin khusus—tanpa nama, email, atau konteks pribadi. Simpan hanya di ruang evaluasi berizin; jangan dibagikan atau digunakan untuk mengidentifikasi peserta.</p>
        <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold">{data.dashboard.evaluationSampleSize} hasil dengan izin evaluasi</p><p className="mt-2 text-xs leading-6 text-slate-500">Hasil selesai terbaru per pemilik pengisian; pengisian tanpa akun tidak memastikan orang unik. Rata-rata ditampilkan setelah sedikitnya lima hasil berizin—bukan ukuran kecukupan validasi. File evaluasi memuat distribusi pilihan dan NA serta durasi yang mencakup jeda, bukan waktu aktif.</p></div>
        {data.dashboard.areas.length?<div className="grid gap-4 md:grid-cols-3">{data.dashboard.areas.map(a=><article key={a.code} className="rounded-2xl border border-slate-200 p-5"><h4 className="font-semibold">{peAreaNames[a.code]}</h4><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Rata-rata pengalaman kerja</dt><dd className="mt-1 font-semibold">{a.selfReportMean??'Belum cukup bukti'}</dd></div><div><dt className="text-slate-500">Rata-rata studi kasus</dt><dd className="mt-1 font-semibold">{a.sjtMean??'Belum cukup bukti'}</dd></div><div><dt className="text-slate-500">Rata-rata NA per peserta</dt><dd className="mt-1 font-semibold">{a.meanNACount} dari 4 soal</dd></div></dl></article>)}</div>:<p className="text-sm text-slate-600">Statistik skor belum ditampilkan untuk menjaga privasi kelompok kecil.</p>}
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500">Kejelasan pertanyaan</p><p className="mt-2 text-2xl font-semibold">{data.dashboard.feedback.clarityMean??'—'}<span className="text-sm text-slate-400"> / 5</span></p></div><div className="rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-500">Kegunaan hasil</p><p className="mt-2 text-2xl font-semibold">{data.dashboard.feedback.usefulnessMean??'—'}<span className="text-sm text-slate-400"> / 5</span></p></div></div>
        <p className="rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-950">Ini pemantauan operasional dan evaluasi awal, bukan bukti validitas, norma, atau kelayakan seleksi/promosi. Scoring instrumen 1.0.0-draft.1 tidak diubah. Format PDF final CEO, pembayaran, dan proposal individu tetap belum diaktifkan.</p>
      </section>}
    </>}
    {selected&&<section aria-label="Detail diagnosis individu" className="rounded-3xl border border-blue-200 bg-[#F5F7FA] p-5 sm:p-8"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-semibold">Brief assessment individu</h3><button onClick={()=>setSelected(null)} className={button}><X size={16}/>Tutup detail</button></div>
      {detailError?<p role="alert" className="mt-5 text-sm text-red-700">{detailError} Akses mungkin sudah dicabut atau masa simpan berakhir.</p>:!detail?<p role="status" className="mt-6 flex items-center gap-2"><Loader2 className="animate-spin" size={18}/>Memuat konteks & hasil…</p>:<>
        <div className="mt-5 rounded-2xl bg-white p-5"><h4 className="font-semibold">{detail.participant.name||detail.context.role}</h4>{detail.participant.email&&<p className="mt-1 text-sm text-slate-500">{detail.participant.email}</p>}<p className="mt-3 text-sm leading-7"><span className="font-semibold">Peran: </span>{detail.context.role}</p><p className="text-sm leading-7"><span className="font-semibold">Tujuan: </span>{detail.context.goal}</p><p className="mt-2 text-xs text-slate-500">Sumber: {peChannelNames[detail.channel]} · {detail.id.slice(0,8)}</p></div>
        {detail.delivery&&<div role="status" className="mt-4 rounded-xl bg-white p-4 text-sm"><span className="font-semibold">Email hasil: </span>{deliveryLabels[detail.delivery.status]||'Belum tersedia'}{['failed','uncertain'].includes(detail.delivery.status)&&<p className="mt-2 text-xs leading-6 text-slate-500">Periksa riwayat pengiriman di layanan email sebelum mengirim ulang. Peserta juga dapat meminta tautan baru melalui Bantuan akses hasil. Status diterima layanan belum memastikan email masuk inbox.</p>}</div>}
        <details className="mt-4 rounded-2xl bg-white p-5"><summary className="min-h-8 cursor-pointer font-semibold">Jawaban peserta ({detail.answers.length})</summary><div className="mt-4 space-y-4">{detail.answers.map(a=><article key={a.id} className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-blue-800">{peAreaNames[a.areaCode]} · {a.id}</p>{a.scenario&&<p className="mt-2 text-sm leading-7 text-slate-500">{a.scenario}</p>}<p className="mt-2 text-sm leading-7">{a.prompt}</p><p className="mt-2 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">{a.answer}</p></article>)}</div></details>
        {detail.report?<><p className="mt-5 text-xs leading-6 text-slate-500">Model laporan dan rekomendasi berikut sama dengan yang tersedia bagi peserta. Skor dihitung dengan aturan CEO, bukan penilaian AI.</p><PEResult report={detail.report} retentionUntil={detail.retentionUntil}/></>:<p className="mt-5 text-sm text-slate-600">Peserta belum mengirim jawaban final. Belum ada skor atau rekomendasi.</p>}
      </>}
    </section>}
  </div>;
}
