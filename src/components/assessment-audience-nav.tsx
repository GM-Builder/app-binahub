import Link from 'next/link';
export function AssessmentAudienceNav({individual=false}:{individual?:boolean}){
  return <nav aria-label="Jenis Self Diagnostic" className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
    {[{label:'Tim / Organisasi',href:'/admin/assessments',active:!individual},{label:'Individu',href:'/admin/assessments/individual',active:individual}].map(tab=>
      <Link key={tab.href} href={tab.href} aria-current={tab.active?'page':undefined} className={`flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold ${tab.active?'bg-white text-blue-950 shadow-sm':'text-slate-500 hover:bg-white/70'}`}>{tab.label}</Link>)}
  </nav>;
}
