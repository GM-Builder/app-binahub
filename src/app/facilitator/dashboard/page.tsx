"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FacilitatorDashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#C79A3C]" />
    </div>
  );
}
