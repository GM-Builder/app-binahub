'use client';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { apiFetch } from '@/lib/api-fetch';
const count=z.number().int().nonnegative();
const Summary=z.object({id:z.string(),recordId:z.string(),name:z.string(),email:z.string(),whatsapp:z.string(),
  source:z.string(),sourceType:z.enum(['lead','inquiry','coach','employee']),category:z.string(),status:z.string(),createdAt:z.string().nullable()});
const Inbox=z.object({success:z.literal(true),version:z.literal(1),page:count,pageSize:z.literal(20),total:count,
  counts:z.object({leads:count,reachable:count,sources:count}),facets:z.object({types:z.array(z.string()),categories:z.array(z.string()),statuses:z.array(z.string())}),records:z.array(Summary).max(20)});
const Detail=z.object({success:z.literal(true),record:Summary.extend({notes:z.string(),message:z.string()})});
type InboxData=z.infer<typeof Inbox>;
type DetailRecord=z.infer<typeof Detail>['record'];
class ContactReadError extends Error {}
const message = (status:number) => status===401||status===403 ? 'Sesi admin tidak tersedia. Silakan masuk kembali.'
  :status===429?'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.'
    :status===404?'Kontak tidak ditemukan atau identitas utamanya berubah. Perbarui daftar.' : 'Kontak belum dapat dimuat. Periksa koneksi, lalu coba lagi.';

export function useContactInbox(input:{enabled:boolean;search:string;type:string;category:string;status:string;selectedId:string|null;refreshToken?:number}) {
  const search=input.search.trim();
  const [debounced,setDebounced]=useState(search);
  const filters=JSON.stringify([search,input.type,input.category,input.status]);
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
    const params=new URLSearchParams({page:String(page),search,type:input.type==='Semua'?'':input.type,category:input.category==='Semua'?'':input.category,status:input.status==='Semua'?'':input.status});
    void apiFetch('/api/admin/contacts/inbox?'+params,{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok){const body=await response.json().catch(()=>null);throw new ContactReadError(response.status===503&&typeof body?.error==='string'&&body.error.includes('SQL84')?'Daftar kontak memerlukan pembaruan SQL84 oleh pengelola.':message(response.status));}
      const body=Inbox.parse(await response.json());if(!active||expired)return;
      if(body.page!==page)throw new Error('Page mismatch');
      const lastPage=Math.max(0,Math.ceil(body.total/20)-1);
      if(page>lastPage){setPager({key:filters,page:lastPage});return;}
      setList({key,data:body,error:''});
    }).catch((error:unknown)=>{if(active&&!expired)fail(error instanceof ContactReadError?error.message:message(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[input.enabled,input.type,input.category,input.status,search,debounced,page,filters,key]);
  useEffect(()=>{
    if(!input.enabled||!input.selectedId)return;
    let active=true,expired=false;
    const controller=new AbortController();
    const fail=(error:string)=>{if(active)setDetail(current=>({key:detailKey,record:current.record?.id===input.selectedId?current.record:null,error}));};
    const timer=setTimeout(()=>{expired=true;controller.abort();fail('Memuat detail terlalu lama. Periksa koneksi, lalu coba lagi.');},20000);
    const [kind,id]=input.selectedId.split(':');
    void apiFetch('/api/admin/contacts/inbox?'+new URLSearchParams({type:kind,id}),{signal:controller.signal,cache:'no-store'}).then(async response=>{
      if(!response.ok)throw new ContactReadError(message(response.status));
      const body=Detail.parse(await response.json());if(body.record.id!==input.selectedId)throw new Error('Detail mismatch');
      if(active&&!expired)setDetail({key:detailKey,record:body.record,error:''});
    }).catch((error:unknown)=>{if(active&&!expired)fail(error instanceof ContactReadError?error.message:message(503));}).finally(()=>clearTimeout(timer));
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[input.enabled,input.selectedId,detailKey]);
  const refresh=useCallback(()=>{setRevision(value=>value+1);setDetailRevision(value=>value+1);},[setRevision,setDetailRevision]);
  const retryList=useCallback(()=>setRevision(value=>value+1),[setRevision]),retryDetail=useCallback(()=>setDetailRevision(value=>value+1),[setDetailRevision]);
  return {data:current?list.data:null,facets:list.data?.facets,page,setPage:(next:number)=>setPager({key:filters,page:next}),
    loading:input.enabled&&!current,error:current?list.error:'',record:input.selectedId&&detailCurrent&&!detail.error?detail.record:null,
    baseline:input.selectedId===detail.record?.id?detail.record:null,
    detailLoading:Boolean(input.selectedId)&&!detailCurrent,detailError:detailCurrent?detail.error:'',refresh,retryList,retryDetail};
}
