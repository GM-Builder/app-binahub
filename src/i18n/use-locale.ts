"use client"

import { usePathname } from "next/navigation"
import { getLocaleFromPathname } from "./config"

export function useLocale() {
  return getLocaleFromPathname(usePathname())
}
