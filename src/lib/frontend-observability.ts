import { sanitizeTelemetry, type TelemetryPayload } from "./telemetry-privacy";

const recent = new Map<string, number>();
export async function reportFrontendError(input: TelemetryPayload) {
  if (process.env.NODE_ENV === "test") return;
  const payload = sanitizeTelemetry(input);
  const key = JSON.stringify([payload.message, payload.route, payload.code]);
  const now = Date.now();
  if (now - (recent.get(key) || 0) < 60_000) return;
  if (recent.size >= 50) recent.clear();
  recent.set(key, now);
  try {
    const origin = (process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id").replace(/\/+$/, "");
    await fetch(origin + "/api/telemetry/errors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), keepalive: true, credentials: "omit",
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* No retry loop or recursive telemetry on network/sink failure. */ }
}
