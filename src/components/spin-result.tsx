'use client';
import { useEffect,useRef,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download,LoaderCircle,LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { spinRequest,type SpinReport as Report } from '@/lib/spin-client';
import { SpinReport } from './spin-report';
export function SpinResult(){
 const params=useSearchParams(),id=params.get('id')||'',[token,setToken]=useState(''),[link,setLink]=useState(''),[session,setSession]=useState(''),[report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[email,setEmail]=useState('');
 const lock=useRef(false),pending=useRef({key:'',link:''});
 useEffect(()=>{
  const h=new URLSearchParams(window.location.hash.slice(1));if(h.has('access')){pending.current={key:h.get('access')||'',link:h.get('link')||''};window.history.replaceState(null,'',window.location.pathname+window.location.search);}
  let active=true;void Promise.resolve().then(async()=>{
   if(!active)return;setToken(pending.current.key);setLink(pending.current.link);
   let stored='';try{stored=sessionStorage.getItem('spin-result-'+id)||'';}catch{}
   if(stored&&/^[a-f0-9]{64}$/.test(stored)){try{const r=await spinRequest<{report:Report}>('/'+id+'/result',{action:'read',session:stored});if(active){setSession(stored);setReport(r.report);}}catch{if(active)setMessage('Sesi sebelumnya sudah berakhir. Buka tautan dari email atau minta tautan baru.');}}
  });return()=>{active=false;};},[id]);
 async function open(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const r=await spinRequest<{report:Report;session:string}>('/'+id+'/result',{action:'open',linkId:link,key:token});setReport(r.report);setSession(r.session);pending.current={key:'',link:''};setToken('');try{sessionStorage.setItem('spin-result-'+id,r.session);}catch{}}
  catch(e){setError(e instanceof Error?e.message:'Laporan belum dapat dibuka.');}finally{lock.current=false;setBusy(false);}
 }
 async function requestLink(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const r=await spinRequest<{message:string}>('/'+id+'/request-link',{email,website:''});setMessage(r.message);}catch(e){setError(e instanceof Error?e.message:'Tautan belum dapat diminta.');}finally{lock.current=false;setBusy(false);}
 }
 async function download(){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const response=await fetch('/api/discovery/spin/'+id+'/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pdf',session})});
   if(!response.ok)throw new Error('PDF belum dapat diunduh. Sesi mungkin berakhir; buka tautan baru dari email.');
   const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='BinaHub-Rekomendasi-Pengembangan.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){setError(e instanceof Error?e.message:'PDF belum dapat diunduh.');}finally{lock.current=false;setBusy(false);}
 }
 return <main className="min-h-svh bg-[#F7F8FA] px-5 py-7 text-slate-900"><div className="mx-auto max-w-3xl"><header className="mb-6 flex flex-wrap items-center justify-between gap-4"><Link className="rounded-md text-lg font-semibold text-[#0B2C6B]" href="/diagnose">BinaHub</Link>{report&&<button type="button" disabled={busy} onClick={download} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#0B2C6B]">{busy?<LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true"/>:<Download size={16} aria-hidden="true"/>}Unduh PDF</button>}</header>
 {error&&<p role="alert" className="mb-5 text-sm leading-6 text-red-700">{error}</p>}
 {report?<div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-9"><SpinReport report={report}/></div>:<section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9"><LockKeyhole size={25} className="text-[#0B2C6B]" aria-hidden="true"/><h1 className="mt-5 text-2xl font-semibold tracking-tight text-[#0B2C6B]">Rekomendasi pengembangan Anda</h1><p className="mt-3 text-sm leading-7 text-slate-600">Buka laporan melalui akses pribadi dari email Anda. Gunakan PDF untuk membagikannya kepada tim.</p>{token&&link&&<button type="button" disabled={busy} onClick={open} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white">{busy&&<LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden="true"/>}Buka laporan saya</button>}
 <form className="mt-8 border-t border-slate-200 pt-5" onSubmit={e=>{e.preventDefault();void requestLink();}}><h2 className="text-base font-semibold">Butuh tautan baru?</h2><label className="mt-3 block text-sm text-slate-600">Email yang digunakan saat pengisian<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"/></label><button disabled={busy||!id} className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#0B2C6B]">Kirim tautan baru</button></form>{message&&<p role="status" className="mt-4 text-sm leading-7 text-slate-600">{message}</p>}</section>}<p className="mt-5 text-xs leading-6 text-slate-600">Bantuan akses, koreksi, atau permintaan penghapusan data: <a className="underline underline-offset-4" href="mailto:admin@binahub.id">admin@binahub.id</a>.</p></div></main>;
}
