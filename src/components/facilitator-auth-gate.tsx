"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchCurrentAuthenticatedRole } from "@/lib/authenticated-role";

type FacilitatorSession = {
  userId: string;
  role: "facilitator" | "admin";
  fullName: string;
};

const FacilitatorSessionContext = createContext<FacilitatorSession | null>(null);

export function useFacilitatorSession() {
  const session = useContext(FacilitatorSessionContext);
  if (!session) throw new Error("useFacilitatorSession harus digunakan di dalam FacilitatorAuthGate.");
  return session;
}

export function FacilitatorAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<FacilitatorSession | null>(null);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      try {
        const result = await fetchCurrentAuthenticatedRole(supabase.auth);
        const role = result.ok ? result.role : null;

        if (role !== "facilitator" && role !== "admin") {
          if (alive) router.replace(
            result.status === 401 || result.status === 403
              ? "/?mode=signin&reason=session_expired"
              : "/access-denied",
          );
          return;
        }

        if (alive) {
          setSession({
            userId: result.userId,
            role,
            fullName: result.fullName,
          });
        }
      } catch {
        if (alive) router.replace("/");
      }
    }

    void checkAccess();
    return () => {
      alive = false;
    };
  }, [router]);

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F7FA] px-5 text-[#0B2C6B]">
        <div className="w-full max-w-sm space-y-4" role="status" aria-live="polite">
          <div className="h-10 w-36 animate-pulse rounded-xl bg-[#0B2C6B]/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
          <p className="text-center text-xs font-semibold text-slate-500">Menyiapkan ruang fasilitator…</p>
        </div>
      </main>
    );
  }

  return <FacilitatorSessionContext.Provider value={session}>{children}</FacilitatorSessionContext.Provider>;
}
