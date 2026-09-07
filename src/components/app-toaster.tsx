"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  LoaderCircle,
  X,
} from "lucide-react";
import { Toaster } from "sonner";

const iconClassName = "size-[18px] shrink-0 stroke-[2.25]";

export function AppToaster() {
  return (
    <Toaster
      theme="light"
      position="top-center"
      closeButton
      expand
      visibleToasts={3}
      gap={10}
      duration={5000}
      offset={{ top: 18 }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      swipeDirections={["top", "right"]}
      containerAriaLabel="Notifikasi aplikasi"
      icons={{
        success: <CheckCircle2 aria-hidden="true" className={`${iconClassName} text-emerald-600`} />,
        error: <AlertCircle aria-hidden="true" className={`${iconClassName} text-red-600`} />,
        warning: <AlertTriangle aria-hidden="true" className={`${iconClassName} text-amber-600`} />,
        info: <Info aria-hidden="true" className={`${iconClassName} text-blue-700`} />,
        loading: <LoaderCircle aria-hidden="true" className={`${iconClassName} animate-spin text-blue-700`} />,
        close: <X aria-hidden="true" className="size-3.5" />,
      }}
      toastOptions={{
        closeButtonAriaLabel: "Tutup notifikasi",
        classNames: {
          toast: "app-toast",
          content: "app-toast__content",
          title: "app-toast__title",
          description: "app-toast__description",
          icon: "app-toast__icon",
          closeButton: "app-toast__close",
          actionButton: "app-toast__action",
          cancelButton: "app-toast__cancel",
          success: "app-toast--success",
          error: "app-toast--error",
          warning: "app-toast--warning",
          info: "app-toast--info",
          loading: "app-toast--loading",
        },
      }}
    />
  );
}
