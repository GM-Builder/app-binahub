import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminToastFeedback } from "./admin-toast-feedback";

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
}));

describe("AdminToastFeedback", () => {
  beforeEach(() => {
    toastMocks.error.mockReset();
    toastMocks.success.mockReset();
  });

  it("menampilkan error penting lebih lama dengan id sesuai panel", () => {
    render(<AdminToastFeedback error="Gagal menyimpan policy." scope="assurance" />);

    expect(toastMocks.error).toHaveBeenCalledWith("Tindakan belum berhasil", {
      id: "assurance:error",
      description: "Gagal menyimpan policy.",
      duration: 8000,
    });
    expect(toastMocks.success).not.toHaveBeenCalled();
  });

  it("menampilkan konfirmasi sukses dan tidak merender kotak inline", () => {
    const { container } = render(
      <AdminToastFeedback notice="Rencana berhasil disimpan." scope="release" />,
    );

    expect(toastMocks.success).toHaveBeenCalledWith("Perubahan berhasil", {
      id: "release:notice",
      description: "Rencana berhasil disimpan.",
      duration: 5000,
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("tidak membuat toast jika belum ada feedback", () => {
    render(<AdminToastFeedback scope="readiness" />);

    expect(toastMocks.error).not.toHaveBeenCalled();
    expect(toastMocks.success).not.toHaveBeenCalled();
  });
});
