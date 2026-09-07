"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type AdminToastFeedbackProps = {
  error?: string | null;
  notice?: string | null;
  scope: string;
};

export function AdminToastFeedback({ error, notice, scope }: AdminToastFeedbackProps) {
  useEffect(() => {
    if (!error) return;

    toast.error("Tindakan belum berhasil", {
      id: `${scope}:error`,
      description: error,
      duration: 8000,
    });
  }, [error, scope]);

  useEffect(() => {
    if (!notice) return;

    toast.success("Perubahan berhasil", {
      id: `${scope}:notice`,
      description: notice,
      duration: 5000,
    });
  }, [notice, scope]);

  return null;
}
