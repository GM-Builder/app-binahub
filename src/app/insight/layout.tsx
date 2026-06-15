import type { Metadata } from "next";
import { headers } from "next/headers";
import { defaultLocale, hasLocale } from "@/i18n/config";

const METADATA = {
  id: {
    title: "Diagnosa Performa",
    description:
      "Mulai perjalanan transformasi Anda dengan diagnosa mandiri BinaInsight, pahami diri dan organisasi untuk bertumbuh lebih cerdas dan terarah.",
    ogTitle: "Diagnosa Performa | BinaHub",
    ogDescription:
      "Diagnosa mandiri BinaInsight untuk memahami diri dan organisasi sebelum memulai transformasi.",
    canonical: "/insight",
  },
  en: {
    title: "Performance Diagnostic",
    description:
      "Start your transformation journey with the BinaInsight self-diagnostic, understand yourself and your organization to grow more intelligently and intentionally.",
    ogTitle: "Performance Diagnostic | BinaHub",
    ogDescription:
      "BinaInsight self-diagnostic to understand yourself and your organization before starting transformation.",
    canonical: "/en/insight",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const localeHeader = headerList.get("x-binahub-locale");
  const locale = hasLocale(localeHeader) ? localeHeader : defaultLocale;
  const copy = METADATA[locale];

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: copy.canonical },
    openGraph: {
      title: copy.ogTitle,
      description: copy.ogDescription,
      url: copy.canonical,
      locale: locale === "en" ? "en_US" : "id_ID",
    },
  };
}

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
