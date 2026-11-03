'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { PipelineDetail, PipelineReadError, pipelineReadMessage, type PipelineDetailContext } from '../_lib/use-pipeline-inbox';
import type { PipelineLeadRecord } from '../_lib/types';
import { PipelineDrawer } from './pipeline-drawer';
import { AdminDrawer } from './shared';

export function PipelineRemoteDrawer({id,onClose,onAction,onRefresh,onSaved,onUnsavedChange}:{
  id:string;onClose:()=>void;onAction:(url:string,init?:RequestInit)=>Promise<unknown>;onRefresh:()=>Promise<void>;
  onSaved:(message:string)=>void;onUnsavedChange?:(dirty:boolean)=>void;
}) {
  const [page,setPage]=useState(0),[revision,setRevision]=useState(0);
  const key=JSON.stringify([id,page,revision]);
  const [record,setRecord]=useState<PipelineLeadRecord|null>(null);
  const [history,setHistory]=useState<{key:string;context:PipelineDetailContext|null;error:string}>({key:'',context:null,error:''});
  const loading=history.key!==key;
  const error=loading?'':history.error;
  useEffect(()=>{
    let active=true,expired=false; const controller=new AbortController();
    const fail=(error:string)=>{if(active)setHistory(current=>({...current,key,error}));};
    const timer=setTimeout(()=>{expired=true;controller.abort();fail('Memuat detail terlalu lama. Periksa koneksi, lalu coba lagi.');},20000);
    void apiFetch('/api/admin/pipeline/inbox?'+new URLSearchParams({id,historyPage:String(page)}),{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new PipelineReadError(pipelineReadMessage(response.status));
      const body=PipelineDetail.parse(await response.json());
      if(body.record.id!==id||body.context.historyPage!==page||body.context.activities.some(event=>event.leadId!==id))throw new Error('Detail mismatch');
      if(!active||expired)return;
      const last=Math.max(0,Math.ceil(body.context.activityTotal/20)-1);
      if(page>last){setPage(last);return;}
      // Freeze the edit baseline for this open drawer; paging history must not overwrite an unsaved form.
      setRecord(current=>current||body.record);
      setHistory({key,context:body.context,error:''});
    }).catch((caught:unknown)=>{if(active&&!expired)fail(caught instanceof PipelineReadError?caught.message:pipelineReadMessage(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;controller.abort();clearTimeout(timer);};
  },[id,page,key]);
  if(!record)return <AdminDrawer title="Detail peluang" onClose={onClose}>
    {loading?<p role="status" className="py-6 text-sm text-slate-600">Memuat detail peluang…</p>:<div role="alert" className="space-y-4"><p className="text-sm text-rose-800">{error}</p><button type="button" onClick={()=>setRevision(value=>value+1)} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold">Coba lagi</button></div>}
  </AdminDrawer>;
  return <PipelineDrawer lead={record} context={history.context!} historyPage={page} historyLoading={loading} historyError={error}
    onHistoryPage={next=>{setPage(next);setRevision(value=>value+1);}} onClose={onClose} onAction={onAction} onRefresh={onRefresh} onSaved={onSaved} onUnsavedChange={onUnsavedChange}/>;
}
