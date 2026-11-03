"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, ExternalLink, Mail, RotateCcw, Video, XCircle } from "lucide-react";
import type { CalendarBookingRecord } from "../_lib/types";
import { useMeetingsInbox } from '../_lib/use-meetings-inbox';
import { bookingBucket, bookingDate, CANCELLED_STATUSES, CONSULTATION_VIEWS, isTodayBooking, safeMeetingUrl, type ConsultationView } from '../_lib/meetings-model';
import { AdminDrawer, AdminSearch, AdminSelect, Badge, EmptyState } from "./shared";

function statusTone(status: string): "navy" | "gold" | "green" | "red" {
  if (["confirmed", "rescheduled", "completed"].includes(status)) return "green";
  if (CANCELLED_STATUSES.has(status)) return "red";
  if (status === "requested") return "gold";
  return "navy";
}

function statusLabel(status: string) {
  return ({ confirmed: "Terkonfirmasi", rescheduled: "Dijadwalkan ulang", completed: "Selesai", cancelled: "Dibatalkan", rejected: "Ditolak", no_show: "Tidak hadir", requested: "Menunggu konfirmasi" } as Record<string, string>)[status] || status.replaceAll("_", " ");
}

function bookingTime(value: string | null) {
  return bookingDate(value, { hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIB';
}

function bookingDay(value: string | null) {
  if (!value) return { day: "–", month: "–" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "–", month: "–" };
  return {
    day: bookingDate(value, { day: '2-digit' }),
    month: bookingDate(value, { month: 'short' }).replace('.', ''),
  };
}

function ConsultationMetric({ label, value, note, icon: Icon, tone = "navy" }: {
  label: string;
  value: number | null;
  note: string;
  icon: typeof CalendarClock;
  tone?: "navy" | "gold" | "green" | "red";
}) {
  const tones = {
    navy: "bg-[#EAF0F8] text-[#0B2C6B]",
    gold: "bg-amber-50 text-[#80560F]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="flex min-w-0 items-center gap-3 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0">
      <span className={`hidden h-9 w-9 shrink-0 place-items-center rounded-xl sm:grid ${tones[tone]}`}><Icon size={16} aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-lg font-semibold tabular-nums tracking-tight text-slate-950">{value ?? '—'}</p><p className="text-xs font-semibold text-slate-600">{label}</p><p className="text-xs text-slate-600">{note}</p></div>
    </div>
  );
}

export function MeetingsPanel({ bookings = [], serverMode = false, refreshToken, onOpenChecklist }: { bookings?: CalendarBookingRecord[]; serverMode?: boolean; refreshToken?: string | number; onOpenChecklist?: (booking: CalendarBookingRecord) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [view, setView] = useState<ConsultationView>("upcoming");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedBookings = useMemo(() => [...bookings].sort((left, right) => {
    const leftTime = left.startTime ? new Date(left.startTime).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.startTime ? new Date(right.startTime).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  }), [bookings]);
  const remote = useMeetingsInbox({ enabled: serverMode, search, status, view, selectedId, refreshToken });
  const upcoming = sortedBookings.filter(booking => bookingBucket(booking) === 'upcoming');
  const today = sortedBookings.filter(booking => isTodayBooking(booking));
  const cancelled = sortedBookings.filter(booking => bookingBucket(booking) === 'cancelled');
  const history = sortedBookings.filter(booking => bookingBucket(booking) === 'history');
  const review = sortedBookings.filter(booking => bookingBucket(booking) === 'review');
  const nextBooking = serverMode ? remote.data?.nextBooking : upcoming[0];
  const selected = serverMode ? remote.record : bookings.find((booking) => booking.id === selectedId) || null;
  const meetingUrl = safeMeetingUrl(selected?.meetingUrl || null);

  const keyword = search.trim().toLocaleLowerCase("id-ID");
  const byView = view === 'all' ? sortedBookings : view === 'review' ? review : view === "today" ? today : view === "history" ? history : view === "cancelled" ? cancelled : upcoming;
  const filtered = serverMode ? remote.data?.records || [] : byView.filter((booking) =>
    (!keyword || [booking.attendeeName, booking.attendeeEmail, booking.title, booking.eventTypeSlug, booking.status]
      .join(" ").toLocaleLowerCase("id-ID").includes(keyword))
    && (status === "Semua" || booking.status === status)
  );

  const statuses = Array.from(new Set([...(serverMode ? remote.statuses : bookings.map(booking => booking.status)), ...(status === 'Semua' ? [] : [status])])).sort();
  const hasFilters = Boolean(search || status !== "Semua");
  const counts = serverMode ? remote.data?.counts : { all: bookings.length, upcoming: upcoming.length, today: today.length, history: history.length,
    cancelled: cancelled.length, review: review.length, waiting: upcoming.filter(b => b.status === 'requested').length,
    completed: bookings.filter(b => b.status === 'completed' && !('isSuperseded' in b && b.isSuperseded)).length };
  const total = serverMode ? remote.data?.total : filtered.length;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="consultation-summary-title">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
          <div className="min-w-0 p-5 sm:p-6">
            <h2 id="consultation-summary-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Jadwal yang perlu Anda siapkan</h2>
            {nextBooking ? (
              <div className="mt-5 flex items-start gap-3 sm:gap-4">
                <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0B2C6B] text-white sm:grid"><CalendarClock size={20} aria-hidden="true" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate text-base font-semibold text-slate-950">{nextBooking.attendeeName}</p><Badge tone={statusTone(nextBooking.status)}>{statusLabel(nextBooking.status)}</Badge></div>
                  <p className="mt-1 truncate text-sm text-slate-600">{nextBooking.title}</p>
                  <p className="mt-2 text-xs font-semibold text-[#0B2C6B]">{bookingDate(nextBooking.startTime)} WIB</p>
                </div>
                <button type="button" onClick={() => setSelectedId(nextBooking.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B]" aria-label={`Buka konsultasi ${nextBooking.attendeeName}`}><ArrowRight size={16} /></button>
              </div>
            ) : <p className="mt-5 text-sm leading-6 text-slate-600">{serverMode && (remote.loading || remote.error) ? 'Ringkasan jadwal belum tersedia.' : 'Belum ada konsultasi mendatang. Booking baru dari Cal.com akan muncul otomatis.'}</p>}
            <p className="mt-4 text-xs leading-5 text-slate-600">Seluruh waktu ditampilkan dalam WIB. Jadwal yang telah lewat belum tentu berstatus selesai.</p>
            {serverMode && <button type="button" onClick={remote.refresh} className="mt-3 min-h-11 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#0B2C6B]">Perbarui jadwal</button>}
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-5 border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <ConsultationMetric label="Hari ini" value={counts?.today ?? null} note="Agenda dalam WIB" icon={CalendarDays} />
            <ConsultationMetric label="Mendatang" value={counts?.upcoming ?? null} note="Belum lewat" icon={Clock3} />
            <ConsultationMetric label="Menunggu" value={counts?.waiting ?? null} note="Perlu konfirmasi" icon={CalendarClock} tone="gold" />
            <ConsultationMetric label="Selesai" value={counts?.completed ?? null} note="Status tercatat" icon={CheckCircle2} tone="green" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="consultation-list-title">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-full overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto" role="group" aria-label="Tampilan konsultasi">
              {CONSULTATION_VIEWS.map(([key, label]) => (
                <button key={key} type="button" onClick={() => setView(key)} aria-pressed={view === key} className={`min-h-11 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition ${view === key ? "bg-white text-[#0B2C6B] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>{label}{' '}<span className="ml-1.5 text-xs">{counts?.[key] ?? '—'}</span></button>
              ))}
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
              <AdminSearch value={search} onChange={value => setSearch(value.slice(0, 150))} placeholder="Cari peserta, email, atau agenda…" />
              <AdminSelect value={status} onChange={setStatus} ariaLabel="Filter status konsultasi" options={[["Semua", "Semua status"], ...statuses.map((item) => [item, statusLabel(item)] as [string, string])]} />
              {hasFilters && <button type="button" onClick={() => { setSearch(""); setStatus("Semua"); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={14} /> Reset</button>}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3"><h2 id="consultation-list-title" className="text-sm font-semibold text-slate-900">{view === 'all' ? 'Seluruh konsultasi' : view === 'review' ? 'Jadwal perlu ditinjau' : view === "upcoming" ? "Konsultasi mendatang" : view === "today" ? "Agenda hari ini" : view === "history" ? "Riwayat konsultasi" : "Konsultasi tidak terlaksana"}</h2><p className="text-xs text-slate-600">{total ?? '—'} jadwal</p></div>
          <p className="mt-2 text-xs leading-5 text-slate-600">{serverMode ? 'Pencarian mencakup seluruh arsip. Jumlah di tab dan ringkasan tidak mengikuti filter.' : 'Daftar mengikuti rekaman yang dimuat.'} {view === 'review' ? 'Periksa waktu atau status booking yang belum jelas di Cal.com.' : view === 'history' ? 'Termasuk slot lama yang telah diganti jadwal baru.' : view === 'today' ? 'Termasuk agenda yang telah lewat hari ini, tanpa pembatalan dan slot yang diganti.' : ''}</p>
        </div>

        {serverMode && remote.loading ? <p role="status" className="p-6 text-sm text-slate-600">Memuat jadwal dari seluruh arsip…</p> : serverMode && remote.error ? <div role="alert" className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{remote.error}</p><button type="button" onClick={remote.refresh} className="mt-3 min-h-11 rounded-lg border border-amber-300 px-3 font-semibold">Coba muat jadwal lagi</button></div> : !counts?.all ? <EmptyState title="Belum ada booking tersinkronisasi" description="Booking baru akan tampil otomatis setelah jadwal konsultasi dibuat melalui Cal.com." /> : filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((booking) => {
              const date = bookingDay(booking.startTime);
              return (
                <article key={booking.id} className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 shrink-0 rounded-xl border border-slate-200 bg-white py-2 text-center shadow-2xs"><p className="text-base font-semibold text-[#0B2C6B]">{date.day}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{date.month}</p></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0"><h3 className="break-words text-sm font-semibold text-slate-950">{booking.attendeeName}</h3><p className="mt-1 break-words text-xs text-slate-600">{booking.title}</p></div>
                        <div className="flex flex-wrap gap-1.5"><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>{'isSuperseded' in booking && booking.isSuperseded ? <Badge tone="navy">Slot telah diganti</Badge> : booking.startTime && <Badge tone="navy">{bookingTime(booking.startTime)}</Badge>}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600"><span className="break-all">{booking.attendeeEmail}</span><span aria-hidden="true">•</span><span>{bookingDate(booking.startTime, { day: 'numeric', month: 'short', year: 'numeric' })}</span><span aria-hidden="true">•</span><span className="break-all">{booking.eventTypeSlug || "Konsultasi"}</span></div>
                    </div>
                    <button type="button" onClick={() => setSelectedId(booking.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-[#0B2C6B]/20 group-hover:text-[#0B2C6B]" aria-label={`Buka konsultasi ${booking.attendeeName}`}><ArrowRight size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <EmptyState title="Tidak ada jadwal pada tampilan ini" description={hasFilters ? "Coba ubah pencarian atau reset filter status." : "Jadwal akan muncul di sini saat status dan waktunya sesuai."} />}
        {serverMode && remote.data && <nav aria-label="Halaman konsultasi" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-xs text-slate-600"><p role="status">{remote.data.total ? remote.page * 20 + 1 : 0}–{Math.min((remote.page + 1) * 20, remote.data.total)} dari {remote.data.total} jadwal</p><div className="flex flex-wrap items-center gap-3"><button type="button" disabled={remote.page === 0} onClick={() => remote.setPage(remote.page - 1)} className="min-h-11 rounded-lg border border-slate-200 px-3 font-semibold disabled:opacity-40">Sebelumnya</button><span>Halaman {remote.page + 1}</span><button type="button" disabled={(remote.page + 1) * 20 >= remote.data.total} onClick={() => remote.setPage(remote.page + 1)} className="min-h-11 rounded-lg border border-slate-200 px-3 font-semibold disabled:opacity-40">Berikutnya</button></div></nav>}
      </section>

      {selectedId && <AdminDrawer title={selected?.attendeeName || 'Detail konsultasi'} onClose={() => setSelectedId(null)} maxWidth="max-w-2xl">
        {serverMode && remote.detailLoading ? <p role="status">Memuat detail konsultasi…</p> : serverMode && remote.detailError ? <div role="alert"><p>{remote.detailError}</p><button type="button" onClick={remote.retryDetail} className="mt-3 min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold">Coba muat detail lagi</button></div> : selected && <>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-950">{selected.title}</p><p className="mt-1 text-xs text-slate-500">{selected.eventTypeSlug || "Konsultasi BinaHub"}</p></div><Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge></div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-slate-600">Mulai (WIB)</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{bookingDate(selected.startTime)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-600">Selesai (WIB)</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{bookingDate(selected.endTime)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-600">Zona waktu asal booking</dt><dd className="mt-1 break-all text-sm font-semibold text-slate-800">{selected.timeZone}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penyelenggara</dt><dd className="mt-1 break-all text-sm font-semibold text-slate-800">{selected.organizerEmail || "Belum tercatat"}</dd></div>
            </dl>
            {Boolean('isSuperseded' in selected && selected.isSuperseded) && <p className="mt-4 text-sm leading-6 text-slate-700">Slot ini telah diganti oleh jadwal yang lebih baru. Jangan gunakan tautan slot lama untuk pertemuan.</p>}
            {selected.cancellationReason && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-rose-700"><XCircle size={14} /> Alasan pembatalan</p><p className="mt-1 text-xs leading-5 text-rose-700">{selected.cancellationReason}</p></div>}
          </section>

          <section aria-labelledby="consultation-contact-title">
            <h3 id="consultation-contact-title" className="text-sm font-semibold text-slate-950">Kontak peserta</h3>
            <p className="mt-1 text-xs text-slate-500">Gunakan kanal berikut untuk persiapan atau perubahan jadwal.</p>
            <a href={`mailto:${selected.attendeeEmail}`} className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B2C6B] transition hover:border-[#0B2C6B]/30"><Mail size={15} /> <span className="min-w-0 flex-1 truncate">{selected.attendeeEmail}</span><ArrowRight size={14} /></a>
          </section>

          {onOpenChecklist && <button type="button" onClick={() => onOpenChecklist(selected)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#0B2C6B]">Buka checklist kebutuhan <ArrowRight size={15} aria-hidden="true" /></button>}
          {meetingUrl && selected.isUpcoming && !('isSuperseded' in selected && selected.isSuperseded) ? <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white transition hover:bg-[#071B3D]"><Video size={16} aria-hidden="true" /> Buka ruang konsultasi <ExternalLink size={14} aria-hidden="true" /></a> : <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">Ruang konsultasi hanya tersedia untuk jadwal mendatang dengan tautan HTTPS yang valid. Periksa detail booking di Cal.com.</div>}
        </div></>}
      </AdminDrawer>}
    </div>
  );
}
