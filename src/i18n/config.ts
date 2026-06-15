export const locales = ["id", "en"] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "id"
export const localeCookieName = "NEXT_LOCALE"

const localizedAssetPattern = /\.(.*)$/

export function hasLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  const segment = pathname?.split("/")[1]
  return hasLocale(segment) ? segment : defaultLocale
}

export function stripLocaleFromPathname(pathname: string): string {
  const [pathWithoutHash, hash = ""] = pathname.split("#")
  const parts = pathWithoutHash.split("/")
  const maybeLocale = parts[1]

  if (!hasLocale(maybeLocale)) {
    return pathname || "/"
  }

  const stripped = `/${parts.slice(2).join("/")}`.replace(/\/+/g, "/")
  const normalizedPath = stripped === "/" ? "/" : stripped.replace(/\/$/, "")
  return hash ? `${normalizedPath}#${hash}` : normalizedPath
}

export function shouldBypassLocale(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    localizedAssetPattern.test(pathname)
  )
}

export function localizePath(href: string, locale: Locale): string {
  if (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  ) {
    return href
  }

  const [pathname, hash = ""] = href.split("#")

  if (shouldBypassLocale(pathname)) {
    return href
  }

  const cleanPath = stripLocaleFromPathname(pathname || "/")
  const localizedPath = cleanPath === "/" ? `/${locale}` : `/${locale}${cleanPath}`
  return hash ? `${localizedPath}#${hash}` : localizedPath
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  if (shouldBypassLocale(pathname)) {
    return pathname
  }

  const cleanPath = stripLocaleFromPathname(pathname || "/")
  return cleanPath === "/" ? `/${locale}` : `/${locale}${cleanPath}`
}
