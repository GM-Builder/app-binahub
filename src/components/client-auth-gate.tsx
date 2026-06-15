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
      const response = await fetch("/api/client/session");
      if (response.ok) {
        if (alive) setAllowed(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        const adminResponse = await fetch("/api/admin/session", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (adminResponse.ok) {
          if (alive) setAllowed(true);
          return;
        }
      }

      if (!response.ok) {
        router.replace("/client/access");
        return;
      }
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
