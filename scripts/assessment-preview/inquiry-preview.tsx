import { useState } from 'react';
import { InquiriesPanel } from '@/app/admin/_components/inquiries-panel';
export function InquiryPreview() {
  const [refreshToken,setRefreshToken]=useState(0);
  return <main className="mx-auto max-w-6xl p-4 sm:p-8"><header className="mb-6 flex items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-[#0B2C6B]">Inquiry · Data sintetis</h1><button type="button" onClick={()=>setRefreshToken(value=>value+1)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B2C6B]">Perbarui</button></header>
    <InquiriesPanel serverMode refreshToken={refreshToken} inquiries={[]} onRefresh={async()=>{}} onAction={async()=>{throw Error('Aksi mutasi dinonaktifkan di preview.');}}/>
  </main>;
}
