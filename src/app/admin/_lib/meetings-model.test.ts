import { describe, expect, it } from 'vitest';
import { meetingFixture } from '@/test/fixtures/meetings-inbox';
import { bookingBucket, bookingDate, isTodayBooking, safeMeetingUrl } from './meetings-model';
const now = new Date('2026-11-03T17:01:00Z'); // 4 November in WIB, still 3 November in UTC.
describe('consultation time and link semantics', () => {
  it('uses WIB, not the device or the source timezone, including earlier same-day slots', () => {
    const current = meetingFixture({ startTime: '2026-11-03T17:00:00Z', endTime: '2026-11-03T17:00:00Z' });
    expect(isTodayBooking(current, now)).toBe(true); expect(bookingBucket(current, now)).toBe('history');
    expect(isTodayBooking(meetingFixture({ startTime: '2026-11-03T16:59:00Z', endTime: '2026-11-03T16:59:00Z' }), now)).toBe(false);
    expect(bookingDate(current.startTime, { day: 'numeric', month: 'short' })).toContain('4 Nov');
  });
  it('retains invalid records, cancellations and superseded slots in explicit views', () => {
    expect(bookingBucket(meetingFixture({ startTime: null }), now)).toBe('review');
    expect(bookingBucket(meetingFixture({ status: 'unknown' }), now)).toBe('review');
    expect(bookingBucket(meetingFixture({ status: 'no_show' }), now)).toBe('cancelled');
    expect(bookingBucket(meetingFixture({ isSuperseded: true }), now)).toBe('history');
    expect(isTodayBooking(meetingFixture({ startTime: null }), now)).toBe(false);
  });
  it.each(['javascript:alert(1)', 'http://meet.invalid', 'https://user:secret@meet.invalid', '//meet.invalid', null])('refuses unsafe room URL %s', value => expect(safeMeetingUrl(value)).toBeNull());
});
