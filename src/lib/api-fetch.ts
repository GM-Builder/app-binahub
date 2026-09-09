import { publicApiUrl } from "@/lib/public-api";
import { supabase } from "@/lib/supabase";

function resolveApiUrl(input: string | URL) {
  const value = input.toString();
  return value.startsWith("/api/") ? publicApiUrl(value) : value;
}

/**
 * Authenticated browser request to binahub-api.
 *
 * Callers own Content-Type so FormData keeps its generated boundary. The
 * request id is safe to log and lets frontend/API evidence be correlated.
 */
export async function apiFetch(input: string | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (!headers.has("Authorization")) {
    const { data, error } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (error || !token) {
      throw new Error("Sesi tidak tersedia. Silakan login ulang.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("X-Request-ID")) {
    headers.set("X-Request-ID", crypto.randomUUID());
  }

  return fetch(resolveApiUrl(input), {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });
}
