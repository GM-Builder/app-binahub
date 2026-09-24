"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, ExternalLink, Mail, RotateCcw, Video, XCircle } from "lucide-react";
import type { CalendarBookingRecord } from "../_lib/types";
import { formatDate } from "../_lib/utils";
import { AdminDrawer, AdminSearch, AdminSelect, Badge, EmptyState } from "./shared";

type ConsultationView = "upcoming" | "today" | "history" | "cancelled";

const CANCELLED_STATUSES = new Set(["cancelled", "rejected", "no_show"]);

function statusTone(status: string): "navy" | "gold" | "green" | "red" {
  if (["confirmed", "rescheduled", "completed"].includes(status)) return "green";
  if (CANCELLED_STATUSES.has(status)) return "red";
  if (status === "requested") return "gold";
  return "navy";
}

function statusLabel(status: string) {
  return ({ confirmed: "Terkonfirmasi", rescheduled: "Dijadwalkan ulang", completed: "Selesai", cancelled: "Dibatalkan", rejected: "Ditolak", no_show: "Tidak hadir", requested: "Menunggu konfirmasi" } as Record<string, string>)[status] || status.replaceAll("_", " ");
}

function isSameLocalDay(value: string | null, comparison = new Date()) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === comparison.getFullYear()
    && date.getMonth() === comparison.getMonth()
    && date.getDate() === comparison.getDate();
}

function bookingTime(value: string | null) {
  if (!value) return "Waktu belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Waktu belum tersedia";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(date).replace(".", ":");
}

function bookingDay(value: string | null) {
  if (!value) return { day: "–", month: "–" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "–", month: "–" };
  return {
    day: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date).replace(".", ""),
  };
}

function isUpcomingBooking(booking: CalendarBookingRecord) {
  return booking.isUpcoming && !CANCELLED_STATUSES.has(booking.status);
}

function ConsultationMetric({ label, value, note, icon: Icon, tone = "navy" }: {
  label: string;
  value: number;
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
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon size={16} aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-lg font-semibold tracking-tight text-slate-950">{value}</p><p className="truncate text-xs font-semibold text-slate-600">{label}</p><p className="truncate text-[10px] text-slate-400">{note}</p></div>
    </div>
  );
}

export function MeetingsPanel({ bookings }: { bookings: CalendarBookingRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua");
  const [view, setView] = useState<ConsultationView>("upcoming");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedBookings = useMemo(() => [...bookings].sort((left, right) => {
    const leftTime = left.startTime ? new Date(left.startTime).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.startTime ? new Date(right.startTime).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  }), [bookings]);
  const upcoming = sortedBookings.filter(isUpcomingBooking);
  const today = sortedBookings.filter((booking) => isUpcomingBooking(booking) && isSameLocalDay(booking.startTime));
  const cancelled = sortedBookings.filter((booking) => CANCELLED_STATUSES.has(booking.status));
  const history = sortedBookings.filter((booking) => !booking.isUpcoming && !CANCELLED_STATUSES.has(booking.status));
  const waiting = sortedBookings.filter((booking) => booking.status === "requested");
  const nextBooking = upcoming[0] || null;
  const selected = bookings.find((booking) => booking.id === selectedId) || null;

  const keyword = search.trim().toLocaleLowerCase("id-ID");
  const byView = view === "today" ? today : view === "history" ? history : view === "cancelled" ? cancelled : upcoming;
  const filtered = byView.filter((booking) =>
    (!keyword || [booking.attendeeName, booking.attendeeEmail, booking.title, booking.eventTypeSlug, booking.status]
      .join(" ").toLocaleLowerCase("id-ID").includes(keyword))
    && (status === "Semua" || booking.status === status)
  );

  const statuses = Array.from(new Set(bookings.map((booking) => booking.status))).sort();
  const hasFilters = Boolean(search || status !== "Semua");
  const viewCounts: Record<ConsultationView, number> = { upcoming: upcoming.length, today: today.length, history: history.length, cancelled: cancelled.length };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="consultation-summary-title">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#80560F]">Agenda konsultasi</p>
            <h2 id="consultation-summary-title" className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Jadwal yang perlu Anda siapkan</h2>
            {nextBooking ? (
              <div className="mt-5 flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#0B2C6B] text-white"><CalendarClock size={20} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate text-base font-semibold text-slate-950">{nextBooking.attendeeName}</p><Badge tone={statusTone(nextBooking.status)}>{statusLabel(nextBooking.status)}</Badge></div>
                  <p className="mt-1 truncate text-sm text-slate-600">{nextBooking.title}</p>
                  <p className="mt-2 text-xs font-semibold text-[#0B2C6B]">{formatDate(nextBooking.startTime)} · {nextBooking.timeZone}</p>
                </div>
                <button type="button" onClick={() => setSelectedId(nextBooking.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B]" aria-label={`Buka konsultasi ${nextBooking.attendeeName}`}><ArrowRight size={16} /></button>
              </div>
            ) : <p className="mt-5 text-sm leading-6 text-slate-500">Belum ada konsultasi mendatang. Booking baru dari Cal.com akan muncul otomatis.</p>}
          </div>
          <div className="grid grid-cols-2 gap-5 border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <ConsultationMetric label="Hari ini" value={today.length} note="Agenda terdekat" icon={CalendarDays} tone={today.length ? "gold" : "green"} />
            <ConsultationMetric label="Mendatang" value={upcoming.length} note="Belum selesai" icon={Clock3} />
            <ConsultationMetric label="Menunggu" value={waiting.length} note="Perlu konfirmasi" icon={CalendarClock} tone={waiting.length ? "gold" : "green"} />
            <ConsultationMetric label="Selesai" value={history.filter((item) => item.status === "completed").length} note="Riwayat konsultasi" icon={CheckCircle2} tone="green" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs" aria-labelledby="consultation-list-title">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-full overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto" role="group" aria-label="Tampilan konsultasi">
              {([["upcoming", "Mendatang"], ["today", "Hari ini"], ["history", "Riwayat"], ["cancelled", "Dibatalkan"]] as Array<[ConsultationView, string]>).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setView(key)} aria-pressed={view === key} className={`min-h-9 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition ${view === key ? "bg-white text-[#0B2C6B] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{label}<span className="ml-1.5 text-[10px] opacity-60">{viewCounts[key]}</span></button>
              ))}
            </div>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(240px,1fr)_190px_auto] xl:w-[650px]">
              <AdminSearch value={search} onChange={setSearch} placeholder="Cari peserta, email, atau agenda…" />
              <AdminSelect value={status} onChange={setStatus} ariaLabel="Filter status konsultasi" options={[["Semua", "Semua status"], ...statuses.map((item) => [item, statusLabel(item)] as [string, string])]} />
              {hasFilters && <button type="button" onClick={() => { setSearch(""); setStatus("Semua"); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={14} /> Reset</button>}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3"><h2 id="consultation-list-title" className="text-sm font-semibold text-slate-900">{view === "upcoming" ? "Konsultasi mendatang" : view === "today" ? "Agenda hari ini" : view === "history" ? "Riwayat konsultasi" : "Konsultasi dibatalkan"}</h2><p className="text-xs text-slate-400">{filtered.length} jadwal</p></div>
        </div>

        {!bookings.length ? <EmptyState title="Belum ada booking tersinkronisasi" description="Booking baru akan tampil otomatis setelah jadwal konsultasi dibuat melalui Cal.com." /> : filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((booking) => {
              const date = bookingDay(booking.startTime);
              return (
                <article key={booking.id} className="group px-4 py-4 transition hover:bg-slate-50/70 sm:px-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 shrink-0 rounded-xl border border-slate-200 bg-white py-2 text-center shadow-2xs"><p className="text-base font-semibold text-[#0B2C6B]">{date.day}</p><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{date.month}</p></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-slate-950">{booking.attendeeName}</h3><p className="mt-1 truncate text-xs text-slate-500">{booking.title}</p></div>
                        <div className="flex flex-wrap gap-1.5"><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge>{booking.isUpcoming && !CANCELLED_STATUSES.has(booking.status) && <Badge tone="navy">{bookingTime(booking.startTime)}</Badge>}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400"><span>{booking.attendeeEmail}</span><span aria-hidden="true">•</span><span>{booking.timeZone}</span><span aria-hidden="true">•</span><span>{booking.eventTypeSlug || "Konsultasi"}</span></div>
                    </div>
                    <button type="button" onClick={() => setSelectedId(booking.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-[#0B2C6B]/20 group-hover:text-[#0B2C6B]" aria-label={`Buka konsultasi ${booking.attendeeName}`}><ArrowRight size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <EmptyState title="Tidak ada jadwal pada tampilan ini" description={hasFilters ? "Coba ubah pencarian atau reset filter status." : "Jadwal akan muncul di sini saat status dan waktunya sesuai."} />}
      </section>

      {selected && <AdminDrawer title={selected.attendeeName} eyebrow="Detail konsultasi" onClose={() => setSelectedId(null)} maxWidth="max-w-2xl">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-950">{selected.title}</p><p className="mt-1 text-xs text-slate-500">{selected.eventTypeSlug || "Konsultasi BinaHub"}</p></div><Badge tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge></div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mulai</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.startTime)}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selesai</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{formatDate(selected.endTime)}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zona waktu</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{selected.timeZone}</dd></div>
              <div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penyelenggara</dt><dd className="mt-1 break-all text-sm font-semibold text-slate-800">{selected.organizerEmail || "Belum tercatat"}</dd></div>
            </dl>
            {selected.cancellationReason && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-rose-700"><XCircle size={14} /> Alasan pembatalan</p><p className="mt-1 text-xs leading-5 text-rose-700">{selected.cancellationReason}</p></div>}
          </section>

          <section aria-labelledby="consultation-contact-title">
            <h3 id="consultation-contact-title" className="text-sm font-semibold text-slate-950">Kontak peserta</h3>
            <p className="mt-1 text-xs text-slate-500">Gunakan kanal berikut untuk persiapan atau perubahan jadwal.</p>
            <a href={`mailto:${selected.attendeeEmail}`} className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B2C6B] transition hover:border-[#0B2C6B]/30"><Mail size={15} /> <span className="min-w-0 flex-1 truncate">{selected.attendeeEmail}</span><ArrowRight size={14} /></a>
          </section>

          {selected.meetingUrl ? <a href={selected.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-sm font-semibold text-white transition hover:bg-[#071B3D]"><Video size={16} /> Buka ruang konsultasi <ExternalLink size={14} /></a> : <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">Tautan pertemuan belum tersedia. Periksa kembali detail booking di Cal.com.</div>}
        </div>
      </AdminDrawer>}
    </div>
  );
}
