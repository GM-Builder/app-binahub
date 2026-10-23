import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { AssessmentRecord, DashboardData } from "../_lib/types";
import { briefFields, buildClientJourney, type JourneyEvent } from "../_lib/client-journey";
import { formatDate } from "../_lib/utils";

export function AssessmentBrief({ assessment }: { assessment: AssessmentRecord | null }) {
  return (
    <section aria-label="Brief kebutuhan" className="min-w-0 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">Brief kebutuhan</h3>
      {!assessment ? (
        <p className="text-sm leading-6 text-slate-600">
          Brief assessment belum tersedia pada data yang dimuat. Konfirmasi kebutuhan saat konsultasi.
        </p>
      ) : (
        <>
          <p className="break-words text-xs leading-5 text-slate-600">
            Disampaikan oleh {assessment.name}
            {Number.isFinite(Date.parse(assessment.createdAt)) ? ` · ${formatDate(assessment.createdAt)}` : ""}
          </p>
          <dl className="space-y-3">
            {briefFields(assessment).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-slate-600">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-900 [overflow-wrap:anywhere]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs leading-5 text-slate-600">
            Ini konteks dari responden, bukan kesimpulan penyebab atau bukti dampak program.
          </p>
        </>
      )}
    </section>
  );
}

export function ClientJourneyTimeline({ events }: { events: JourneyEvent[] }) {
  const [limit, setLimit] = useState(12);
  const visible = events.slice(0, limit);
  return (
    <section aria-label="Riwayat perjalanan klien" className="min-w-0 space-y-4">
      <p className="text-xs leading-5 text-slate-600">
        {events.length} aktivitas tersedia pada data yang dimuat, dari terbaru ke terlama.
        Riwayat ini dapat belum mencakup seluruh aktivitas klien.
      </p>
      {!visible.length ? (
        <p className="py-3 text-sm text-slate-600">Belum ada aktivitas terhubung yang dapat ditampilkan.</p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {visible.map((event) => (
            <li key={event.id} className="min-w-0 py-3 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>{event.source}</span>
                {event.at ? <time dateTime={event.at}>{formatDate(event.at)}</time> : <span>Tanggal belum tercatat</span>}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-900">{event.title}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{event.description}</p>
              {event.actor && <p className="mt-1 break-all text-xs text-slate-600">Oleh {event.actor}</p>}
            </li>
          ))}
        </ol>
      )}
      {limit < events.length && (
        <button type="button" onClick={() => setLimit((current) => current + 12)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-[#0B2C6B] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B]">
          Lihat {Math.min(12, events.length - limit)} aktivitas berikutnya
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

export function ClientJourneyContext({ data, accountId }: { data: DashboardData; accountId: string }) {
  const journey = useMemo(() => buildClientJourney(data, { accountId }), [data, accountId]);
  return (
    <section aria-label="Konteks dan perjalanan klien" className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <AssessmentBrief assessment={journey.brief} />
      <div className="mt-4 border-t border-slate-100 pt-4">
        <details>
          <summary className="cursor-pointer py-2 text-sm font-semibold text-[#0B2C6B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B]">Lihat perjalanan klien</summary>
          <div className="pt-3"><ClientJourneyTimeline key={accountId} events={journey.events} /></div>
        </details>
        <Link href="/admin/assessments" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#0B2C6B] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B]">
          Buka daftar assessment <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
