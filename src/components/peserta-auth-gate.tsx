"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchCurrentAuthenticatedRole } from "@/lib/authenticated-role";

export function PesertaAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      try {
        const result = await fetchCurrentAuthenticatedRole(supabase.auth);
        const role = result.ok ? result.role : null;

        if (role !== "peserta" && role !== "admin") {
          if (alive) router.replace(
            result.status === 401 || result.status === 403
              ? "/?mode=signin&reason=session_expired"
              : "/home",
          );
          return;
        }

        if (alive) setAllowed(true);
      } catch {
        if (alive) router.replace("/");
      }
    }

    void checkAccess();
    return () => { alive = false; };
  }, [router]);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]">
        Memeriksa akses...
      </main>
    );
  }

  return <>{children}</>;
}
