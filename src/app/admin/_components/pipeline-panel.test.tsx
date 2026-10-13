import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardData, PipelineLeadRecord } from "../_lib/types";
import {
  PipelinePanel,
  isLikelyTestLead,
  leadNeedsAttention,
  sortPipelineLeads,
} from "./pipeline-panel";
import {
  formFromLead,
  isOverdue,
  validatePipelineForm,
} from "../_lib/pipeline-model";

const NOW = Date.parse("2026-09-01T10:00:00.000Z");

function lead(overrides: Partial<PipelineLeadRecord> = {}): PipelineLeadRecord {
  return {
    id: "lead-1",
    name: "Dewi Pratama",
    email: "dewi@example.com",
    company: "PT Maju Bersama",
    industry: "Jasa",
    location: "Jakarta",
    qualificationProfile: {},
    phone: "",
    source: "assessment",
    leadScore: 72,
    leadTemperature: "warm",
    leadScoreConfidence: 90,
    lifecycleStage: "lead",
    opportunityStage: "qualified",
    opportunityOwner: "admin@binahub.id",
    nextAction: "Jadwalkan konsultasi",
    nextActionDueAt: "2026-09-02T10:00:00.000Z",
    leadTimeZone: "Asia/Jakarta",
    opportunityValue: 25_000_000,
    lostReason: null,
    wonAt: null,
    lostAt: null,
    outreachPaused: false,
    outreachPauseReason: null,
    outreachPausedAt: null,
    outreachPausedBy: null,
    pipelineUpdatedAt: null,
    createdAt: "2026-09-01T07:00:00.000Z",
    ...overrides,
  };
}

describe("pipeline operational prioritization", () => {
  it("recognizes isolated phase evidence as internal test data", () => {
    expect(isLikelyTestLead(lead({ email: "phase13@example.invalid" }))).toBe(
      true,
    );
    expect(isLikelyTestLead(lead({ name: "Phase 13 Cal.com Evidence" }))).toBe(
      true,
    );
    expect(isLikelyTestLead(lead())).toBe(false);
  });

  it("marks active opportunities without an owner or overdue action for attention", () => {
    expect(leadNeedsAttention(lead({ opportunityOwner: null }), NOW)).toBe(
      true,
    );
    expect(
      leadNeedsAttention(
        lead({ nextActionDueAt: "2026-08-31T10:00:00.000Z" }),
        NOW,
      ),
    ).toBe(true);
    expect(
      leadNeedsAttention(
        lead({ opportunityStage: "won", opportunityOwner: null }),
        NOW,
      ),
    ).toBe(false);
  });

  it("places overdue opportunities ahead of healthy high-value opportunities", () => {
    const healthy = lead({ id: "healthy", opportunityValue: 100_000_000 });
    const overdue = lead({
      id: "overdue",
      nextActionDueAt: "2026-08-31T10:00:00.000Z",
      opportunityValue: 5_000_000,
    });
    expect(
      sortPipelineLeads([healthy, overdue], NOW).map((item) => item.id),
    ).toEqual(["overdue", "healthy"]);
  });

  it("keeps internal evidence out of the operational board and separates completed deals", () => {
    const activeLead = lead({ id: "active", name: "Peluang Operasional" });
    const testLead = lead({
      id: "test",
      name: "Phase 13 Suppression Evidence",
      email: "phase13@example.invalid",
    });
    const wonLead = lead({
      id: "won",
      name: "Klien Berhasil",
      opportunityStage: "won",
    });
    const data = {
      summary: { deliverabilityAlerts: 0 },
      pipelineLeads: [activeLead, testLead, wonLead],
      opportunityActivities: [],
      emailDeliverySummary: {
        total: 0,
        delivered: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
        received: 0,
        processingFailed: 0,
      },
    } as unknown as DashboardData;

    render(
      <PipelinePanel data={data} onAction={vi.fn()} onRefresh={vi.fn()} />,
    );

    expect(screen.getAllByText("Peluang Operasional").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByText("Phase 13 Suppression Evidence"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Klien Berhasil")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Berhasil 1/ }));
    expect(screen.getByText("Klien Berhasil")).toBeVisible();
  });
});

function dashboard(
  leads: PipelineLeadRecord[],
  extras: Partial<DashboardData> = {},
) {
  return {
    summary: { deliverabilityAlerts: 0 },
    pipelineLeads: leads,
    assessments: [],
    opportunityActivities: [],
    ...extras,
  } as DashboardData;
}
function setup(
  leads: PipelineLeadRecord[] = [lead()],
  extras: Partial<DashboardData> = {},
  actions = {
    onAction: vi.fn().mockResolvedValue({ success: true }),
    onRefresh: vi.fn().mockResolvedValue(undefined),
  },
) {
  render(<PipelinePanel data={dashboard(leads, extras)} {...actions} />);
  return actions;
}
function edit() {
  fireEvent.click(
    screen.getAllByRole("button", {
      name: "Buka detail peluang Dewi Pratama",
    })[0],
  );
  fireEvent.click(screen.getByRole("button", { name: "Ubah peluang" }));
}

describe("pipeline workspace interactions", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters priority in one click, then resets the complete filter state", () => {
    setup([
      lead(),
      lead({ id: "no-pic", name: "Butuh PIC", opportunityOwner: null }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: /Belum ada PIC: 1/ }));
    expect(screen.getByText("Butuh PIC")).toBeVisible();
    expect(screen.queryByText("Dewi Pratama")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset filter" }));
    expect(screen.getByText("Dewi Pratama")).toBeVisible();
  });

  it("combines source and owner filters with search and shows a useful empty state", () => {
    setup([
      lead(),
      lead({
        id: "outbound",
        name: "Peluang Outbound",
        source: "outbound",
        opportunityOwner: "sales@binahub.id",
      }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter sumber peluang" }),
      { target: { value: "outbound" } },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter penanggung jawab" }),
      { target: { value: "sales@binahub.id" } },
    );
    expect(screen.getByText("Peluang Outbound")).toBeVisible();
    expect(screen.queryByText("Dewi Pratama")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "tidak-ada" },
    });
    expect(screen.getByText("Tidak ada peluang yang cocok")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Tampilkan semua peluang" }),
    );
    expect(screen.getByText("Dewi Pratama")).toBeVisible();
  });

  it("switches to a list without changing business data", () => {
    const actions = setup();
    fireEvent.click(screen.getByRole("button", { name: "Tampilan daftar" }));
    expect(
      screen.getByRole("table", { name: "Daftar peluang penjualan" }),
    ).toBeInTheDocument();
    expect(actions.onAction).not.toHaveBeenCalled();
  });

  it("does not carry an active-only priority filter into completed opportunities", () => {
    setup([
      lead({ opportunityOwner: null }),
      lead({
        id: "won",
        name: "Selesai",
        opportunityStage: "won",
        nextActionDueAt: "2020-01-01T00:00:00Z",
      }),
    ]);
    fireEvent.click(screen.getByRole("button", { name: /Belum ada PIC: 1/ }));
    fireEvent.click(screen.getByRole("button", { name: /Berhasil 1/ }));
    expect(screen.getByText("Selesai")).toBeVisible();
    expect(screen.queryByText(/Lewat tenggat ·/)).not.toBeInTheDocument();
  });

  it("keeps unknown stages visible for review rather than silently losing them", () => {
    setup([lead({ opportunityStage: "future_stage" })]);
    fireEvent.click(screen.getByRole("button", { name: /Perlu ditinjau 1/ }));
    expect(screen.getByText("Tahap peluang perlu ditinjau")).toBeVisible();
    expect(
      screen.queryByText("Kesepakatan berhasil dicapai"),
    ).not.toBeInTheDocument();
  });

  it("does not report zero as the total when the pipeline failed to load", () => {
    setup([], {
      salesFunnelCoverage: {
        loaded: 0,
        total: null,
        stageDataAvailable: true,
        loadError: true,
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "bukan total penjualan",
    );
    expect(
      screen.getByRole("button", {
        name: /Nilai peluang aktif: belum tersedia/,
      }),
    ).toBeDisabled();
    expect(screen.getByText("Pipeline belum tersedia")).toBeVisible();
  });

  it("warns when metrics reflect only the loaded subset", () => {
    setup([lead()], {
      salesFunnelCoverage: {
        loaded: 1,
        total: 400,
        stageDataAvailable: true,
        loadError: false,
      },
    });
    expect(screen.getByText(/Menampilkan 1 dari 400 peluang/)).toBeVisible();
  });

  it("opens a read-only summary before editing and guards unsaved changes", () => {
    const actions = setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Buka detail peluang Dewi Pratama" }),
    );
    expect(
      screen.queryByRole("button", { name: "Simpan perubahan" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ubah peluang" }));
    fireEvent.change(screen.getByLabelText("Tindakan berikutnya"), {
      target: { value: "Konfirmasi penawaran" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Tutup panel$/ }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Perubahan belum disimpan",
    );
    fireEvent.click(screen.getByRole("button", { name: "Lanjut mengedit" }));
    expect(screen.getByLabelText("Tindakan berikutnya")).toHaveValue(
      "Konfirmasi penawaran",
    );
    expect(actions.onAction).not.toHaveBeenCalled();
  });

  it("validates closing requirements and preserves the existing PATCH contract", async () => {
    const actions = setup();
    edit();
    fireEvent.change(screen.getByRole("combobox", { name: "Tahap peluang" }), {
      target: { value: "lost" },
    });
    expect(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Alasan tidak lanjut"), {
      target: { value: "  Prioritas berubah  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() => expect(actions.onRefresh).toHaveBeenCalledTimes(1));
    const [url, init] = actions.onAction.mock.calls[0];
    expect(url).toBe("/api/admin/pipeline");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toMatchObject({
      leadId: "lead-1",
      stage: "lost",
      owner: "admin@binahub.id",
      lostReason: "Prioritas berubah",
      opportunityValue: 25_000_000,
      outreachPaused: false,
    });
    expect(
      screen.getByText("Perubahan peluang berhasil disimpan."),
    ).toBeVisible();
  });

  it("blocks duplicate saves and closing while a request is in flight", async () => {
    let finish!: (value: unknown) => void;
    const onAction = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    setup(
      [lead()],
      {},
      { onAction, onRefresh: vi.fn().mockResolvedValue(undefined) },
    );
    edit();
    fireEvent.change(screen.getByLabelText("Tindakan berikutnya"), {
      target: { value: "Konfirmasi jadwal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    expect(screen.getByRole("button", { name: "Menyimpan…" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /^Tutup panel$/ }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Menyimpan…" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await act(async () => finish({ success: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("retains the draft on save error, but never retries a successful mutation on refresh error", async () => {
    const onAction = vi
      .fn()
      .mockRejectedValueOnce(new Error("Koneksi terputus"))
      .mockResolvedValue({ success: true });
    const onRefresh = vi.fn().mockRejectedValue(new Error("Refresh gagal"));
    setup([lead()], {}, { onAction, onRefresh });
    edit();
    fireEvent.change(screen.getByLabelText("Tindakan berikutnya"), {
      target: { value: "Hubungi kembali" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Koneksi terputus"),
    );
    expect(screen.getByLabelText("Tindakan berikutnya")).toHaveValue(
      "Hubungi kembali",
    );
    expect(onRefresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Perubahan sudah tersimpan. Tampilan belum diperbarui/),
    ).toBeVisible();
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it("joins assessment details only through lead ID, not a shared email", () => {
    setup([lead()], {
      assessments: [
        {
          id: "not-related",
          leadId: "someone-else",
          email: "dewi@example.com",
          proposalStatus: "Terkirim",
        },
      ] as DashboardData["assessments"],
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Buka detail peluang Dewi Pratama" }),
    );
    expect(
      within(screen.getByRole("dialog")).getByText(
        "0 assessment terhubung · 0 konsultasi terhubung",
      ),
    ).toBeVisible();
  });

  it("expands large columns without losing opportunities", () => {
    setup(
      Array.from({ length: 15 }, (_, index) =>
        lead({ id: `lead-${index}`, name: `Target ${index}` }),
      ),
    );
    expect(screen.queryByText("Target 14")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat 3 peluang lainnya di Terkualifikasi",
      }),
    );
    expect(screen.getByText("Target 14")).toBeVisible();
  });
});

describe("pipeline form and date safeguards", () => {
  it("does not mark completed deals overdue", () => {
    expect(
      isOverdue(
        lead({ opportunityStage: "won", nextActionDueAt: "2020-01-01" }),
        NOW,
      ),
    ).toBe(false);
  });
  it("handles malformed deadlines in sorting and flags missing valid active deadlines", () => {
    const invalid = lead({ id: "invalid", nextActionDueAt: "not-a-date" });
    expect(leadNeedsAttention(invalid, NOW)).toBe(true);
    expect(sortPipelineLeads([lead(), invalid], NOW)[0].id).toBe("invalid");
  });
  it("validates owner email, numeric bounds, stage and reasons before submitting", () => {
    expect(validatePipelineForm(formFromLead(lead()))).toEqual([]);
    expect(
      validatePipelineForm({ ...formFromLead(lead()), owner: "admin" }).join(),
    ).toContain("email penanggung jawab");
    expect(
      validatePipelineForm({
        ...formFromLead(lead()),
        stage: "lost",
        lostReason: "no",
      }).join(),
    ).toContain("minimal 5 karakter");
    expect(
      validatePipelineForm({
        ...formFromLead(lead()),
        opportunityValue: "-1",
      }).join(),
    ).toContain("Nilai peluang");
    expect(
      validatePipelineForm({
        ...formFromLead(lead()),
        stage: "unknown",
      }).join(),
    ).toContain("tahap peluang");
    expect(
      validatePipelineForm({
        ...formFromLead(lead()),
        stage: "identified",
        nextAction: "",
      }).join(),
    ).toContain("tindakan berikutnya");
  });
});
