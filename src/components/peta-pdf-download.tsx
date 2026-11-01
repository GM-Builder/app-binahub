"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {Download} from 'lucide-react';
import styles from './peta-pdf-download.module.css';

type Target={kind:'participant';programMode:boolean}|{kind:'individual';sessionId:string}|{kind:'group';workspaceId:string};
export function PetaPDFDownload({target,disabled=false}:{target:Target;disabled?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 const mounted=useRef(true),controller=useRef<AbortController|null>(null),id=useId();
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;controller.current?.abort();};},[]);
 async function download(){
  if(controller.current)return;
  setBusy(true);setError('');setDone(false);
  const abort=new AbortController();controller.current=abort;
  try{
   const headers:Record<string,string>={};
   if(target.kind!=='participant'||target.programMode){
    const {supabase}=await import('@/lib/supabase');const {data}=await supabase.auth.getSession();
    if(!data.session)throw Error('Sesi berakhir. Silakan masuk kembali sebelum mengunduh.');
    headers.Authorization='Bearer '+data.session.access_token;
   }
   const path=target.kind==='participant'?'result/pdf':`admin/reports/${target.kind}/pdf`;
   const input=target.kind==='participant'?undefined:target.kind==='individual'?{sessionId:target.sessionId}:{workspaceId:target.workspaceId};
   if(input)headers['Content-Type']='application/json';
   const response=await fetch(new URL('/api/peta/'+path,window.location.origin),{method:input?'POST':'GET',credentials:'include',cache:'no-store',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(60000)]),headers,...(input?{body:JSON.stringify(input)}:{})});
   if(!response.ok){const payload=await response.json().catch(()=>null);throw Error(payload?.error||'PDF belum dapat dibuat. Coba unduh kembali.');}
   if(!response.headers.get('content-type')?.toLowerCase().startsWith('application/pdf'))throw Error('Berkas PDF belum tersedia. Coba unduh kembali.');
   const blob=await response.blob();if(!blob.size)throw Error('PDF kosong. Coba unduh kembali.');
   if(!mounted.current||abort.signal.aborted)return;
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=target.kind==='group'?'peta-grup-internal.pdf':'peta-individu.pdf';
   document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),15000);
   setDone(true);
  }catch(e){if(mounted.current&&!abort.signal.aborted)setError(e instanceof Error&&e.name!=='TimeoutError'?e.message:'Pembuatan PDF memerlukan waktu lebih lama. Silakan coba kembali.');}
  finally{controller.current=null;if(mounted.current)setBusy(false);}
 }
 return <div className={styles.download}>
  <button type="button" disabled={disabled||busy} onClick={()=>void download()} aria-describedby={error||done?id:undefined} aria-busy={busy}><Download size={16} aria-hidden="true"/>{busy?'Menyiapkan PDF…':target.kind==='group'?'Unduh PDF grup':'Unduh PDF individu'}</button>
  {error?<p id={id} role="alert">{error}</p>:done?<p id={id} role="status">PDF siap. Periksa unduhan pada perangkat Anda.</p>:null}
 </div>;
}
