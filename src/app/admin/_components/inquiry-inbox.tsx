'use client';
import { useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminAuthGate } from '@/components/admin-auth-gate';
import { AdminShell } from '@/components/admin-shell';
import { apiFetch } from '@/lib/api-fetch';
import { TAB_META } from '../_lib/constants';
import { InquiriesPanel } from './inquiries-panel';

export function InquiryInbox() {
  const [refreshToken,setRefreshToken]=useState(0);
  const action=useCallback(async(url:string,init?:RequestInit)=>{
    const headers=new Headers(init?.headers);
    if(init?.body&&!(init.body instanceof FormData))headers.set('Content-Type','application/json');
    const response=await apiFetch(url,{...init,headers});const body=await response.json();
    if(!response.ok||!body.success)throw new Error(body.error||'Tindakan belum berhasil. Silakan coba lagi.');
    return body;
  },[]);
  const refresh=useCallback(async()=>{},[]);
  return <AdminAuthGate><AdminShell {...TAB_META['Inquiry Masuk']} actions={<button type="button" onClick={()=>setRefreshToken(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B2C6B]"><RefreshCw size={15} aria-hidden="true"/>Perbarui</button>}>
    <InquiriesPanel serverMode refreshToken={refreshToken} inquiries={[]} onAction={action} onRefresh={refresh}/>
  </AdminShell></AdminAuthGate>;
}
