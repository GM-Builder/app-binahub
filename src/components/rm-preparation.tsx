"use client";
import {useCallback,useEffect,useState} from 'react';
import {ArrowLeft,Loader2,RefreshCw} from 'lucide-react';
import Link from 'next/link';
import {supabase} from '@/lib/supabase';

type Definition={competencies:{code:string;name:string;definition:string}[];selfReportScale:{value:number;label:string}[];
 selfReportItems:{id:string;prompt:string}[];sjtItems:{id:string;scenario:string;question:string;options:{id:string;text:string}[]}[]};
type Readiness={version:string;sourceLoaded:boolean;canSell:false;counts:{competencies:number;selfReport:number;sjt:number};missing:string[];reportSections:string[]};
type Preview={notice:string;areas:{code:string;name:string;selfReport:{score:number|null;validCount:number};sjt:{score:null;status:string}}[];actionPlan:{days:number;stages:string[]}};
const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-[#0B2C6B] hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4';
async function request(responses?:Record<string,number|string>){
 const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('Sesi berakhir. Silakan masuk kembali.');
 const result=await fetch('/api/admin/assessments/individual/relationship-management',{method:responses?'POST':'GET',cache:'no-store',
  headers:{Authorization:`Bearer ${data.session.access_token}`,...(responses?{'Content-Type':'application/json'}:{})},
  ...(responses?{body:JSON.stringify({responses})}:{}),signal:AbortSignal.timeout(20000)});
 const payload=await result.json();if(!result.ok||payload.success!==true)throw new Error(payload.error||'Sumber RM belum dapat dimuat.');
 return payload;
}
export function RMPreparation(){
 const [readiness,setReadiness]=useState<Readiness|null>(null),[definition,setDefinition]=useState<Definition|null>(null);
 const [responses,setResponses]=useState<Record<string,number|string>>({}),[report,setReport]=useState<Preview|null>(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const result=await request();setReadiness(result.readiness);setDefinition(result.definition);setError('');}catch(e){setError(e instanceof Error?e.message:'Belum dapat dimuat.');}finally{setLoading(false);}},[]);
 useEffect(()=>{let alive=true;void request().then(result=>{if(alive){setReadiness(result.readiness);setDefinition(result.definition);}}).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Belum dapat dimuat.');}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[]);
 async function preview(){setBusy(true);setError('');try{setReport((await request(responses)).report);}catch(e){setError(e instanceof Error?e.message:'Belum dapat dihitung.');}finally{setBusy(false);}}
 const choose=(id:string,value:number|string)=>{setResponses(current=>({...current,[id]:value}));setReport(null);};
 return <div className="space-y-6 text-[#0B2C6B]">
  <Link href="/admin/assessments/individual" className={button}><ArrowLeft size={16}/>Diagnosis individu</Link>
  <p className="max-w-3xl text-sm leading-7 text-slate-600">Ruang review internal untuk materi CEO. Jawaban di sini hanya untuk mencoba tampilan, tidak disimpan, tidak dikirim melalui email, dan bukan hasil peserta.</p>
  {error&&<p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{error}<button className={`${button} ml-3`} onClick={()=>void load()}><RefreshCw size={16}/>Coba lagi</button></p>}
  {loading?<p role="status">Memuat sumber RM…</p>:readiness&&<>
   <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Kesiapan Relationship Management</h2><p className="mt-2 text-sm text-slate-600">{readiness.sourceLoaded?`${readiness.counts.competencies} kompetensi · ${readiness.counts.selfReport} soal pengalaman nyata · ${readiness.counts.sjt} studi kasus`:'Sumber privat belum dipasang.'} · {readiness.version}</p>
    <p className="mt-4 text-sm font-semibold">Paket belum dijual. Yang masih perlu diselesaikan:</p><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">{readiness.missing.map(item=><li key={item}>{item}</li>)}</ul>
   </section>
   {definition&&<><details className="rounded-xl border border-slate-200 bg-white p-6"><summary className="min-h-11 cursor-pointer font-semibold">Tinjau bank soal dan coba laporan</summary>
    <p className="mt-2 text-sm leading-7 text-slate-600">Isi sebagian atau semua soal untuk mengecek kelengkapan. Belum ada skor studi kasus karena bobot per kompetensi belum disahkan.</p>
    <div className="mt-5 space-y-6">{definition.selfReportItems.map((item,index)=><fieldset key={item.id}><legend className="text-sm font-medium leading-7">{index+1}. {item.prompt}</legend><select aria-label={`Jawaban ${index+1}`} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={responses[item.id]??''} onChange={e=>{if(e.target.value)choose(item.id,Number(e.target.value));}}><option value="">Pilih jawaban</option>{definition.selfReportScale.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></fieldset>)}
    {definition.sjtItems.map((item,index)=><fieldset key={item.id}><legend className="text-sm font-medium leading-7">{index+28}. {item.scenario}</legend><p className="mt-2 text-sm">{item.question}</p><div className="mt-3 grid gap-2">{item.options.map(o=><label key={o.id} className="flex min-h-11 items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm leading-7"><input type="radio" className="mt-1.5" name={item.id} checked={responses[item.id]===o.id} onChange={()=>choose(item.id,o.id)}/>{o.text}</label>)}</div></fieldset>)}</div>
    <button className={`${button} mt-6`} disabled={busy} onClick={()=>void preview()}>{busy&&<Loader2 size={16} className="animate-spin"/>}Lihat pratinjau laporan</button>
   </details>
   {report&&<section className="rounded-xl border border-slate-200 bg-white p-6" aria-label="Pratinjau laporan RM"><h2 className="text-xl font-semibold">Profil sembilan kompetensi</h2><p className="mt-3 text-sm leading-7 text-slate-600">{report.notice}</p><p className="mt-3 text-xs text-slate-600" id="rm-table-help">Pada layar kecil, geser tabel ke samping untuk melihat kedua metode.</p><div className="mt-3 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-4" tabIndex={0} role="region" aria-label="Nilai per kompetensi" aria-describedby="rm-table-help"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-slate-300"><th scope="col" className="py-3 pr-4">Kompetensi</th><th scope="col">Pengalaman nyata (0–100)</th><th scope="col">Studi kasus</th></tr></thead><tbody>{report.areas.map(a=><tr key={a.code} className="border-b border-slate-200"><th scope="row" className="py-4 pr-4 font-medium">{a.name}</th><td>{a.selfReport.score??'Data belum cukup'}</td><td>Menunggu bobot</td></tr>)}</tbody></table></div><h3 className="mt-6 font-semibold">Rencana aksi 30 hari</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{report.actionPlan.stages.map(s=><li key={s}>{s}</li>)}</ol></section>}
   <section><h2 className="font-semibold">Susunan laporan dari CEO</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{readiness.reportSections.map(s=><li key={s}>{s}</li>)}</ol></section></>}
  </>}
 </div>;
}
