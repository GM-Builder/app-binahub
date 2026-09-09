import type { NextConfig } from "next";

const apiOrigin = (process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id").replace(/\/+$/, "");
const apiConnectOrigin = (() => {
  try {
    return new URL(apiOrigin).origin;
  } catch {
    return "https://api.binahub.id";
  }
})();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value:
      `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ${apiConnectOrigin} https://*.supabase.co wss://*.supabase.co; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`,
  },
];

const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
];

const sessionSensitiveRoutes = [
  "/",
  "/admin/:path*",
  "/auth/:path*",
  "/client/:path*",
  "/facilitator/:path*",
  "/fasilitator/:path*",
  "/forgot-password",
  "/home",
  "/login",
  "/peserta/:path*",
  "/register",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...sessionSensitiveRoutes.map((source) => ({ source, headers: noStoreHeaders })),
    ];
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
