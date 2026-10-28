"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Save, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const fields = [
  {key:'name',label:'Nama paket',kind:'text',max:160},
  {key:'description',label:'Deskripsi paket',kind:'textarea',max:1200},
  {key:'priceIdr',label:'Harga total yang dibayar (Rp)',kind:'number',max:1_000_000_000},
  {key:'attempts',label:'Kesempatan pengisian',kind:'number',max:20},
  {key:'startWithinDays',label:'Batas mulai setelah pembayaran (hari)',kind:'number',max:3650},
  {key:'completeWithinDays',label:'Waktu penyelesaian setelah mulai (hari)',kind:'number',max:3650},
  {key:'retentionMonths',label:'Masa simpan hasil (bulan)',kind:'number',max:120},
  {key:'reportVersion',label:'Referensi format laporan',kind:'text',max:100},
  {key:'refundPolicy',label:'Ketentuan pengembalian dana',kind:'textarea',max:4000},
  {key:'terms',label:'Ketentuan pembelian',kind:'textarea',max:4000},
] as const;
type Key = typeof fields[number]['key'];
type Configuration = Record<Key,string|number|null>;
type Dashboard = {
  revision:number; offerId:string; configuration:Configuration;
  areas:{code:string;name:string}[]; readiness:{canSell:false;missing:string[]};
  counts:{pending:number;paid:number;attention:number}; matchedCount:number;
  orders:{id:string;email:string;totalIdr:number;status:string;createdAt:string;accessStatus:string|null}[];
};
const statusLabels:Record<string,string>={awaiting_payment:'Menunggu pembayaran',paid:'Dibayar',cancelled:'Dibatalkan',refund_pending:'Refund diproses',partially_refunded:'Refund sebagian',refunded:'Dana dikembalikan',disputed:'Perlu peninjauan'};
const accessLabels:Record<string,string>={available:'Siap dimulai',in_progress:'Sedang diisi',completed:'Selesai',expired:'Kedaluwarsa',suspended:'Ditangguhkan',revoked:'Dicabut'};
const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-[#0B2C6B] hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4';
const money=(value:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);

async function request(query='',configuration?:{revision:number;configuration:Configuration}):Promise<Dashboard> {
  const {data}=await supabase.auth.getSession();
  if(!data.session)throw new Error('Sesi berakhir. Silakan masuk kembali.');
  const response=await fetch('/api/admin/assessments/individual/commerce'+query,{
    method:configuration?'PUT':'GET',cache:'no-store',signal:AbortSignal.timeout(20_000),
    headers:{Authorization:`Bearer ${data.session.access_token}`,...(configuration?{'Content-Type':'application/json'}:{})},
    ...(configuration?{body:JSON.stringify(configuration)}:{}),
  });
  const result=await response.json().catch(()=>null);
  const current=await supabase.auth.getSession();
  if(current.data.session?.user.id!==data.session.user.id)throw new Error('Sesi berubah. Muat ulang halaman.');
  if(!response.ok||result?.success!==true)throw new Error(result?.error||'Data belum dapat dimuat. Coba lagi.');
  return result.dashboard;
}

export function PECommerceAdmin() {
  const [data,setData]=useState<Dashboard|null>(null),[form,setForm]=useState<Partial<Record<Key,string>>>({});
  const [revision,setRevision]=useState(0),[dirty,setDirty]=useState(false);
  const [tab,setTab]=useState<'orders'|'package'>('orders'),[query,setQuery]=useState(''),[status,setStatus]=useState('all');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [refresh,setRefresh]=useState(0);
  const lock=useRef(false),generation=useRef(0),mounted=useRef(true);
  function apply(value:Dashboard) {
    setData(value);setRevision(value.revision);setDirty(false);
    setQuery('');setStatus('all');
    setForm(Object.fromEntries(fields.map(({key})=>[key,value.configuration[key]===null?'':String(value.configuration[key])])));
  }
  useEffect(()=>{
    mounted.current=true;let alive=true;const version=++generation.current;
    void request().then(value=>{if(alive&&version===generation.current)apply(value);})
      .catch(failure=>{if(alive&&version===generation.current)setError(failure.message);})
      .finally(()=>{if(alive&&version===generation.current)setLoading(false);});
    const listener=supabase.auth.onAuthStateChange?.((event)=>{
      if(event==='SIGNED_OUT'||event==='SIGNED_IN'){
        generation.current++;setData(null);setForm({});setMessage('');setError('Sesi berubah. Muat ulang halaman.');setBusy(false);setLoading(false);
      }
    });
    return()=>{alive=false;mounted.current=false;listener?.data.subscription.unsubscribe();};
  },[refresh]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  async function save() {
    if(lock.current||!data)return;lock.current=true;setBusy(true);setError('');setMessage('');const version=generation.current;
    try{
      const configuration=Object.fromEntries(fields.map(({key,kind})=>{
        const raw=(form[key]||'').trim();
        if(kind==='number'&&raw&&(!Number.isSafeInteger(Number(raw))||Number(raw)<1))throw new Error('Isian angka harus berupa bilangan bulat positif.');
        return [key,raw?(kind==='number'?Number(raw):raw):null];
      })) as Configuration;
      const value=await request('',{revision,configuration});
      if(mounted.current&&version===generation.current){apply(value);setMessage('Draft paket tersimpan. Belum dipublikasikan atau menerima pembayaran.');}
    }catch(failure){if(mounted.current&&version===generation.current)setError(failure instanceof Error?failure.message:'Draft belum tersimpan. Isian Anda tetap tersedia.');}
    finally{lock.current=false;if(mounted.current&&version===generation.current)setBusy(false);}
  }
  async function filter() {
    if(lock.current)return;lock.current=true;setBusy(true);setError('');const version=generation.current;
    try{
      const value=await request(`?${new URLSearchParams({q:query,status})}`);
      if(mounted.current&&version===generation.current)setData(value);
    }catch(failure){if(mounted.current&&version===generation.current)setError(failure instanceof Error?failure.message:'Transaksi belum dapat dimuat.');}
    finally{lock.current=false;if(mounted.current&&version===generation.current)setBusy(false);}
  }
  function reload(){if(lock.current)return;setLoading(true);setError('');setMessage('');setRefresh(value=>value+1);}

  return <div className="mx-auto max-w-6xl text-slate-900">
    <Link href="/admin/assessments/individual" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#0B2C6B]"><ArrowLeft size={16} aria-hidden="true"/>Kembali ke Self Diagnostic individu</Link>
    <div className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
      <div><h2 className="text-2xl font-semibold tracking-tight">Transaksi & paket</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Siapkan penawaran dan pantau akses Self Diagnostic dari satu tempat.</p></div>
      <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">Belum menerima pembayaran</span>
    </div>
    {error&&<div role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">{error}<p className="mt-2">{dirty?'Isian belum disimpan. Memuat versi terbaru akan mengganti draft di layar ini.':'Data tidak ditampilkan sebagai transaksi kosong saat koneksi gagal.'}</p><button className={`${button} mt-3`} disabled={busy} onClick={reload}><RefreshCw size={16} aria-hidden="true"/>{dirty?'Muat versi terbaru':'Coba lagi'}</button></div>}
    {message&&<p role="status" className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true"/>{message}</p>}
    {loading?<p role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-600"><Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true"/>Memuat transaksi dan paket…</p>:data&&<>
      <nav aria-label="Transaksi dan paket individu" className="my-5 flex gap-2">
        {([{id:'orders',label:'Transaksi'},{id:'package',label:'Paket Self Diagnostic'}] as const).map(item=><button key={item.id} type="button" aria-pressed={tab===item.id} onClick={()=>setTab(item.id)} className={`${button} ${tab===item.id?'border-[#0B2C6B] bg-blue-50':''}`}>{item.label}</button>)}
      </nav>
      {tab==='orders'?<section aria-label="Daftar transaksi">
        <dl className="mb-6 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 py-4 text-sm">{[
          ['Menunggu pembayaran',data.counts.pending],['Dibayar',data.counts.paid],['Perlu perhatian',data.counts.attention],
        ].map(([label,value])=><div key={label} className="px-3 first:pl-0"><dt className="text-xs leading-5 text-slate-600">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd></div>)}</dl>
        <form onSubmit={event=>{event.preventDefault();void filter();}} className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="col-span-2 min-w-0 text-xs font-medium sm:col-span-1">Cari transaksi<input type="search" maxLength={100} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nomor pesanan atau email" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base sm:text-sm"/></label>
          <label className="min-w-0 text-xs font-medium">Status pembayaran<select value={status} onChange={event=>setStatus(event.target.value)} className="mt-2 block min-h-11 w-full max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Semua status</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
          <button disabled={busy} className={`${button} self-end`}>{busy?<Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true"/>:<Search size={16} aria-hidden="true"/>}Terapkan</button>
        </form>
        <p className="mb-4 text-xs leading-6 text-slate-600">Ringkasan mencakup seluruh transaksi. Daftar menampilkan hingga 50 transaksi terbaru sesuai filter, dari {data.matchedCount} hasil. Dibayar bukan jumlah dana yang telah cair.</p>
        {!data.orders.length?<div className="rounded-xl border border-slate-200 px-5 py-10 text-center"><h3 className="font-semibold">Belum ada transaksi yang sesuai.</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Penjualan belum diaktifkan. Anda dapat menyiapkan paket sekarang; tidak ada tagihan atau akses berbayar yang dibuat.</p><button onClick={()=>setTab('package')} className={`${button} mt-5`}>Siapkan paket Self Diagnostic</button></div>
          :<ul className="divide-y divide-slate-200 border-y border-slate-200">{data.orders.map(order=><li key={order.id} className="py-4"><details><summary className="cursor-pointer text-sm"><span className="font-medium">{order.email}</span><span className="ml-3">{money(order.totalIdr)}</span><span className="ml-3 text-slate-600">{statusLabels[order.status]}</span></summary><dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-slate-600">Nomor pesanan</dt><dd className="mt-1 break-all">{order.id}</dd></div><div><dt className="text-slate-600">Akses Self Diagnostic</dt><dd className="mt-1">{order.accessStatus?accessLabels[order.accessStatus]:'Belum tersedia'}</dd></div><div><dt className="text-slate-600">Tanggal pesanan</dt><dd className="mt-1">{new Date(order.createdAt).toLocaleString('id-ID')}</dd></div></dl></details></li>)}</ul>}
      </section>:<section aria-label="Draft paket Self Diagnostic">
        <div className="mb-6 border-b border-slate-200 pb-5"><h3 className="text-lg font-semibold">Siapkan paket lanjutan</h3><p className="mt-2 text-sm leading-6 text-slate-600">Isi keputusan yang sudah ditetapkan CEO. Yang belum ditentukan boleh dikosongkan. Menyimpan draft tidak mengaktifkan penjualan.</p><p className="mt-3 text-sm font-medium">Area: {data.areas.map(area=>area.name).join(' · ')}</p></div>
        <form onSubmit={event=>{event.preventDefault();void save();}}>
          <fieldset disabled={busy} className="grid min-w-0 gap-5 sm:grid-cols-2">{fields.map(field=><label key={field.key} className={`min-w-0 text-sm font-medium ${field.kind==='textarea'?'sm:col-span-2':''}`}>{field.label}
            {field.kind==='textarea'?<textarea rows={3} maxLength={field.max} value={form[field.key]||''} onChange={event=>{setForm(current=>({...current,[field.key]:event.target.value}));setDirty(true);setMessage('');}} className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-base font-normal sm:text-sm"/>
              :<input type={field.kind} min={field.kind==='number'?1:undefined} max={field.kind==='number'?field.max:undefined} step={field.kind==='number'?1:undefined} maxLength={field.kind==='text'?field.max:undefined} value={form[field.key]||''} onChange={event=>{setForm(current=>({...current,[field.key]:event.target.value}));setDirty(true);setMessage('');}} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal sm:text-sm"/>}
          </label>)}</fieldset>
          <div className="mt-6 flex flex-wrap items-center gap-3"><button disabled={busy||!dirty} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0B2C6B] px-5 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4">{busy?<Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true"/>:<Save size={16} aria-hidden="true"/>}{busy?'Menyimpan…':'Simpan draft paket'}</button><p className="text-xs text-slate-600">{dirty?'Ada perubahan yang belum disimpan.':`Revisi tersimpan: ${revision}. Belum dipublikasikan.`}</p></div>
        </form>
        <details className="mt-8 border-t border-slate-200 pt-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">Yang masih perlu disiapkan sebelum penjualan</summary><ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{data.readiness.missing.map(item=><li key={item}>{item}</li>)}</ul><p className="mt-3 text-xs leading-6 text-slate-600">Daftar ini mengikuti revisi yang tersimpan. Tidak ada persetujuan per transaksi atau penggantian env harian.</p></details>
      </section>}
    </>}
  </div>;
}
