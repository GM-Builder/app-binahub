"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchCurrentAuthenticatedRole } from "@/lib/authenticated-role";
import { isRole, roleHome } from "@/lib/roles";

export default function WorkspaceResolverPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const resolveWorkspace = useCallback(async () => {
    setError("");
    try {
      const result = await fetchCurrentAuthenticatedRole(supabase.auth);
      if (!result.ok && (result.status === 401 || result.status === 403)) {
        router.replace("/?mode=signin&reason=session_expired");
        return;
      }

      const resolvedRole = result.role;
      if (!result.ok || !isRole(resolvedRole)) throw new Error(result.error || "Role akun belum dapat ditentukan.");
      router.replace(roleHome[resolvedRole]);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Workspace belum dapat dibuka.");
    }
  }, [router]);

  useEffect(() => { void Promise.resolve().then(() => resolveWorkspace()); }, [resolveWorkspace]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F6F8] px-5 py-12">
      <section role={error ? "alert" : "status"} aria-live="polite" className="w-full max-w-md border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
        <Image src="/binahub_logo.webp" alt="BinaHub" width={1574} height={448} priority sizes="150px" className="mx-auto h-auto w-[150px] object-contain" />
        {error ? (
          <>
            <AlertCircle className="mx-auto mt-7 h-7 w-7 text-red-600" aria-hidden="true" />
            <h1 className="mt-3 text-lg font-bold text-slate-950">Workspace belum dapat dibuka</h1>
            <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
            <button type="button" onClick={() => void resolveWorkspace()} className="mt-6 min-h-11 rounded-xl bg-[#071B3D] px-5 text-sm font-semibold text-white hover:bg-[#0B2C6B]">Coba lagi</button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-amber-600" aria-hidden="true" />
            <h1 className="mt-4 text-lg font-bold text-slate-950">Menyiapkan workspace Anda</h1>
            <p className="mt-2 text-sm text-slate-500">Anda akan diarahkan ke halaman kerja yang sesuai dengan peran akun.</p>
          </>
        )}
      </section>
    </main>
  );
}
