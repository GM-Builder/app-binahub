const PRODUCTION_APP_ORIGIN = "https://app.binahub.id";
const LOCAL_HOSTNAMES = new Set(["0.0.0.0", "127.0.0.1", "localhost", "::1", "[::1]"]);

function validOrigin(value: string | null | undefined, production: boolean): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const localHost = LOCAL_HOSTNAMES.has(url.hostname.toLowerCase());
    if (production && (url.protocol !== "https:" || localHost)) return null;
    if (!production && !["http:", "https:"].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function resolvePublicAppOrigin(requestOrigin?: string): string {
  const production = process.env.NODE_ENV === "production";
  return validOrigin(process.env.NEXT_PUBLIC_APP_URL, production)
    || validOrigin(requestOrigin, production)
    || PRODUCTION_APP_ORIGIN;
}
