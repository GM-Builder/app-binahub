"use client";
import { useEffect,useState } from 'react';
import { ArrowRight,Building2,UserRound,ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function DiagnosisChoice(){
  const [available,setAvailable]=useState<boolean|null>(null);
  const params=useSearchParams();const search=params.toString()?`?${params.toString()}`:'';
  useEffect(()=>{
    const controller=new AbortController();
    const timeout=setTimeout(()=>{setAvailable(false);controller.abort();},8_000);
    void fetch('/api/assessment/individual/availability',{cache:'no-store',signal:controller.signal})
      .then(r=>r.ok?r.json():null).then(b=>{if(!controller.signal.aborted)setAvailable(b?.available===true);})
      .catch(()=>{if(!controller.signal.aborted)setAvailable(false);}).finally(()=>clearTimeout(timeout));
    return()=>{clearTimeout(timeout);controller.abort();};
  },[]);
  return <main className="min-h-screen bg-[#F5F7FA] px-5 py-8 text-[#0B2C6B]">
    <div className="mx-auto max-w-4xl"><Link href="https://binahub.id" className="inline-flex min-h-11 items-center gap-2 text-sm"><ArrowLeft size={16}/>BinaHub</Link>
      <p className="mt-14 text-xs font-semibold uppercase tracking-[.2em] text-slate-500">Diagnosis pengembangan</p>
      <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Mulai dari kebutuhan Anda.</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">Pilih pengembangan untuk diri sendiri atau untuk tim dan organisasi. Setiap jalur memiliki pertanyaan dan hasil yang sesuai.</p>
      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <Link href={`${new URLSearchParams(search).get('lang')==='en'?'/en/insight':'/insight'}${search}`} className="group rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-blue-800 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4">
          <Building2 className="h-8 w-8 text-blue-900" aria-hidden="true"/><p className="mt-7 text-xs font-semibold uppercase tracking-wider text-slate-500">Untuk perusahaan</p>
          <h2 className="mt-2 text-2xl font-semibold">Tim / Organisasi</h2><p className="mt-3 text-sm leading-7 text-slate-600">Petakan tantangan kerja, kolaborasi, dan prioritas pengembangan organisasi.</p>
          <div className="mt-7 flex items-center justify-between"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Diagnosis lengkap gratis</span><ArrowRight size={20} aria-hidden="true"/></div>
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white p-7"><UserRound className="h-8 w-8 text-[#BA8B35]" aria-hidden="true"/>
          <p className="mt-7 text-xs font-semibold uppercase tracking-wider text-slate-500">Untuk diri sendiri</p><h2 className="mt-2 text-2xl font-semibold">Individu</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Kenali pengalaman kerja dan respons Anda pada tiga Area Personal Effectiveness.</p>
          <span className="mt-5 inline-block rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">3 Area gratis · 18 soal</span>
          {available?<Link href="/insight/individual" className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4">Mulai diagnosis individu<ArrowRight size={18}/></Link>:
            <p role="status" className="mt-5 text-xs leading-6 text-slate-500">{available===null?'Memeriksa ketersediaan…':'Diagnosis individu sedang disiapkan. Jalur tim tetap dapat digunakan.'}</p>}
        </div>
      </div><p className="mt-6 text-xs leading-6 text-slate-500">Hasil digunakan untuk refleksi dan pengembangan, bukan diagnosis klinis.</p>
    </div>
  </main>;
}
