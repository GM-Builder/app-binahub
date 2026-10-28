import type {Metadata} from 'next';
import {IndividualPackages} from '@/components/individual-packages';
import {personalEntryPath} from '@/lib/individual-assessment';
export const metadata:Metadata={title:'Paket Self Diagnostic | BinaHub',robots:{index:false,follow:false}};
export default async function PackagesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams,query=new URLSearchParams();
 for(const [key,value] of Object.entries(params))if(typeof value==='string')query.set(key,value);
 return <IndividualPackages freeHref={personalEntryPath('?'+query.toString())}/>;
}
