import type { Viewport } from "next";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
  themeColor: "#0B2C6B",
};

export default function TbosFacilitatorLayout({ children }: { children: React.ReactNode }) {
  return <FacilitatorAuthGate>{children}</FacilitatorAuthGate>;
}
