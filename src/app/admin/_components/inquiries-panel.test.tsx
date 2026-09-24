import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { InquiryRecord } from "../_lib/types";
import { InquiriesPanel } from "./inquiries-panel";

function inquiry(overrides: Partial<InquiryRecord> = {}): InquiryRecord {
  return {
    id: "inquiry-1",
    name: "Maya Sari",
    email: "maya@example.com",
    whatsapp: "628123456789",
    message: "Kami membutuhkan program leadership untuk manajer baru.",
    source: "Website",
    status: "Diproses",
    notes: "",
    replySubject: "Re: Kebutuhan program leadership",
    replyBody: "Yth. Ibu Maya, terima kasih telah menghubungi BinaHub.",
    replyStatus: "reviewed",
    followUpLevel: 0,
    followUpPaused: false,
    createdAt: "2026-09-24T08:00:00.000Z",
    ...overrides,
  };
}

describe("InquiriesPanel", () => {
  it("menampilkan prioritas operasional dan membuka alur balasan bertahap", () => {
    render(<InquiriesPanel inquiries={[inquiry()]} onAction={vi.fn()} onRefresh={vi.fn()} />);

    expect(screen.getByText("Fokus pada inquiry yang perlu dijawab")).toBeVisible();
    expect(screen.getAllByText("Siap dikirim").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Buka inquiry Maya Sari" }));
    expect(screen.getByText("Balasan berbantuan AI")).toBeVisible();
    expect(screen.getByText("Draf AI")).toBeVisible();
    expect(screen.getByText("Review admin")).toBeVisible();
    expect(screen.getByRole("button", { name: "Kirim balasan" })).toBeEnabled();
  });

  it("mempertahankan status backend yang belum ada di daftar status standar", () => {
    render(<InquiriesPanel inquiries={[inquiry()]} onAction={vi.fn()} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Buka inquiry Maya Sari" }));
    expect(screen.getByLabelText("Status inquiry")).toHaveValue("Diproses");
  });
});
