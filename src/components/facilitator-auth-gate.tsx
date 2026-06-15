"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function FacilitatorAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.replace("/facilitator/login");
        return;
      }

      const response = await fetch("/api/facilitator/session", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        router.replace("/facilitator/login");
        return;
      }

      if (alive) setAllowed(true);
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

