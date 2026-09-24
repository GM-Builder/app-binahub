import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "../_lib/types";
import { ContactsPanel } from "./contacts-panel";

function contact(overrides: Partial<ContactRecord> = {}): ContactRecord {
  return {
    id: "contact-1",
    recordId: "record-1",
    name: "Dewi Pratama",
    email: "dewi@example.com",
    whatsapp: "628123456789",
    message: "Ingin mendiskusikan pengembangan tim.",
    source: "Website",
    sourceType: "lead",
    category: "Prospek",
    status: "Baru",
    notes: "",
    createdAt: "2026-09-24T08:00:00.000Z",
    ...overrides,
  };
}

describe("ContactsPanel", () => {
  it("meringkas dan memfilter database kontak tanpa memenuhi layar dengan form", () => {
    render(
      <ContactsPanel
        contacts={[contact(), contact({ id: "contact-2", recordId: "record-2", name: "Raka Putra", email: "raka@example.com", source: "Assessment" })]}
        onAction={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(screen.getByText("Semua kontak dalam satu pandangan")).toBeVisible();
    expect(screen.getByText("Dewi Pratama")).toBeVisible();
    expect(screen.getByText("Raka Putra")).toBeVisible();

    fireEvent.change(screen.getByPlaceholderText(/Cari nama, email/), { target: { value: "Raka" } });
    expect(screen.queryByText("Dewi Pratama")).not.toBeInTheDocument();
    expect(screen.getByText("Raka Putra")).toBeVisible();
  });

  it("membuka kontak yang benar saat sumber berbeda memakai id yang sama", () => {
    render(
      <ContactsPanel
        contacts={[
          contact(),
          contact({ name: "Maya Sari", source: "Assessment", sourceType: "assessment", category: "Peserta", email: "maya@example.com" }),
        ]}
        onAction={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka detail Maya Sari" }));
    expect(screen.getByRole("heading", { name: "Maya Sari", level: 2 })).toBeVisible();
    expect(screen.getByText(/Kontak ini berasal dari sumber referensi/)).toBeVisible();
  });
});
