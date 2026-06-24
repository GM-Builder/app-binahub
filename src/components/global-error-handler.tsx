"use client";

import { useEffect } from "react";
import { captureError, captureMessage } from "@/lib/error-tracking";

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureError(event.error || new Error(event.message), "error", {
        filename: event.filename || "",
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      captureError(error, "error", { type: "unhandled_rejection" });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    captureMessage("app_initialized", "info");
  }, []);

  return <>{children}</>;
}
