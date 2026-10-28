import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnosis Performa",
  description:
    "Mulai perjalanan transformasi Anda dengan diagnosis mandiri BinaInsight, pahami diri dan organisasi untuk bertumbuh lebih cerdas dan terarah.",
  alternates: { canonical: "/insight" },
  openGraph: {
    title: "Diagnosis Performa | BinaHub",
    description:
      "Diagnosis mandiri BinaInsight untuk memahami diri dan organisasi sebelum memulai transformasi.",
    url: "/insight",
    locale: "id_ID",
  },
};

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
