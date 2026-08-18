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
      if (!session) {
        if (alive) router.replace("/client/access");
        return;
      }

      try {
        const response = await fetch("/api/auth/role", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json();
        const role = response.ok && result.success ? result.role : null;

        if (role !== "client") {
          if (alive) router.replace(role === "admin" ? "/admin/programs" : role === "facilitator" ? "/facilitator/tbos" : "/client/access");
          return;
        }

        if (alive) setAllowed(true);
      } catch {
        if (alive) router.replace("/");
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
