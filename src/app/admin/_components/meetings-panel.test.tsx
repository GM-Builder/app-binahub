import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CalendarBookingRecord } from "../_lib/types";
import { MeetingsPanel } from "./meetings-panel";

function booking(overrides: Partial<CalendarBookingRecord> = {}): CalendarBookingRecord {
  return {
    id: "booking-1",
    providerUid: "cal-1",
    leadId: "lead-1",
    assessmentId: null,
    eventTypeSlug: "konsultasi-30-menit",
    title: "Konsultasi kebutuhan organisasi",
    status: "confirmed",
    attendeeName: "Dewi Pratama",
    attendeeEmail: "dewi@example.com",
    organizerEmail: "konsultan@binahub.id",
    startTime: "2030-09-24T09:00:00.000Z",
    endTime: "2030-09-24T09:30:00.000Z",
    timeZone: "Asia/Jakarta",
    meetingUrl: "https://meet.example.com/dewi",
    cancellationReason: null,
    updatedAt: "2026-09-24T08:00:00.000Z",
    isUpcoming: true,
    ...overrides,
  };
}

describe("MeetingsPanel", () => {
  it("memisahkan agenda mendatang dari pembatalan agar daftar utama tetap fokus", () => {
    render(<MeetingsPanel bookings={[
      booking(),
      booking({ id: "booking-2", attendeeName: "Raka Putra", attendeeEmail: "raka@example.com", status: "cancelled", isUpcoming: false, cancellationReason: "Jadwal berubah" }),
    ]} />);

    expect(screen.getByText("Jadwal yang perlu Anda siapkan")).toBeVisible();
    expect(screen.getAllByText("Dewi Pratama").length).toBeGreaterThan(0);
    expect(screen.queryByText("Raka Putra")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Dibatalkan/ }));
    expect(screen.getByText("Raka Putra")).toBeVisible();
    expect(screen.getAllByText("Dewi Pratama")).toHaveLength(1);
  });

  it("membuka detail konsultasi dengan kontak dan ruang pertemuan", () => {
    render(<MeetingsPanel bookings={[booking()]} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Buka konsultasi Dewi Pratama" })[0]);
    expect(screen.getByRole("heading", { name: "Dewi Pratama", level: 2 })).toBeVisible();
    expect(screen.getByRole("link", { name: /dewi@example.com/ })).toHaveAttribute("href", "mailto:dewi@example.com");
    expect(screen.getByRole("link", { name: /Buka ruang konsultasi/ })).toHaveAttribute("href", "https://meet.example.com/dewi");
  });
});
