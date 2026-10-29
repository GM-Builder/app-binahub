import { useId } from 'react';
import type { PEReport } from '@/lib/individual-assessment';
import { peCombinedScore } from '@/lib/pe-combined-score';

export const formatPEScore = (value: number | null) => value === null ? '—'
  : value.toLocaleString('id-ID', { maximumFractionDigits: 2 });

/** Existing method evidence plus owner-approved 50:50 display; not a mastery percentage. */
export function PEProfileChart({ areas,combined=false }: { areas: PEReport['areas'];combined?:boolean }) {
  const id = useId();
  const series = [
    { key: 'selfReport' as const, name: 'Pengalaman nyata', color: '#0B2C6B' },
    { key: 'sjt' as const, name: 'Studi kasus', color: '#0F766E' },
  ];
  return <figure aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}>
    <figcaption id={`${id}-title`} className="sr-only">Grafik profil per area</figcaption>
    <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-700">
      {combined?<span>Skor gabungan · pengalaman nyata 50% dan studi kasus 50%</span>:series.map(item => <span key={item.key} className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />{item.name}</span>)}
    </div>
    {areas.length === 0 ? <p className="py-4 text-sm leading-6 text-slate-600">Belum ada profil area yang dapat ditampilkan.</p>
      : <div className="space-y-6">{areas.map(area => <div key={area.code}>
        <p className="mb-2.5 break-words text-sm font-semibold text-slate-900">{area.name}</p>
        <div className="space-y-2.5">{(combined?[{key:'selfReport' as const,name:'Skor gabungan',color:'#0B2C6B'}]:series).map(item => {
          const value = combined?peCombinedScore(area.selfReport.score,area.sjt.score):area[item.key].score;
          return <div key={item.key} role="img" aria-label={`${area.name}, ${item.name}: ${value === null ? 'bukti belum cukup' : `${formatPEScore(value)} dari 100`}`}
            className="grid grid-cols-[7.25rem_minmax(0,1fr)_3.5rem] items-center gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_3.5rem]">
            <span aria-hidden="true" className="text-xs leading-5 text-slate-600">{item.name}</span>
            <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="h-5 w-full overflow-visible" aria-hidden="true" focusable="false">
              <rect x="0" y="3" width="400" height="14" rx="3" fill={value === null ? 'none' : '#F1F5F9'} stroke={value === null ? '#94A3B8' : 'none'} strokeDasharray={value === null ? '4 4' : undefined} />
              {[0, 100, 200, 300, 400].map(x => <line key={x} x1={x} x2={x} y1="1" y2="19" stroke="#CBD5E1" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
              {value !== null && <rect x="0" y="3" width={value * 4} height="14" rx="3" fill={item.color} />}
              {value === 0 && <line x1="0" x2="0" y1="3" y2="17" stroke={item.color} strokeWidth="3" vectorEffect="non-scaling-stroke" />}
            </svg>
            <span aria-hidden="true" className="text-right text-sm font-semibold tabular-nums text-slate-900">{formatPEScore(value)}</span>
          </div>;
        })}</div>
      </div>)}</div>}
    {areas.length > 0 && <div aria-hidden="true" className="mt-3 grid grid-cols-[7.25rem_minmax(0,1fr)_3.5rem] gap-2 text-xs tabular-nums text-slate-500 sm:grid-cols-[8rem_minmax(0,1fr)_3.5rem]"><span /><div className="flex justify-between"><span>0</span><span>50</span><span>100</span></div><span /></div>}
    <p id={`${id}-help`} className="sr-only">Tanda — berarti bukti belum cukup, bukan nilai nol.</p>
  </figure>;
}
