"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code");
        const next = searchParams.get("next") || "/home";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Callback exchange error:", error);
            if (isMounted) {
              setErrorMsg(error.message);
              setTimeout(() => {
                router.replace("/?error=auth_callback_failed");
              }, 2000);
            }
            return;
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted) {
          if (session) {
            router.replace(next);
          } else {
            router.replace("/home");
          }
        }
      } catch (err) {
        console.error("Unexpected callback error:", err);
        if (isMounted) {
          router.replace("/?error=auth_callback_failed");
        }
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#0B2C6B] border-t-transparent" />
        <h2 className="text-lg font-bold text-[#0B2C6B]">
          {errorMsg ? "Autentikasi Bermasalah" : "Memproses Autentikasi..."}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {errorMsg
            ? `${errorMsg}. Mengalihkan ke halaman awal...`
            : "Mohon tunggu sebentar, kami sedang menyiapkan sesi Anda."}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0B2C6B] border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
