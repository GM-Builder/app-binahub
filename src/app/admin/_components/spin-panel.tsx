'use client';
import { useCallback,useEffect,useRef,useState } from 'react';
import { ArrowRight,RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';
import { SpinReport } from '@/components/spin-report';
import { type SpinReport as Report } from '@/lib/spin-client';
import { spinLabel,type SpinAnswers,type SpinDefinition } from '@/lib/spin-form';
import { SpinMeetingChecklist } from './spin-meeting-checklist';
import { SpinMeetingCreate } from './spin-meeting-create';
import type { MeetingChecklist } from '../_lib/spin-meeting';
import { SpinInbox, type SpinInboxRow } from './spin-inbox';
type RecordRow=SpinInboxRow;
type Detail=RecordRow&{summary:Record<string,string>;answers:SpinAnswers;internal_report:Record<string,unknown>|null;report:Report|null;marketing_consent:boolean;attempts:number};
type Delivery={id:string;status:string;attempts:number;sent_at:string|null;provider_id:string|null};
const labels:Record<string,string>={draft:'Draft',queued:'Dalam antrean',processing:'Menyusun laporan',ready:'Laporan tersedia',failed:'Perlu penanganan',pending:'Menunggu pengiriman',sending:'Mengirim',sent:'Terkirim',uncertain:'Perlu rekonsiliasi'};
export function SpinPanel({initialSearch='',onUnsavedChange}:{initialSearch?:string;onUnsavedChange?:(dirty:boolean)=>void}={}){
 const [rows,setRows]=useState<RecordRow[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(0),[detail,setDetail]=useState<Detail|null>(null),[jobs,setJobs]=useState<Delivery[]>([]),[selected,setSelected]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[search,setSearch]=useState(initialSearch),[reload,setReload]=useState(0),[busy,setBusy]=useState(false);
 const lock=useRef(false),[definition,setDefinition]=useState<SpinDefinition|null>(null);
 const [creating,setCreating]=useState(false),[tab,setTab]=useState<'meeting'|'report'>('meeting'),[meetingReady,setMeetingReady]=useState(true),[debouncedSearch,setDebouncedSearch]=useState(initialSearch);
 const unsaved=useRef(false),detailHeading=useRef<HTMLHeadingElement>(null);
 const [selectedRow,setSelectedRow]=useState<RecordRow|null>(null);
 const [listError,setListError]=useState(''),[loadedKey,setLoadedKey]=useState(''),[inboxReload,setInboxReload]=useState(0);
 const normalizedSearch=search.trim(),requestKey=JSON.stringify([page,normalizedSearch,reload,inboxReload]);
 const listLoading=loading||normalizedSearch!==debouncedSearch.trim()||loadedKey!==requestKey;
 const onDirty=useCallback((dirty:boolean)=>{unsaved.current=dirty;onUnsavedChange?.(dirty);},[onUnsavedChange]);
 const onSaved=useCallback((value:MeetingChecklist)=>{setRows(current=>current.map(row=>row.id===value.id?{...row,meeting_status:value.status}:row));},[]);
 const mayLeave=()=>!unsaved.current||window.confirm('Ada perubahan checklist yang belum tersimpan. Tetap tinggalkan sesi ini?');
 useEffect(()=>{const timer=setTimeout(()=>setDebouncedSearch(search),300);return()=>clearTimeout(timer);},[search]);
 useEffect(()=>{
  if(normalizedSearch!==debouncedSearch.trim())return;
  let active=true,timedOut=false,failureMessage='';const controller=new AbortController();
  const timeout=setTimeout(()=>{if(!active)return;timedOut=true;controller.abort();setRows([]);setTotal(0);setLoadedKey(requestKey);setListError('Memuat daftar terlalu lama. Periksa koneksi, lalu coba lagi.');setLoading(false);},20000);
  void Promise.resolve().then(async()=>{
   if(!active)return;
   setLoading(true);setListError('');
   const query='page='+page+'&search='+encodeURIComponent(normalizedSearch);
   let response=await apiFetch('/api/admin/discovery/meetings?'+query,{signal:controller.signal,cache:'no-store'});
   if(!active||timedOut)return;
   const ready=response.ok;
   if(!ready&&(response.status===404||response.status===503))response=await apiFetch('/api/admin/discovery?'+query,{signal:controller.signal,cache:'no-store'});
   if(!response.ok){failureMessage=response.status===401||response.status===403?'Sesi admin tidak tersedia. Silakan masuk kembali.':response.status===429?'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.':'Daftar kebutuhan belum dapat dimuat. Silakan coba lagi.';throw new Error(failureMessage);}
   const body=await response.json();
   if(!ready&&normalizedSearch&&body.searchApplied!==true){failureMessage='Pencarian arsip memerlukan pembaruan API. Perbarui API, lalu coba lagi.';throw new Error(failureMessage);}
   if(!Array.isArray(body.records)||!Number.isSafeInteger(body.total)||body.total<0)throw new Error('Respons daftar belum dapat dibaca. Silakan coba lagi.');
   if(!active||timedOut)return;
   setMeetingReady(ready);
   const lastPage=Math.max(0,Math.ceil(body.total/20)-1);
   if(page>lastPage){setPage(lastPage);return;}
   setRows(body.records);setTotal(body.total);setLoadedKey(requestKey);
  }).catch(()=>{if(active){setRows([]);setTotal(0);setLoadedKey(requestKey);setListError(timedOut?'Memuat daftar terlalu lama. Periksa koneksi, lalu coba lagi.':failureMessage||'Daftar kebutuhan belum dapat dimuat. Periksa koneksi atau sesi admin, lalu coba lagi.');}})
  .finally(()=>{clearTimeout(timeout);if(active)setLoading(false);});
  return()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[page,reload,inboxReload,normalizedSearch,debouncedSearch,requestKey]);
 useEffect(()=>{if(!selected)return;let active=true;const controller=new AbortController();
 void Promise.resolve().then(async()=>{if(active){setDetail(null);setError('');}
 if(selectedRow?.has_source===false){if(active){setDetail({...selectedRow,summary:{},answers:{},internal_report:null,report:null,marketing_consent:false,attempts:0});setJobs([]);setDefinition(null);}return;}
 const response=await apiFetch('/api/admin/discovery?id='+selected,{signal:controller.signal,cache:'no-store'});const b=await response.json();if(!response.ok)throw new Error(b.error);if(active){setDetail(b.record);setJobs(b.delivery);setDefinition(b.definition);}})
 .catch(e=>{if(active)setError(e.message);});return()=>{active=false;controller.abort();};},[selected,selectedRow,reload]);
 useEffect(()=>{if(detail)detailHeading.current?.focus();},[detail]);
 function open(row:RecordRow){if(mayLeave()){setSelectedRow(row);setSelected(row.id);setMessage('');setCreating(false);setTab(meetingReady?'meeting':'report');}}
 function created(value:MeetingChecklist){const row:RecordRow={id:value.id,contact:value.contact,status:'meeting',submitted_at:value.updated_at||new Date().toISOString(),has_source:false,meeting_status:value.status};setReload(x=>x+1);open(row);}
 async function retry(){if(lock.current||!selected)return;lock.current=true;setBusy(true);setError('');try{const r=await apiFetch('/api/admin/discovery/'+selected+'/retry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'process_pending'})});const b=await r.json();if(!r.ok)throw new Error(b.error);setMessage(b.message);setReload(x=>x+1);}catch(e){setError(e instanceof Error?e.message:'Permintaan gagal.');}finally{lock.current=false;setBusy(false);}}
 return <section className="space-y-5"><header className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight text-slate-950">Kebutuhan program</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Lihat pengisian klien dan lengkapi kebutuhan saat konsultasi, dalam satu tempat.</p></div><div className="flex flex-wrap gap-2"><a href="/discovery" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#0B2C6B]">Buka formulir<ArrowRight size={15} aria-hidden="true"/></a><button type="button" disabled={!meetingReady} onClick={()=>{if(mayLeave()){setSelected('');setSelectedRow(null);setCreating(true);}}} className="min-h-11 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-50">Mulai checklist</button></div></header>
 {!meetingReady&&<p role="status" className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">Pengisian dan laporan tetap dapat dilihat. Checklist meeting tersedia setelah pembaruan API dan database diterapkan.</p>}
 {creating&&<SpinMeetingCreate onCreated={created} onCancel={()=>setCreating(false)}/>}
 {error&&<div role="alert" className="text-sm leading-6 text-red-700">{error}<button onClick={()=>setReload(x=>x+1)} className="ml-3 min-h-11 font-semibold underline">Coba lagi</button></div>}{message&&<p role="status" className="text-sm leading-6 text-slate-600">{message}</p>}
 <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]"><SpinInbox rows={rows} total={total} page={page} search={search} loading={listLoading} error={listError} selected={selected} meetingReady={meetingReady} onSearch={value=>{setSearch(value);setPage(0);}} onPage={setPage} onOpen={open} onRetry={()=>setInboxReload(x=>x+1)}/>
 <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">{!selected?<div className="py-12"><h3 className="text-lg font-semibold text-slate-950">Buka kebutuhan klien sebelum meeting</h3><p className="mt-3 text-sm leading-7 text-slate-600">Pilih pengisian klien untuk melihat jawaban dan melanjutkan bagian yang belum diisi. Klien belum mengisi? Gunakan “Mulai checklist”.</p></div>:!detail?<p role="status" className="py-12 text-sm text-slate-600">Memuat konteks klien…</p>:<><header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><h3 ref={detailHeading} tabIndex={-1} className="text-lg font-semibold text-slate-950 focus:outline-none">{detail.contact.company}</h3><p className="mt-1 break-words text-sm leading-6 text-slate-600">{detail.contact.name} · {detail.contact.email}</p><p className="mt-2 text-xs text-slate-600">{selectedRow?.has_source===false?'Checklist dimulai oleh admin':'Status laporan: '+(labels[detail.status]||detail.status)}</p></div><button disabled={busy} onClick={()=>{if(mayLeave())setReload(x=>x+1);}} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold"><RefreshCw size={14} aria-hidden="true"/>Perbarui</button></header>
 {meetingReady&&<nav aria-label="Tampilan kebutuhan klien" className="mt-4 flex flex-wrap gap-2">{(['meeting','report'] as const).filter(value=>value!=='report'||selectedRow?.has_source!==false).map(value=><button type="button" key={value} aria-pressed={tab===value} onClick={()=>{if(value===tab||mayLeave())setTab(value);}} className={'min-h-11 rounded-xl px-4 text-sm font-semibold '+(tab===value?'bg-[#0B2C6B] text-white':'text-slate-700 hover:bg-slate-50')}>{value==='meeting'?'Checklist meeting':'Pengisian & laporan klien'}</button>)}</nav>}
 {meetingReady&&tab==='meeting'?<SpinMeetingChecklist key={selected+':'+reload} id={selected} onSaved={onSaved} onDirty={onDirty}/>:<>
 <section className="my-6"><h4 className="text-sm font-semibold">Pengiriman</h4><ul className="mt-2 space-y-2">{jobs.map(j=><li key={j.id} className="text-sm text-slate-600">{labels[j.status]||j.status}{j.sent_at?' · '+new Date(j.sent_at).toLocaleString('id-ID'):''}{j.status==='uncertain'?' — Periksa di penyedia email sebelum mengirim ulang.':''}</li>)}</ul>{!jobs.length&&<p className="mt-2 text-sm text-slate-600">Email belum masuk antrean. Laporan disiapkan terlebih dahulu.</p>}{(detail.status==='failed'||detail.status==='queued'||jobs.some(j=>j.status==='pending'))&&<button disabled={busy} onClick={retry} className="mt-3 min-h-11 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white disabled:opacity-50">{busy?'Meminta pemrosesan…':'Proses antrean yang menunggu'}</button>}</section>
 {detail.report?<SpinReport report={detail.report}/>:<section><h4 className="text-base font-semibold">Brief Self Diagnostic</h4><dl className="mt-3 space-y-4">{Object.entries(detail.summary||{}).map(([k,v])=><div key={k}><dt className="text-xs font-semibold text-slate-600">{{situation:'Situasi',problem:'Tantangan',impact:'Dampak',outcome:'Harapan'}[k]||k}</dt><dd className="mt-1 text-sm leading-7">{v}</dd></div>)}</dl></section>}
 <details className="mt-8 border-t border-slate-200 pt-5"><summary className="min-h-11 cursor-pointer text-sm font-semibold text-[#0B2C6B]">Rincian jawaban dan analisis internal</summary><p className="mt-3 text-xs leading-6 text-slate-600">Catatan berikut hanya untuk tim BinaHub; tidak ada dalam laporan klien. Izin pemasaran: {detail.marketing_consent?'Diberikan':'Tidak diberikan'}.</p><dl className="mt-4 divide-y divide-slate-100">{definition?.fields.filter(f=>detail.answers[f.key]!==undefined).map(f=><div key={f.key} className="py-3"><dt className="text-xs font-semibold leading-6 text-slate-600">{f.label}</dt><dd className="mt-1 whitespace-pre-line break-words text-sm leading-7 text-slate-900">{spinLabel(definition,detail.answers,f.key)}</dd></div>)}</dl><details className="mt-4"><summary className="min-h-11 cursor-pointer text-xs font-semibold text-slate-600">Catatan teknis untuk penelusuran</summary><pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-xs leading-6">{JSON.stringify(detail.internal_report,null,2)}</pre></details></details></>}
 </>}
 </section></div></section>;
}
