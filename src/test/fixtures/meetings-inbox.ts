export const meetingFixture = (extra: Record<string, unknown> = {}) => ({
  id: '00000000-0000-4000-8000-000000000001', title: 'Konsultasi kebutuhan organisasi', status: 'confirmed', attendeeName: 'Dewi Sintetis',
  attendeeEmail: 'dewi@company.invalid', eventTypeSlug: 'konsultasi-30-menit', startTime: '2099-01-01T00:00:00Z', endTime: '2099-01-01T01:00:00Z',
  timeZone: 'America/New_York', updatedAt: '2026-11-03T03:00:00Z', isUpcoming: true, isSuperseded: false, ...extra,
});
export const meetingDetail = (extra: Record<string, unknown> = {}) => ({ ...meetingFixture(), providerUid: 'cal-synthetic', leadId: null,
  assessmentId: null, organizerEmail: 'admin@company.invalid', meetingUrl: 'https://meet.company.invalid/synthetic', cancellationReason: null, ...extra });
export const meetingsBody = (records = [meetingFixture()], total = 41, page = 0) => ({ success: true, version: 1, page, pageSize: 20,
  snapshotAt: '2026-11-03T03:00:00Z', timeZone: 'Asia/Jakarta', total, counts: { all: 1201, upcoming: 41, today: 2, history: 1154,
    cancelled: 4, review: 2, waiting: 3, completed: 750 }, statuses: ['confirmed', 'cancelled', 'unknown'], nextBooking: meetingFixture(), records });
