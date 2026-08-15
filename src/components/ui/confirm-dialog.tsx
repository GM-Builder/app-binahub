"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => unknown | Promise<unknown>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const busy = loading || internalLoading;
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && !busy) onClose();
  }, [busy, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      window.setTimeout(() => cancelRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setInternalLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // The action owner is responsible for showing its contextual error.
    } finally {
      setInternalLoading(false);
    }
  };

  const confirmColors = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    info: "bg-[#0B2C6B] hover:bg-[#0A255A]",
  };
  const iconStyles = {
    danger: { wrapper: "bg-red-50", icon: "text-red-600", Icon: AlertTriangle },
    warning: { wrapper: "bg-amber-50", icon: "text-amber-600", Icon: AlertCircle },
    info: { wrapper: "bg-blue-50", icon: "text-[#0B2C6B]", Icon: Info },
  };
  const Icon = iconStyles[variant].Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center" onClick={() => { if (!busy) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby={description ? "confirm-dialog-description" : undefined}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-[#0B2C6B]/10 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconStyles[variant].wrapper}`}>
            <Icon size={20} className={iconStyles[variant].icon} aria-hidden="true" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-[#0B2C6B]">{title}</h3>
            {description && <p id="confirm-dialog-description" className="mt-1 text-sm leading-5 text-[#4A4C54]/70">{description}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-11 flex-1 rounded-xl border border-[#0B2C6B]/15 px-4 py-2 text-sm font-semibold text-[#0B2C6B] hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${confirmColors[variant]}`}
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
