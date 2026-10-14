"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, LockKeyhole } from 'lucide-react';
import { guestRequest } from '@/lib/pe-guest';
import type { PEReport, PEReviewAccess } from '@/lib/individual-assessment';
import { PEResult } from './individual-assessment';
import { PEReviewAccessPanel } from './pe-review-access';
type Result = { report: PEReport; access: PEReviewAccess; retentionUntil: string };
export function PEEmailResult() {
  const params=useSearchParams(), id=params.get('attempt')||'';
  return <PEEmailResultBody key={id} id={id}/>;
}
function PEEmailResultBody({id}:{id:string}) {
  const [token,setToken]=useState(''),[result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [email,setEmail]=useState(''),[deleted,setDeleted]=useState(false),[confirmDelete,setConfirmDelete]=useState(false);
  const [sessionReady,setSessionReady]=useState(false);
  const lock=useRef(false);
  const pendingLink=useRef({id:'',token:''});
  useEffect(()=>{
    let alive=true;
    const link=new URLSearchParams(window.location.hash.slice(1)).get('access')||'';
    if(pendingLink.current.id!==id)pendingLink.current={id,token:''};
    if(link){pendingLink.current.token=/^[a-f0-9]{64}$/.test(link)?link:'';window.history.replaceState(null,'',window.location.pathname+window.location.search);}
    if(pendingLink.current.token)void Promise.resolve().then(()=>{if(alive)setToken(pendingLink.current.token);});
    else if(/^[a-f0-9-]{36}$/i.test(id))void guestRequest<Result>(`/${id}/result`).then(value=>{if(alive)setResult(value);}).catch(()=>undefined);
    return()=>{alive=false;};
  },[id]);
  async function run(action:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
    try{await action();}catch(failure){setError(failure instanceof Error?failure.message:'Belum dapat memuat hasil.');}finally{lock.current=false;setBusy(false);}}
  async function open(){await run(async()=>{
    if(token){await guestRequest(`/${id}/result`,'POST',{token});setToken('');pendingLink.current.token='';setSessionReady(true);}
    setResult(await guestRequest<Result>(`/${id}/result`));
  });}
  return <main className="min-h-screen bg-[#F7F8FA] px-4 py-6 text-[#0B2C6B]"><div className="mx-auto max-w-3xl">
    <Link href="/diagnose" className="inline-flex min-h-11 items-center text-sm">BinaHub · Pilihan diagnosis</Link>
    {error&&<p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{error}</p>}
    {message&&<p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {deleted?<section className="mt-8 rounded-2xl bg-white p-6"><h1 className="text-2xl font-semibold">Pengisian sudah dihapus.</h1><p className="mt-3 text-sm leading-7">Jawaban, hasil, dan akses terkait pengisian ini telah dihapus dari sistem aktif.</p></section>
    :result?<><PEResult report={result.report} retentionUntil={result.retentionUntil}/>
      <PEReviewAccessPanel id={id} access={result.access} token={async()=>''} onChange={access=>setResult({...result,access})} update={body=>guestRequest(`/${id}/result`,'PATCH',body)}/>
      <button disabled={busy} className="mt-5 min-h-11 text-sm underline" onClick={()=>setConfirmDelete(true)}>Hapus data pengisian</button>
      {confirmDelete&&<section role="alertdialog" aria-labelledby="pe-guest-delete" className="mt-4 rounded-xl border border-red-200 bg-white p-5"><h2 id="pe-guest-delete" className="font-semibold">Hapus jawaban dan hasil ini?</h2><p className="mt-2 text-sm leading-7">Penghapusan tidak dapat dipulihkan. Salinan yang sudah Anda unduh atau yang pernah dibaca penerima berizin tidak dapat ditarik kembali.</p><div className="mt-4 flex gap-3"><button disabled={busy} className="min-h-11 rounded-xl border px-4 text-sm" onClick={()=>setConfirmDelete(false)}>Batal</button><button disabled={busy} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm text-white" onClick={()=>void run(async()=>{await guestRequest(`/${id}/result`,'DELETE');setResult(null);setDeleted(true);})}>Ya, hapus data</button></div></section>}</>
    :<section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><LockKeyhole size={24} className="text-amber-700"/><h1 className="mt-4 text-2xl font-semibold">Buka hasil pribadi Anda.</h1><p className="mt-3 text-sm leading-7 text-slate-600">Gunakan tautan yang dikirim ke email Anda. Tidak perlu membuat akun atau password.</p>
      <button disabled={busy||(!token&&!sessionReady)} onClick={()=>void open()} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white disabled:opacity-50">{busy&&<Loader2 className="motion-safe:animate-spin" size={17}/>}Buka hasil diagnosis</button>
      <form className="mt-7 space-y-3 border-t border-slate-100 pt-5" onSubmit={event=>{event.preventDefault();void run(async()=>{await guestRequest(/^[a-f0-9-]{36}$/i.test(id)?`/${id}/request-link`:'/request-link','POST',{email:email.trim().toLowerCase()});setMessage('Jika data cocok, tautan hasil akan dikirim ke email Anda.');});}}>
        <h2 className="font-semibold">Tautan kedaluwarsa atau belum diterima?</h2><label className="block text-sm">Email yang dipakai saat mengisi<input required type="email" value={email} maxLength={254} disabled={busy} onChange={event=>setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-4"/></label><button disabled={busy} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-medium">Kirim tautan baru</button>
      </form><p className="mt-5 text-xs leading-6 text-slate-500">Tautan berlaku 48 jam, sekali pakai. Sesi hasil berlaku 30 menit. Jangan membagikan tautan ini. Bantuan: admin@binahub.id.</p></section>}
  </div></main>;
}
