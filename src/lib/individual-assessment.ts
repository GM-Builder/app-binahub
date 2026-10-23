export type PEAnswer=number|'NA'|'A'|'B'|'C'|'D';
export type PEContext={role:string;goal:string;relevance:Record<string,'low'|'normal'|'high'>};
export type PEQuestion={id:string;competencyCode:string;type:string;prompt?:string;scenario?:string;question?:string;
  options?:{id:string;text:string}[]};
export type PEDefinition={policyId:string;consentVersion:string;privacyVersion:string;notice:string;privacyNotice:string;
  features?:{pilot:boolean;history:boolean};acceptingNew?:boolean;sharingConsentVersion?:string;sharingNotice?:string;
  competencies:{code:string;name:string;definition:string}[];selfReportItems:PEQuestion[];sjtItems:PEQuestion[];
  selfReportScale:{value:number|'NA';label:string}[]};
export type PEAttempt={id:string;status:'draft'|'submitted';revision:number;responses:Record<string,PEAnswer>;
  context:PEContext;retentionUntil:string;submittedAt:string|null};
export type PEPractice={focus:string;context:string;successIndicator:string;followUp:string};
export type PEReviewAccess={shared:boolean;evaluationConsent:boolean;exportConsent?:boolean;clarity:number|null;usefulness:number|null};
export type PEHistory={id:string;status:'draft'|'submitted';createdAt:string;retentionUntil:string;answeredCount:number};
export type PEReport={goal:string;methodology:string;priorityExplanation:string;notice:string;
  metadata?:{instrumentId:string;instrumentVersion:string;scoringVersion:string;reportVersion:string;priorityVersion:string;assessmentDate:string;generatedAt:string;releaseStatus:string};
  summary?:{role:string;goal:string;expectedCount:number;answeredCount:number;naCount:number;areasWithBothMethods:number;focusNames:string[];description:string};
  privacy?:{purpose:string;access:string;retentionUntil:string;contact:string;process:string};
  solutions?:{status:string;items:{title:string;description:string;url:string;reason:string}[]};
  areas:{code:string;name:string;definition:string;relevance:string;interpretation?:string;selfReport:{score:number|null;validCount:number;naCount:number;status:string};
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
export function peChannel(search:string) {
  const params=new URLSearchParams(search),value=(params.get('source')||params.get('utm_source')||'direct').toLowerCase();
  if(['instagram','tiktok','linkedin','google','email','website','direct'].includes(value))return value;
  if(['ig','instagram_ads'].includes(value))return 'instagram';
  if(['newsletter','outbound'].includes(value))return 'email';
  return 'other';
}
export function individualTrackingParams(search:string) {
  const input = new URLSearchParams(search), output = new URLSearchParams();
  // Whitelist campaign fields, excluding obvious contact details and URLs/capabilities.
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','msclkid','bh_journey']) {
    const value = input.get(key)?.trim();
    if (!value || value.length>500 || /@|[\r\n]|https?:\/\/|bearer\s|(?:access_token|api_key|secret)=/i.test(value)) continue;
    if (key !== 'bh_journey' || /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value)) output.set(key,value);
  }
  return output;
}
export function personalEntryPath(search:string) {
  const output=individualTrackingParams(search);
  const channel=peChannel(search); if(channel!=='direct')output.set('source',channel);
  return `/insight/individual${output.size?'?'+output.toString():''}`;
}
export function personalSignInPath(mode='signin',search='') {
  const params=new URLSearchParams(search),id=params.get('attempt');
  const path=id&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)?`/insight/individual?attempt=${id}`:personalEntryPath(search);
  return `/?mode=${mode==='signup'?'signup':'signin'}&next=${encodeURIComponent(path)}`;
}
