"use client";

import { useEffect } from "react";

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);

    if ("caches" in window) {
      void caches.keys()
        .then((cacheNames) => Promise.all(
          cacheNames
            .filter((name) => name.startsWith("binahub-"))
            .map((name) => caches.delete(name)),
        ))
        .catch(() => undefined);
    }
  }, []);

  return null;
}
