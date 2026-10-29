"use client";
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Loader2} from 'lucide-react';
import styles from './pe-diagnosis.module.css';
import shared from './diagnosis.module.css';

export type RMTrialDefinition={selfReportScale:{value:number;label:string}[];
 selfReportItems:{id:string;prompt:string}[];sjtItems:{id:string;scenario:string;question:string;options:{id:string;text:string}[]}[]};
export function RMQuestionTrial({definition,onComplete,onClose}:{definition:RMTrialDefinition;onComplete:(responses:Record<string,number|string>)=>Promise<boolean>;onClose:()=>void}){
 const [responses,setResponses]=useState<Record<string,number|string>>({}),[index,setIndex]=useState(0),[review,setReview]=useState(false),[busy,setBusy]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);
 const questions=[...definition.selfReportItems.map(item=>({id:item.id,prompt:item.prompt,scenario:'',type:'sr',options:definition.selfReportScale.map(s=>({value:s.value,label:s.label}))})),
  ...definition.sjtItems.map(item=>({id:item.id,prompt:item.question,scenario:item.scenario,type:'sjt',options:item.options.map(o=>({value:o.id,label:o.text}))}))];
 const question=questions[index],count=questions.length,answered=Object.keys(responses).length;
 useEffect(()=>{heading.current?.focus();},[index,review]);
 async function finish(){if(answered!==count||busy)return;setBusy(true);try{if(await onComplete(responses))onClose();}finally{setBusy(false);}}
 return <section aria-label="Uji pengisian RM" className={`${styles.card} max-w-3xl`}>
  <p className="mb-5 text-xs leading-6 text-slate-600">Uji internal dengan data sintetis. Jawaban hanya berada di sesi halaman ini dan hilang saat halaman ditutup. Tidak ada pengiriman email atau pembelian.</p>
  <div className={styles.questionMeta}><span>{review?'Tinjauan jawaban':`Pertanyaan ${index+1} dari ${count}`}</span><span>{answered} terjawab</span></div>
  <progress className={styles.progress} value={answered} max={count||1} aria-label="Kemajuan uji RM"/>
  <h2 ref={heading} tabIndex={-1} className="mt-6 focus:outline-none">{review?'Tinjau jawaban uji':'Self Diagnostic Relationship Management'}</h2>
  {review?<><ol className="mt-5 divide-y divide-slate-200">{questions.map((item,i)=><li key={item.id} className="py-4 text-sm leading-7"><p>{i+1}. {item.prompt}</p><p className="mt-2 font-medium">{item.options.find(o=>o.value===responses[item.id])?.label??'Belum dijawab'}</p><button className={shared.textLink} disabled={busy} onClick={()=>{setIndex(i);setReview(false);}}>Ubah jawaban {i+1}</button></li>)}</ol>
   <p className="mt-5 text-sm leading-7 text-slate-600">Semua {count} jawaban diperlukan untuk menyelesaikan uji. Ringkasan modul menampilkan kedua metode dan gabungan 50:50. Nilai studi kasus per kompetensi belum tersedia.</p>
  </>:question&&<>
   <p className={styles.questionKind}>{question.type==='sr'?'Pengalaman nyata':'Studi kasus'}</p>
   <p className={styles.help}>Jawablah sesuai pengalaman dan pilihan Anda yang sebenarnya, bukan jawaban yang terasa paling ideal.</p>
   {question.scenario&&<p className={styles.scenario}>{question.scenario}</p>}
   <fieldset className={styles.question}><legend>{question.prompt}</legend><div className={styles.answers}>{question.options.map(option=><label key={option.value} className={`${styles.answer} ${responses[question.id]===option.value?styles.answerSelected:''}`}><input type="radio" name={question.id} checked={responses[question.id]===option.value} onChange={()=>setResponses(current=>({...current,[question.id]:option.value}))}/>{option.label}</label>)}</div></fieldset>
  </>}
  <div className={styles.footer}><button type="button" className={shared.textLink} disabled={busy} onClick={()=>{if(review)setReview(false);else if(index>0)setIndex(index-1);else onClose();}}><ArrowLeft size={15} aria-hidden="true"/>{index===0&&!review?'Tutup uji':'Kembali'}</button>
   {review?<button type="button" disabled={busy||answered!==count} className={shared.primaryButton} onClick={()=>void finish()}>{busy&&<Loader2 size={16} className="motion-safe:animate-spin"/>}Selesaikan uji dan lihat laporan</button>:<button type="button" className={shared.primaryButton} disabled={!question||!Object.hasOwn(responses,question.id)} onClick={()=>index===count-1?setReview(true):setIndex(index+1)}>{index===count-1?'Tinjau jawaban':'Lanjut'}<ArrowRight size={15} aria-hidden="true"/></button>}
  </div>
  <p className={styles.hint}>Anda dapat mengubah jawaban dengan menekan tombol Kembali sebelum menyelesaikan uji.</p>
 </section>;
}
