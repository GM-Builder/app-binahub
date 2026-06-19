import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnosa Performa",
  description:
    "Mulai perjalanan transformasi Anda dengan diagnosa mandiri BinaInsight, pahami diri dan organisasi untuk bertumbuh lebih cerdas dan terarah.",
  alternates: { canonical: "/insight" },
  openGraph: {
    title: "Diagnosa Performa | BinaHub",
    description:
      "Diagnosa mandiri BinaInsight untuk memahami diri dan organisasi sebelum memulai transformasi.",
    url: "/insight",
    locale: "id_ID",
  },
};

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
