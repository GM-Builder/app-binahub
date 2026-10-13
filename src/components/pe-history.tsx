"use client";
import Link from 'next/link';
import { useEffect,useRef,useState } from 'react';
import { supabase } from '@/lib/supabase';
import { peRequest,type PEHistory } from '@/lib/individual-assessment';
export function PEHistoryPage(){
  const [rows,setRows]=useState<PEHistory[]|null>(null),[error,setError]=useState('');
  const owner=useRef('');
  useEffect(()=>{
    let alive=true;
    void (async()=>{try{
      const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('Masuk dengan akun Anda untuk membuka riwayat.');
      owner.current=data.session.user.id;
      const result=await peRequest<{history:PEHistory[]}>(data.session.access_token,'/history');
      const latest=await supabase.auth.getSession();
      if(alive&&latest.data.session?.user.id===data.session.user.id)setRows(result.history);
    }catch(failure){if(alive)setError(failure instanceof Error?failure.message:'Riwayat belum tersedia.');}})();
    const listener=supabase.auth.onAuthStateChange?.((_event,session)=>{if(owner.current&&session?.user.id!==owner.current){owner.current='';setRows(null);setError('Sesi berubah. Masuk kembali untuk membuka riwayat.');}});
    return()=>{alive=false;listener?.data.subscription.unsubscribe();};
  },[]);
  return <main className="min-h-screen bg-[#F5F7FA] px-5 py-8 text-[#0B2C6B]"><div className="mx-auto max-w-3xl">
    <Link href="/insight/individual" className="inline-flex min-h-11 items-center text-sm">← Diagnosis individu</Link>
    <h1 className="mt-8 text-3xl font-semibold tracking-tight">Riwayat diagnosis Anda</h1><p className="mt-3 text-sm leading-7 text-slate-600">Lanjutkan draft atau buka hasil dari perangkat lain dengan akun yang sama. Maksimal sepuluh pengisian terbaru ditampilkan.</p>
    {error?<div role="alert" className="mt-6 rounded-2xl bg-white p-6"><p>{error}</p><Link href="/?mode=signin&next=%2Finsight%2Findividual%2Fhistory" className="mt-4 inline-flex min-h-11 items-center underline">Masuk kembali</Link></div>:
      !rows?<p role="status" className="mt-8">Memuat riwayat…</p>:rows.length===0?<p className="mt-8 rounded-2xl bg-white p-6">Belum ada pengisian yang tersimpan.</p>:
        <div className="mt-6 space-y-3">{rows.map(row=><Link key={row.id} href={`/insight/individual?attempt=${row.id}`} className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-800">
          <div><h2 className="font-semibold">{row.status==='submitted'?'Hasil pengembangan pribadi':'Lanjutkan pengisian'}</h2><p className="mt-2 text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString('id-ID')} · {row.answeredCount}/18 soal terisi</p></div><span className="text-sm">Buka →</span></Link>)}</div>}
  </div></main>;
}
