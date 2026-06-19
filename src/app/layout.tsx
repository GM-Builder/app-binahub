import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ApiFetchBridge } from "@/components/api-fetch-bridge";
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

export const metadata: Metadata = {
  title: "BinaHub App",
  description: "Operational platform for BinaHub services",
  openGraph: {
    title: "BinaHub App",
    description: "Operational platform for BinaHub services",
    siteName: "BinaHub",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BinaHub App",
    description: "Operational platform for BinaHub services",
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
        <ApiFetchBridge />
        {children}
      </body>
    </html>
  );
}
