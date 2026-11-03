'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api-fetch';
import type { PipelineView, PriorityFilter } from './pipeline-model';

const count=z.number().int().nonnegative();
const nullable=z.string().nullable();
export const PipelineRecord=z.object({
  id:z.string(),name:z.string(),email:z.string(),company:z.string(),industry:nullable,location:nullable,
  qualificationProfile:z.record(z.string(),z.unknown()),phone:z.string(),source:z.string(),leadScore:z.number().nullable(),
  leadTemperature:z.string(),leadScoreConfidence:z.number().nullable(),lifecycleStage:z.string(),opportunityStage:z.string(),
  opportunityOwner:nullable,nextAction:nullable,nextActionDueAt:nullable,leadTimeZone:z.string(),opportunityValue:z.number().nullable(),
  lostReason:nullable,wonAt:nullable,lostAt:nullable,outreachPaused:z.boolean(),outreachPauseReason:nullable,
  outreachPausedAt:nullable,outreachPausedBy:nullable,pipelineUpdatedAt:nullable,createdAt:nullable,
});
export const PipelineContext=z.object({historyPage:count,activityTotal:count,assessments:count,meetings:count,accountId:nullable,
  activities:z.array(z.object({id:z.string(),leadId:z.string(),assessmentId:nullable,inquiryId:nullable,eventType:z.string(),
    fromStage:nullable,toStage:nullable,actor:z.string(),note:nullable,metadata:z.record(z.string(),z.unknown()),createdAt:z.string()})).max(20)});
export type PipelineDetailContext=z.infer<typeof PipelineContext>;
export const PipelineDetail=z.object({success:z.literal(true),record:PipelineRecord,context:PipelineContext});
const Inbox=z.object({success:z.literal(true),version:z.literal(1),page:count,pageSize:z.literal(20),snapshotAt:z.string(),total:count,totalValue:z.number(),
  counts:z.object({all:count,attention:count,overdue:count,unassigned:count,paused:count,value:z.number(),valued:count}),
  views:z.object({active:count,won:count,lost:count,review:count}),
  stages:z.record(z.string(),z.object({total:count,value:z.number(),valued:count})),
  facets:z.object({owners:z.array(z.string()),sources:z.array(z.string())}),records:z.array(PipelineRecord).max(20)});
type InboxData=z.infer<typeof Inbox>;
export class PipelineReadError extends Error {}
export const pipelineReadMessage=(status:number)=>status===401||status===403?'Sesi admin tidak tersedia. Silakan masuk kembali.'
  :status===429?'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.'
    :status===404?'Peluang tidak ditemukan. Perbarui daftar.':'Pipeline belum dapat dimuat. Periksa koneksi, lalu coba lagi.';

export function usePipelineInbox(input:{enabled:boolean;search:string;view:PipelineView;priority:PriorityFilter;owner:string;source:string;stage:string;sort:string;tests:boolean;refreshToken?:number}) {
  const search=input.search.trim();
  const [debounced,setDebounced]=useState(search);
  const filters=JSON.stringify([search,input.view,input.priority,input.owner,input.source,input.stage,input.sort,input.tests]);
  const [pager,setPager]=useState({key:filters,page:0});
  if(pager.key!==filters)setPager({key:filters,page:0});
  const page=pager.key===filters?pager.page:0;
  const [revision,setRevision]=useState(0);
  const key=JSON.stringify([filters,page,revision,input.refreshToken]);
  const [list,setList]=useState<{key:string;data:InboxData|null;error:string}>({key:'',data:null,error:''});
  const current=list.key===key&&search===debounced;
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(search),300);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{
    if(!input.enabled||search!==debounced)return;
    let active=true,expired=false; const controller=new AbortController();
    const fail=(error:string)=>{if(active)setList({key,data:null,error});};
    const timer=setTimeout(()=>{expired=true;controller.abort();fail('Memuat pipeline terlalu lama. Periksa koneksi, lalu coba lagi.');},20000);
    const params=new URLSearchParams({page:String(page),search,view:input.view,priority:input.priority,owner:input.owner==='all'?'':input.owner,
      source:input.source==='all'?'':input.source,stage:input.view!=='active'||input.stage==='all'?'':input.stage,sort:input.sort,tests:input.tests?'1':'0'});
    void apiFetch('/api/admin/pipeline/inbox?'+params,{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok){const body=await response.json().catch(()=>null);throw new PipelineReadError(response.status===503&&typeof body?.error==='string'&&body.error.includes('SQL85')?'Pipeline memerlukan pembaruan SQL85 oleh pengelola.':pipelineReadMessage(response.status));}
      const body=Inbox.parse(await response.json()); if(!active||expired)return;
      if(body.page!==page)throw new Error('Page mismatch');
      const lastPage=Math.max(0,Math.ceil(body.total/20)-1);
      if(page>lastPage){setPager({key:filters,page:lastPage});return;}
      setList({key,data:body,error:''});
    }).catch((error:unknown)=>{if(active&&!expired)fail(error instanceof PipelineReadError?error.message:pipelineReadMessage(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[input.enabled,input.view,input.priority,input.owner,input.source,input.stage,input.sort,input.tests,search,debounced,page,filters,key]);
  const refresh=useCallback(()=>setRevision(value=>value+1),[setRevision]);
  return {data:current?list.data:null,facets:list.data?.facets,page,setPage:(next:number)=>setPager({key:filters,page:next}),
    loading:input.enabled&&!current,error:current?list.error:'',refresh};
}
