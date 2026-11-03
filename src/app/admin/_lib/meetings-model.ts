import type { CalendarBookingRecord } from './types';

export type ConsultationView = 'all' | 'upcoming' | 'today' | 'history' | 'cancelled' | 'review';
export type BookingSummary = Pick<CalendarBookingRecord, 'id' | 'title' | 'status' | 'attendeeName' | 'attendeeEmail'
  | 'eventTypeSlug' | 'startTime' | 'endTime' | 'timeZone' | 'updatedAt' | 'isUpcoming'> & { isSuperseded?: boolean };
export const CANCELLED_STATUSES = new Set(['cancelled', 'rejected', 'no_show']);
export const CONSULTATION_VIEWS: [ConsultationView, string][] = [
  ['upcoming', 'Mendatang'], ['today', 'Hari ini'], ['history', 'Riwayat'], ['cancelled', 'Tidak terlaksana'], ['review', 'Perlu ditinjau'], ['all', 'Semua'],
];
const dayKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export function bookingBucket(booking: BookingSummary, now = new Date()): Exclude<ConsultationView, 'all' | 'today'> {
  if (booking.isSuperseded) return 'history';
  if (CANCELLED_STATUSES.has(booking.status)) return 'cancelled';
  const start = new Date(booking.startTime || '').getTime(), end = new Date(booking.endTime || booking.startTime || '').getTime();
  if (!['requested', 'confirmed', 'rescheduled', 'completed'].includes(booking.status) || !Number.isFinite(start) || !Number.isFinite(end) || end < start) return 'review';
  return booking.status !== 'completed' && end >= now.getTime() ? 'upcoming' : 'history';
}
export function isTodayBooking(booking: BookingSummary, now = new Date()) {
  const bucket = bookingBucket(booking, now);
  return !booking.isSuperseded && ['upcoming', 'history'].includes(bucket) && dayKey(new Date(booking.startTime!)) === dayKey(now);
}
export function bookingDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...(options || {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) }).format(date) : 'Waktu belum tersedia';
}
export function safeMeetingUrl(value: string | null) {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
