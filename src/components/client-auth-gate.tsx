"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function ClientAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.role === "client" || session?.user?.user_metadata?.role === "client") {
        if (alive) setAllowed(true);
        return;
      }

      if (session?.user?.app_metadata?.role === "admin" || session?.user?.user_metadata?.role === "admin") {
        if (alive) setAllowed(true);
        return;
      }

      if (alive) router.replace("/client/access");
    }

    void checkAccess();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]">
        Memeriksa akses...
      </main>
    );
  }

  return children;
}
