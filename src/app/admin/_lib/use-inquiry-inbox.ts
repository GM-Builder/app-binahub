'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api-fetch';

const count = z.number().int().nonnegative();
const replyStatus = z.enum(['none','draft','reviewed','sending','sent']);
const Summary = z.object({ id:z.string(),name:z.string(),email:z.string(),source:z.string(),status:z.string(),
  replyStatus,messagePreview:z.string().max(500),followUpDue:z.boolean(),createdAt:z.string().nullable() });
const Inbox = z.object({ success:z.literal(true),version:z.literal(1),page:count,pageSize:z.literal(20),total:count,
  counts:z.object({fresh:count,awaiting:count,ready:count,due:count}),facets:z.object({sources:z.array(z.string()),statuses:z.array(z.string())}),records:z.array(Summary).max(20) });
const Detail = z.object({ success:z.literal(true),record:z.object({
  id:z.string(),name:z.string(),email:z.string(),whatsapp:z.string(),message:z.string(),source:z.string(),status:z.string(),notes:z.string(),
  followUpLevel:count,followUpLastSentAt:z.string().nullable(),followUpPaused:z.boolean(),replySubject:z.string(),replyBody:z.string(),replyStatus,
  replyGeneratedAt:z.string().nullable(),replyReviewedAt:z.string().nullable(),replyReviewedBy:z.string().nullable(),replySentAt:z.string().nullable(),replyEmailId:z.string().nullable(),
  moduleRequest:z.object({individualAttemptId:z.string().optional(),requestedAt:z.string().optional(),modules:z.array(z.object({id:z.string().optional(),code:z.string().optional(),name:z.string().optional(),basePrice:z.number().optional(),currency:z.string().optional(),catalogVersion:z.string().optional()})).optional()}),createdAt:z.string().nullable(),
}) });
export type InquiryListRow = z.infer<typeof Summary>;
type InboxData = z.infer<typeof Inbox>;
type DetailRecord = z.infer<typeof Detail>['record'];
class InquiryReadError extends Error {}
const message = (status:number) => status===401||status===403 ? 'Sesi admin tidak tersedia. Silakan masuk kembali.'
  :status===429?'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.'
    :status===404?'Inquiry tidak ditemukan. Pilih inquiry lain atau perbarui daftar.' : 'Inquiry belum dapat dimuat. Periksa koneksi, lalu coba lagi.';

export function useInquiryInbox(input:{enabled:boolean;search:string;source:string;status:string;selectedId:string|null;refreshToken?:number}) {
  const search=input.search.trim();
  const [debounced,setDebounced]=useState(search);
  const filters=JSON.stringify([search,input.source,input.status]);
  const [pager,setPager]=useState({key:filters,page:0});
  if(pager.key!==filters)setPager({key:filters,page:0});
  const page=pager.key===filters?pager.page:0;
  const [revision,setRevision]=useState(0),[detailRevision,setDetailRevision]=useState(0);
  const key=JSON.stringify([filters,page,revision,input.refreshToken]);
  const [list,setList]=useState<{key:string;data:InboxData|null;error:string}>({key:'',data:null,error:''});
  const current=list.key===key&&search===debounced;
  const detailKey=JSON.stringify([input.selectedId,detailRevision,input.refreshToken]);
  const [detail,setDetail]=useState<{key:string;record:DetailRecord|null;error:string}>({key:'',record:null,error:''});
  const detailCurrent=detail.key===detailKey;
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(search),300);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{
    if(!input.enabled||search!==debounced)return;
    let active=true,expired=false;
    const controller=new AbortController();
    const fail=(error:string)=>{if(active)setList({key,data:null,error});};
    const timer=setTimeout(()=>{expired=true;controller.abort();fail('Memuat daftar terlalu lama. Periksa koneksi, lalu coba lagi.');},20000);
    const params=new URLSearchParams({page:String(page),search,source:input.source==='Semua'?'':input.source,status:input.status==='Semua'?'':input.status});
    void apiFetch('/api/admin/inquiries/inbox?'+params,{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok){const body=await response.json().catch(()=>null);throw new InquiryReadError(response.status===503&&typeof body?.error==='string'&&body.error.includes('SQL83')?'Daftar inquiry memerlukan pembaruan SQL83 oleh pengelola.':message(response.status));}
      const body=Inbox.parse(await response.json());if(!active||expired)return;
      if(body.page!==page)throw new Error('Page mismatch');
      const lastPage=Math.max(0,Math.ceil(body.total/20)-1);
      if(page>lastPage){setPager({key:filters,page:lastPage});return;}
      setList({key,data:body,error:''});
    }).catch((error:unknown)=>{if(active&&!expired)fail(error instanceof InquiryReadError?error.message:message(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[input.enabled,input.source,input.status,search,debounced,page,filters,key]);
  useEffect(()=>{
    if(!input.enabled||!input.selectedId)return;
    let active=true,expired=false;
    const controller=new AbortController();
    const fail=(error:string)=>{if(active)setDetail(current=>({key:detailKey,record:current.record?.id===input.selectedId?current.record:null,error}));};
    const timer=setTimeout(()=>{expired=true;controller.abort();fail('Memuat detail terlalu lama. Periksa koneksi, lalu coba lagi.');},20000);
    void apiFetch('/api/admin/inquiries/inbox?id='+encodeURIComponent(input.selectedId),{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new InquiryReadError(message(response.status));
      const body=Detail.parse(await response.json());if(body.record.id!==input.selectedId)throw new Error('Detail mismatch');
      if(active&&!expired)setDetail({key:detailKey,record:body.record,error:''});
    }).catch((error:unknown)=>{if(active&&!expired)fail(error instanceof InquiryReadError?error.message:message(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[input.enabled,input.selectedId,detailKey]);
  const refresh=useCallback(()=>{setRevision(value=>value+1);setDetailRevision(value=>value+1);},[setRevision,setDetailRevision]);
  const retryList=useCallback(()=>setRevision(value=>value+1),[setRevision]),retryDetail=useCallback(()=>setDetailRevision(value=>value+1),[setDetailRevision]);
  return {data:current?list.data:null,facets:list.data?.facets,page,setPage:(next:number)=>setPager({key:filters,page:next}),
    loading:input.enabled&&!current,error:current?list.error:'',record:input.selectedId&&detailCurrent&&!detail.error?detail.record:null,
    baseline:input.selectedId===detail.record?.id?detail.record:null,
    detailLoading:Boolean(input.selectedId)&&!detailCurrent,detailError:detailCurrent?detail.error:'',refresh,retryList,retryDetail};
}
