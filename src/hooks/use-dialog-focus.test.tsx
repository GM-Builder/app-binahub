import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDialogFocus } from "./use-dialog-focus";

function Dialog({
  onClose,
  disabled = false,
}: {
  onClose: () => void;
  disabled?: boolean;
}) {
  const ref = useDialogFocus<HTMLDivElement>(onClose, disabled);
  return (
    <div role="dialog" ref={ref}>
      <button type="button">Tutup</button>
      <button type="button">Riwayat</button>
      <fieldset disabled>
        <input aria-label="Form sedang disimpan" />
      </fieldset>
    </div>
  );
}
afterEach(() => vi.useRealTimers());
describe("dialog focus safety", () => {
  it("excludes inherited fieldset-disabled controls from the focus loop", () => {
    vi.useFakeTimers();
    render(<Dialog onClose={vi.fn()} />);
    vi.runOnlyPendingTimers();
    const first = screen.getByRole("button", { name: "Tutup" });
    const last = screen.getByRole("button", { name: "Riwayat" });
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });
  it("does not close on Escape while closing is disabled", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const view = render(<Dialog onClose={onClose} disabled />);
    vi.runOnlyPendingTimers();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    view.rerender(<Dialog onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    view.unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
