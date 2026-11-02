"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  healthWarning,
  parseServiceHealthResponse,
  type ServiceHealth,
} from "@/lib/service-health-contract";
import { ServiceHealthSummary } from "./service-health-summary";

type Event = {
  id: string;
  code: string;
  message: string;
  route: string;
  stack: string;
  release: string;
  trusted: boolean;
  synthetic: boolean;
  status: string;
  occurrence_count: number;
  last_seen_at: string;
};
type Payload = { success: boolean; openCount: number; events: Event[] };
type Action = (url: string, init?: RequestInit) => Promise<unknown>;

export function ObservabilityPanel({
  onAction,
  compact = false,
}: {
  onAction: Action;
  compact?: boolean;
}) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [dismissed, setDismissed] = useState("");
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [healthError, setHealthError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);
  const controllers = useRef(new Set<AbortController>());
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setRefreshing(true);
    setHealth((current) =>
      current?.readiness === "ready" &&
      Date.now() - Date.parse(current.checkedAt) > 120_000
        ? null
        : current,
    );
    const request = async (url: string) => {
      const controller = new AbortController();
      controllers.current.add(controller);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          Promise.resolve().then(() =>
            onAction(url, { signal: controller.signal }),
          ),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              controller.abort();
              reject(new Error("MONITORING_TIMEOUT"));
            }, 8000);
          }),
        ]);
      } finally {
        clearTimeout(timeout);
        controllers.current.delete(controller);
      }
    };
    const results = await Promise.allSettled([
      request("/api/admin/observability"),
      request("/api/admin/service-health"),
    ]);
    if (id !== requestId.current) return;
    if (results?.[0].status === "fulfilled") {
      const result = results[0].value as Payload;
      if (
        result?.success &&
        Array.isArray(result.events) &&
        Number.isSafeInteger(result.openCount) &&
        result.openCount >= 0
      ) {
        setPayload(result);
        setError("");
      } else {
        setPayload(null);
        setError(
          "Monitoring internal belum dapat dimuat. Periksa koneksi atau deployment API.",
        );
      }
    } else {
      setPayload(null);
      setError(
        "Monitoring internal belum dapat dimuat. Periksa koneksi atau deployment API.",
      );
    }
    try {
      if (results?.[1].status !== "fulfilled")
        throw new Error("SERVICE_HEALTH_UNAVAILABLE");
      setHealth(parseServiceHealthResponse(results[1].value));
      setHealthError("");
    } catch {
      setHealth(null);
      setHealthError(
        "Status layanan belum dapat dimuat. Perbarui untuk mencoba kembali.",
      );
    }
    setRefreshing(false);
  }, [onAction]);
  const cancelPending = useCallback(() => {
    requestId.current++;
    for (const controller of controllers.current) controller.abort();
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 60_000);
    const visible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      cancelPending();
    };
  }, [load, cancelPending]);
  const mutate = async (body: unknown, method: "POST" | "PATCH") => {
    setBusy(true);
    setNotice("");
    try {
      const result = (await onAction("/api/admin/observability", {
        method,
        body: JSON.stringify(body),
      })) as { eventId?: string };
      setNotice(
        result.eventId
          ? "Event uji tersimpan di log permanen."
          : "Log ditandai sudah ditinjau. Ini bukan bukti bug sudah diperbaiki.",
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aksi log gagal.");
    } finally {
      setBusy(false);
    }
  };
  const openCount = payload?.openCount || 0;
  const healthAlert = healthError || healthWarning(health);
  const healthSignature =
    health?.readiness === "ready"
      ? JSON.stringify([
          health.worker.state,
          ...health.queues.map((queue) => [
            queue.key,
            queue.overdue,
            queue.stalled,
            queue.review,
          ]),
        ])
      : health?.readiness;
  const signature = [error, healthAlert, healthSignature, openCount].join("|");
  const alert =
    signature !== dismissed
      ? [
          error,
          healthAlert,
          openCount > 0
            ? `${openCount} kelompok error perlu ditinjau admin.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "";
  return (
    <>
      {alert && (
        <aside
          role="alert"
          className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-amber-200 bg-white p-4 text-sm text-slate-800 shadow-xl sm:w-96"
        >
          <p className="font-semibold">Monitoring sistem</p>
          <p className="mt-1">{alert}</p>
          <div className="mt-3 flex gap-4">
            <Link
              href="/admin/operations#runtime-observability"
              className="font-semibold text-blue-900"
            >
              {healthAlert ? "Periksa layanan & log" : "Buka log"}
            </Link>
            <button type="button" onClick={() => setDismissed(signature)}>
              Tutup notifikasi
            </button>
          </div>
        </aside>
      )}
      {!compact && (
        <div id="runtime-observability">
          <ServiceHealthSummary
            health={health}
            error={healthError}
            loading={refreshing}
            onRefresh={() => void load()}
            disabled={busy || refreshing}
          />
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-blue-950">
                  Monitoring &amp; Log Error
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Tersimpan di Supabase. {openCount} kelompok error belum
                  ditinjau. Peringatan dashboard diperbarui setiap 60 detik saat
                  halaman aktif.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || refreshing}
                  onClick={() => void load()}
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
                >
                  {refreshing ? "Memperbarui…" : "Perbarui status & log"}
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    void mutate({ action: "send_test_event" }, "POST")
                  }
                  className="rounded-xl bg-blue-950 px-3 py-2 text-sm text-white"
                >
                  Uji penyimpanan log
                </button>
              </div>
            </div>
            {notice && (
              <p role="status" className="mt-3 text-sm text-emerald-700">
                {notice}
              </p>
            )}
            {!payload && !error && (
              <p className="mt-3 text-sm">Memuat log...</p>
            )}
            {payload?.events.length === 0 && (
              <p className="mt-4 text-sm text-slate-600">
                Belum ada error tercatat.
              </p>
            )}
            <div className="mt-4 space-y-3">
              {payload?.events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="break-all font-semibold text-blue-950">
                      {event.code} {event.synthetic ? "· Uji sintetis" : ""}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {event.occurrence_count}× ·{" "}
                      {event.status === "open" ? "Perlu ditinjau" : "Ditinjau"}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-sm">{event.message}</p>
                  <p className="mt-2 break-all text-xs text-slate-500">
                    {event.trusted
                      ? "API terverifikasi"
                      : "Laporan frontend (belum diverifikasi)"}{" "}
                    · {event.route} ·{" "}
                    {new Date(event.last_seen_at).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}{" "}
                    WIB
                  </p>
                  {event.stack && (
                    <details className="mt-2 text-xs">
                      <summary>Detail teknis</summary>
                      <pre className="mt-2 whitespace-pre-wrap break-all">
                        {event.stack}
                      </pre>
                    </details>
                  )}
                  {event.status === "open" && (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void mutate(
                          {
                            id: event.id,
                            expectedCount: event.occurrence_count,
                          },
                          "PATCH",
                        )
                      }
                      className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold"
                    >
                      Tandai sudah ditinjau
                    </button>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              50 log terbaru. Log yang ditinjau dapat dibersihkan setelah 30
              hari; log terbuka tetap tersimpan. Tidak mengirim email atau
              WhatsApp.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
