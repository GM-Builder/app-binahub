'use client';
import { useRef,useState } from 'react';
import { guestRequest } from '@/lib/pe-guest';

export function PEConsultationRequest({id,shared}:{id:string;shared:boolean}) {
  const [state,setState]=useState<'idle'|'sending'|'sent'>('idle'),[error,setError]=useState('');
  const lock=useRef(false);
  async function request(){
    if(lock.current||state==='sent'||!shared)return;
    lock.current=true;setState('sending');setError('');
    try{await guestRequest(`/${id}/result`,'PATCH',{action:'request_consultation'});setState('sent');}
    catch{setState('idle');setError('Permintaan belum dapat dikirim. Coba lagi; permintaan yang sama tidak dibuat dua kali.');}
    finally{lock.current=false;}
  }
  return <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="pe-consultation-title">
    <h2 id="pe-consultation-title" className="text-lg font-semibold">Diskusikan langkah pengembangan Anda</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">Tim BinaHub dapat membantu memilih program yang sesuai. Dengan meminta konsultasi, Anda meminta tim menghubungi Anda melalui email dengan mempertimbangkan hasil yang Anda izinkan untuk ditinjau. Ini bukan persetujuan berlangganan email marketing.</p>
    {state==='sent'?<p role="status" className="mt-4 text-sm font-medium text-emerald-800">Permintaan konsultasi diterima. Tim BinaHub akan menghubungi Anda melalui email.</p>:<>
      {!shared&&<p id="pe-consultation-permission" className="mt-3 text-sm text-slate-600">Aktifkan izin tinjau melalui bagian Privasi & data di bawah sebelum meminta konsultasi.</p>}
      <button type="button" disabled={!shared||state==='sending'} aria-describedby={!shared?'pe-consultation-permission':undefined} onClick={()=>void request()} className="mt-4 min-h-11 rounded-lg bg-[#0B2C6B] px-4 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4">{state==='sending'?'Mengirim permintaan…':'Minta konsultasi'}</button>
      {state==='sending'&&<p role="status" className="mt-2 text-sm">Permintaan sedang dikirim.</p>}
    </>}
    {error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
  </section>;
}
