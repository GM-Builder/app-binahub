import type { Metadata, Viewport } from "next";
import { ApiFetchBridge } from "@/components/api-fetch-bridge";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { Toaster } from "sonner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B2C6B",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://app.binahub.id"),
  title: "BinaHub",
  description: "Platform Transformasi BinaHub - Pelacakan Bukti & Kemampuan",
  openGraph: {
    title: "BinaHub",
    description: "Platform Transformasi BinaHub - Pelacakan Bukti & Kemampuan",
    siteName: "BinaHub",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BinaHub",
    description: "Platform Transformasi BinaHub - Pelacakan Bukti & Kemampuan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full scroll-smooth antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col selection:bg-[#0B2C6B] selection:text-white">
        <a
          href="#content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-[#0B2C6B] px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#C79A3C] focus:ring-offset-2"
        >
          Lewati ke konten utama
        </a>
        <GlobalErrorHandler>
          <ApiFetchBridge />
          <Toaster position="top-right" richColors closeButton />
          <div id="content" tabIndex={-1} className="contents">
            {children}
          </div>
        </GlobalErrorHandler>
      </body>
    </html>
  );
}
