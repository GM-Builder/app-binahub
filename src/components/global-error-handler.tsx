"use client";

import { useEffect } from "react";
import { captureMessage } from "@/lib/error-tracking";

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    captureMessage("app_initialized", "info");
  }, []);

  return <>{children}</>;
}
