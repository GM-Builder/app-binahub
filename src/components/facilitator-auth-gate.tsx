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
      const session = data.session;

      if (!session) {
        if (alive) router.replace("/login");
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        const role = profile?.role || session.user.user_metadata?.role || "facilitator";

        if (role !== "facilitator" && role !== "admin") {
          if (alive) router.replace("/login");
          return;
        }

        if (alive) setAllowed(true);
      } catch {
        if (alive) setAllowed(true); // Allow fallback if session exists
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
        Memeriksa akses fasilitator...
      </main>
    );
  }

  return <>{children}</>;
}
