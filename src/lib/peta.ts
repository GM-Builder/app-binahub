export type PetaChoice='A'|'B'|'C'|'D';
export type PetaPair={most:PetaChoice|null;least:PetaChoice|null};
export type PetaBlock={id:string;order:number;context:string;options:{id:string;code:PetaChoice;text:string}[]};
export type PetaSession={id:string;status:'in_progress'|'submitted';revision:number;participantCode:string;instrumentVersion:string;retentionUntil:string;submittedAt:string|null;reviewConsent:boolean;privacyReference:string;consentVersion:string;blocks:PetaBlock[];answers:Record<string,PetaPair>};
export type PetaReportData={result:{instrumentVersion:string;method:string;rows:{dimension:'D'|'I'|'S'|'C';most:number;least:number;net:number}[];topDimensions:string[];topIsTied:boolean;closeTopScores:boolean};participantCode:string;submittedAt:string;retentionUntil:string};
export type PetaInvitation={workspaceName:string;privacyReference:string;retentionMonths:number;consultantAccess:boolean;consentVersion:string;purpose:'start'|'resume';expiresAt:string};
export class PetaRequestError extends Error{constructor(message:string,public code:string,public status:number){super(message);}}
export async function petaRequest<T>(path:string,method='GET',input?:unknown,headers:Record<string,string>={}):Promise<T>{
 const response=await fetch(new URL('/api/peta/'+path,window.location.origin),{method,credentials:'include',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{...(input?{'Content-Type':'application/json'}:{}),...headers},...(input?{body:JSON.stringify(input)}:{})});
 const payload=await response.json().catch(()=>null);if(!response.ok||payload?.success!==true)throw new PetaRequestError(payload?.error||'PETA belum dapat dihubungi. Coba kembali.',payload?.code||'PETA_UNAVAILABLE',response.status);return payload;
}
export const validPetaPair=(pair:PetaPair|undefined)=>Boolean(pair?.most&&pair.least&&pair.most!==pair.least);
export const petaDate=(value:string)=>new Date(value).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
