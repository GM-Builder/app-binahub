export type SpinConfirmation={hash:string;status:'confirmed'|'edited'|'supplemented';corrections:Partial<Record<'situation'|'problem'|'impact'|'outcome',string>>};
export type SpinAttempt={id:string;answers:import('./spin-form').SpinAnswers;confirmation:SpinConfirmation|null;revision:number;status:string};
export type SpinProgram={code:string;name:string;components:string[];outputs:string[];competencies?:string[];evidence:{need:string;objective:string}[]};
export type SpinReport={version:string;reference:string;issuedAt:string;company:string;summary:{situation:string;problem:string;impact:string;outcome:string};snapshot:{label:string;value:string}[];solutions:SpinProgram[];exploration?:SpinProgram[];advisory?:{status:'recommended'|'review_required'|'clarification_needed'|'temporarily_unavailable';title:string;description:string;reasons:string[]};investments:{name:string;baseAmountIdr:number|null;duration:string;capacity:string;included:string[];note:string}[];confirmations:string[];nextStep:string;bookingUrl:string|null;taxNote:string;disclaimer:string};
export async function spinRequest<T>(path:string,body?:unknown,method='POST'):Promise<T>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch('/api/discovery/spin'+path,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Layanan belum dapat diakses. Coba lagi sebentar.');return result as T;
 }catch(e){if(e instanceof Error&&e.name==='AbortError')throw new Error('Koneksi memerlukan waktu lebih lama. Coba simpan kembali; jawaban Anda masih ada di halaman ini.');throw e;}finally{clearTimeout(timer);}
}
export const spinNewKey=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
