const API_ORIGIN = process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id";

export function publicApiUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${API_ORIGIN}${normalizedPath}`;
}
