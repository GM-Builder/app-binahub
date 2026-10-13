"use client";
import { useRef,useState } from 'react';
import { Loader2,ShieldCheck } from 'lucide-react';
import { peRequest,type PEReviewAccess } from '@/lib/individual-assessment';

export function PEReviewAccessPanel({id,access,token,onChange}:{id:string;access:PEReviewAccess;token:()=>Promise<string>;onChange:(access:PEReviewAccess)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [evaluate,setEvaluate]=useState(access.evaluationConsent),[clarity,setClarity]=useState(access.clarity?.toString()||''),
    [usefulness,setUsefulness]=useState(access.usefulness?.toString()||'');
  const lock=useRef(false);
  async function save(share:boolean,withFeedback=false) {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
    try {
      const result=await peRequest<{access:PEReviewAccess}>(await token(),`/${id}/access`,'PATCH',{
        share,consentVersion:share?'pe-consultant-review-v1':null,evaluate:withFeedback?evaluate:access.evaluationConsent,
        clarity:withFeedback&&evaluate?Number(clarity):null,usefulness:withFeedback&&evaluate?Number(usefulness):null});
      await token();onChange(result.access);setMessage('Pengaturan berhasil disimpan.');
    }catch(failure){setError(failure instanceof Error?failure.message:'Belum dapat menyimpan.');}
    finally{lock.current=false;setBusy(false);}
  }
  return <section className="mt-6 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-[#0B2C6B]">
    <div className="flex gap-3"><ShieldCheck size={22} aria-hidden="true"/><div><h2 className="text-lg font-semibold">Kendali hasil Anda</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{access.shared?'Tim BinaHub dapat meninjau profil, konteks, jawaban, dan hasil untuk membantu memberi rekomendasi.':'Hasil ini hanya tersedia bagi akun Anda. Izinkan tim BinaHub meninjaunya bila Anda ingin dukungan rekomendasi.'} Tidak dibagikan otomatis ke perusahaan.</p></div></div>
    <button disabled={busy} onClick={()=>void save(!access.shared)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50">
      {busy&&<Loader2 size={16} className="animate-spin"/>}{access.shared?'Cabut akses tim BinaHub':'Izinkan tim BinaHub meninjau hasil'}</button>
    <form className="space-y-4 border-t border-slate-100 pt-5" onSubmit={e=>{e.preventDefault();void save(access.shared,true);}}>
      <h3 className="font-semibold">Bantu kami meningkatkan pengalaman asesmen</h3>
      <label className="flex gap-3 text-sm leading-6"><input type="checkbox" checked={evaluate} disabled={busy} onChange={e=>setEvaluate(e.target.checked)} className="mt-1 h-4 w-4"/>
        Saya mengizinkan jawaban dan umpan balik digunakan dalam statistik evaluasi tanpa menampilkan identitas saya.</label>
      <p className="text-xs leading-6 text-slate-500">Opsional dan terpisah dari akses konsultan. Statistik tidak menyatakan instrumen telah tervalidasi. Izin ini dapat dicabut dengan menghapus centang lalu menyimpan.</p>
      {evaluate&&<div className="grid gap-4 sm:grid-cols-2">{[{label:'Seberapa jelas pertanyaannya?',value:clarity,set:setClarity},{label:'Seberapa berguna hasilnya?',value:usefulness,set:setUsefulness}].map(field=>
        <label key={field.label} className="text-sm">{field.label}<select required disabled={busy} value={field.value} onChange={e=>field.set(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 px-3">
          <option value="">Pilih penilaian</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} — {['','Sangat kurang','Kurang','Cukup','Baik','Sangat baik'][n]}</option>)}</select></label>)}</div>}
      <button disabled={busy} className="min-h-11 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-50">Simpan umpan balik</button>
    </form>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
  </section>;
}
