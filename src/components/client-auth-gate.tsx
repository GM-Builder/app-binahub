"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchCurrentAuthenticatedRole } from "@/lib/authenticated-role";
import { isRole, roleHome } from "@/lib/roles";

let verifiedClient: { userId: string; expiresAt: number } | null = null;

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

      if (verifiedClient?.userId === session.user.id && verifiedClient.expiresAt > Date.now()) {
        if (alive) setAllowed(true);
        return;
      }

      try {
        const result = await fetchCurrentAuthenticatedRole(supabase.auth);
        const role = result.ok ? result.role : null;

        if (role !== "client") {
          if (alive) router.replace(
            result.status === 401 || result.status === 403
              ? "/?mode=signin&reason=session_expired"
              : isRole(role) ? roleHome[role] : "/client/access",
          );
          return;
        }

        verifiedClient = { userId: result.userId, expiresAt: Date.now() + 5 * 60_000 };
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
