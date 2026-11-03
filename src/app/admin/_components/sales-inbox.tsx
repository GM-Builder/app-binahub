'use client';
import { useCallback,useState } from 'react';
import { AdminAuthGate } from '@/components/admin-auth-gate';
import { AdminShell } from '@/components/admin-shell';
import { apiFetch } from '@/lib/api-fetch';
import { TAB_META } from '../_lib/constants';
import { SalesWorkspace } from './sales-workspace';
export function SalesInbox(){
  const [revision,setRevision]=useState(0);
  const action=useCallback(async(url:string,init?:RequestInit)=>{
    const headers=new Headers(init?.headers);if(init?.body&&!(init.body instanceof FormData))headers.set('Content-Type','application/json');
    const response=await apiFetch(url,{...init,headers});const body=await response.json();
    if(!response.ok||!body.success)throw new Error(body.error||'Tindakan belum berhasil. Silakan coba lagi.');
    if(init?.method&&init.method!=='GET')setRevision(value=>value+1);return body;
  },[]);
  const refresh=useCallback(async()=>setRevision(value=>value+1),[]);
  return <AdminAuthGate><AdminShell {...TAB_META['Acquisition Control']}><SalesWorkspace serverMode refreshToken={revision} onAction={action} onRefresh={refresh}/></AdminShell></AdminAuthGate>;
}
