export type PEAnswer=number|'NA'|'A'|'B'|'C'|'D';
export type PEContext={role:string;goal:string;relevance:Record<string,'low'|'normal'|'high'>};
export type PEQuestion={id:string;competencyCode:string;type:string;prompt?:string;scenario?:string;question?:string;
  options?:{id:string;text:string}[]};
export type PEDefinition={policyId:string;consentVersion:string;privacyVersion:string;notice:string;privacyNotice:string;
  competencies:{code:string;name:string;definition:string}[];selfReportItems:PEQuestion[];sjtItems:PEQuestion[];
  selfReportScale:{value:number|'NA';label:string}[]};
export type PEAttempt={id:string;status:'draft'|'submitted';revision:number;responses:Record<string,PEAnswer>;
  context:PEContext;retentionUntil:string;submittedAt:string|null};
export type PEPractice={focus:string;context:string;successIndicator:string;followUp:string};
export type PEReport={goal:string;methodology:string;priorityExplanation:string;notice:string;
  solutions?:{status:string;items:{title:string;description:string;url:string;reason:string}[]};
  areas:{code:string;name:string;definition:string;relevance:string;selfReport:{score:number|null;validCount:number;naCount:number;status:string};
    sjt:{score:number|null;validCount:number;status:string};practice:PEPractice|null}[];
  priorities:{code:string;name:string;reason:string;practice:PEPractice|null}[]};
export class PERequestError extends Error {constructor(message:string,public readonly code:string,public readonly status:number){super(message);}}
export async function peRequest<T>(token:string,path:string,method='GET',body?:unknown):Promise<T> {
  const response=await fetch(`/api/assessment/individual${path}`,{method,cache:'no-store',
    headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20_000)});
  const payload=await response.json().catch(()=>null);
  if(!response.ok||payload?.success!==true)throw new PERequestError(payload?.error||'Tidak dapat terhubung. Coba kembali.',payload?.code||'PE_NETWORK_ERROR',response.status);
  return payload as T;
}
export function firstUnanswered(questions:PEQuestion[],responses:Record<string,PEAnswer>) {
  const index=questions.findIndex(q=>!Object.hasOwn(responses,q.id));return index<0?questions.length:index;
}
export function countAnswered(questions:PEQuestion[],responses:Record<string,PEAnswer>) {
  return questions.filter(q=>Object.hasOwn(responses,q.id)).length;
}
export function personalSignInPath(mode='signin') {
  return `/?mode=${mode==='signup'?'signup':'signin'}&next=${encodeURIComponent('/insight/individual')}`;
}
