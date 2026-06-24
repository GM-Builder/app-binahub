import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ApiFetchBridge } from "@/components/api-fetch-bridge";
import { GlobalErrorHandler } from "@/components/global-error-handler";
import { Toaster } from "sonner";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B2C6B",
};

export const metadata: Metadata = {
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
    <html lang="id" className={`${jakartaSans.variable} ${inter.variable} h-full scroll-smooth antialiased`}>
      <body className="flex min-h-full flex-col selection:bg-[#0B2C6B] selection:text-white">
        <GlobalErrorHandler>
          <ApiFetchBridge />
          <Toaster position="top-right" richColors closeButton />
          {children}
        </GlobalErrorHandler>
      </body>
    </html>
  );
}
