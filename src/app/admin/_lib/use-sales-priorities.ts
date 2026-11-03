'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api-fetch';
import type { SalesTask } from './sales-workspace';
const count=z.number().int().nonnegative();
const Task=z.object({id:z.string(),recordId:z.string(),kind:z.enum(['inquiry','assessment','proposal','followup','pipeline']),
  name:z.string(),company:z.string(),email:z.string(),source:z.string(),note:z.string().max(500),action:z.string(),
  view:z.enum(['clients','pipeline']),detail:z.enum(['summary','proposal','followup']).nullable(),priority:count,at:z.string().nullable()});
const Inbox=z.object({success:z.literal(true),version:z.literal(1),page:count,pageSize:z.literal(20),snapshotAt:z.string(),total:count,
  counts:z.object({all:count,proposal:count,followup:count,won:count}),records:z.array(Task).max(20)});
type Data=Omit<z.infer<typeof Inbox>,'records'>&{records:SalesTask[]};
class PriorityReadError extends Error {}
const message=(status:number)=>status===401||status===403?'Sesi admin tidak tersedia. Silakan masuk kembali.':status===429
  ?'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.':'Prioritas CRM belum dapat dimuat. Periksa koneksi, lalu coba lagi.';
export function useSalesPriorities(input:{enabled:boolean;search:string;view:'all'|'followup';kind:string;refreshToken?:string|number}){
  const search=input.search.trim();
  const [debounced,setDebounced]=useState(search),[revision,setRevision]=useState(0);
  const filters=JSON.stringify([search,input.view,input.kind]);
  const [pager,setPager]=useState({key:filters,page:0});if(pager.key!==filters)setPager({key:filters,page:0});
  const page=pager.key===filters?pager.page:0,key=JSON.stringify([filters,page,revision,input.refreshToken]);
  const [state,setState]=useState<{key:string;data:Data|null;error:string}>({key:'',data:null,error:''});
  const current=state.key===key&&search===debounced;
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(search),300);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{
    if(!input.enabled||search!==debounced)return;
    let active=true,expired=false;const controller=new AbortController();
    const fail=(error:string)=>{if(active)setState({key,data:null,error});};
    const timer=setTimeout(()=>{expired=true;controller.abort();fail('Memuat prioritas terlalu lama. Periksa koneksi, lalu coba lagi.');},20000);
    const params=new URLSearchParams({page:String(page),search,view:input.view,kind:input.kind});
    void apiFetch('/api/admin/sales/priorities?'+params,{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok){const body=await response.json().catch(()=>null);throw new PriorityReadError(response.status===503&&typeof body?.error==='string'&&body.error.includes('SQL86')?'Prioritas CRM memerlukan pembaruan SQL86 oleh pengelola.':message(response.status));}
      const body=Inbox.parse(await response.json());if(!active||expired)return;if(body.page!==page)throw new Error('Page mismatch');
      const lastPage=Math.max(0,Math.ceil(body.total/20)-1);if(page>lastPage){setPager({key:filters,page:lastPage});return;}
      // Validate the action destination so a malformed DTO cannot open another source's record.
      const records=body.records.map(task=>{
        if(task.kind==='pipeline'?(task.view!=='pipeline'||task.detail!==null):task.view!=='clients')throw new Error('Destination mismatch');
        if(task.kind==='proposal'&&task.detail!=='proposal'||task.kind==='assessment'&&task.detail!=='summary'||task.kind==='inquiry'&&task.detail!==null
          ||task.kind==='followup'&&task.detail!==null&&task.detail!=='followup')throw new Error('Detail mismatch');
        return {...task,detail:task.detail??undefined};
      });
      setState({key,data:{...body,records},error:''});
    }).catch((error:unknown)=>{if(active&&!expired)fail(error instanceof PriorityReadError?error.message:message(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;controller.abort();clearTimeout(timer);};
  },[input.enabled,input.view,input.kind,search,debounced,page,filters,key]);
  const refresh=useCallback(()=>setRevision(value=>value+1),[setRevision]);
  return {data:current?state.data:null,loading:input.enabled&&!current,error:current?state.error:'',page,
    setPage:(next:number)=>setPager({key:filters,page:next}),refresh};
}
