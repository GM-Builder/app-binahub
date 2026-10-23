import { useState } from 'react';
import { SpinDiscovery } from '@/components/spin-discovery';
import { SpinReport } from '@/components/spin-report';
import { SpinPanel } from '@/app/admin/_components/spin-panel';
import { spinSyntheticReport } from '@/test/fixtures/spin-report';
export function SpinPreview(){const[mode,setMode]=useState(new URLSearchParams(location.search).get('view')||'form');
 return <><div className="flex flex-wrap items-center gap-4 bg-slate-900 px-5 py-2 text-xs text-white"><span>Preview SPIN · Data sintetis · API dimock saat tes</span>{['form','report','admin'].map(v=><button type="button" key={v} onClick={()=>setMode(v)} className="min-h-9 rounded-md px-2 underline">{v}</button>)}</div>{mode==='report'?<main className="min-h-screen bg-[#F7F8FA] px-5 py-8"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-9"><SpinReport report={spinSyntheticReport}/></div></main>:mode==='admin'?<main className="min-h-screen bg-[#F7F8FA] p-5 sm:p-8"><SpinPanel/></main>:<SpinDiscovery/>}</>;
}
