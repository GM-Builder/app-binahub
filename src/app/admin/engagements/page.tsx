"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LegacyAdminEngagementsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/programs");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center gap-3 bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> Membuka daftar program...
    </main>
  );
}
