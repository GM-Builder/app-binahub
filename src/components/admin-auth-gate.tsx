"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AppRole = "admin" | "facilitator" | "client" | "peserta";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

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

        const role = profile?.role || session.user.user_metadata?.role || "admin";

        if (role !== "admin") {
          if (alive) router.replace("/login");
          return;
        }

        if (alive) setAllowed(true);
      } catch {
        if (alive) setAllowed(true);
      }
    }

    void checkAccess();
    return () => { alive = false; };
  }, [router]);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F7FA] text-sm font-semibold text-[#0B2C6B]">
        Memeriksa akses admin...
      </main>
    );
  }

  return <>{children}</>;
}

interface PermissionGateProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, allowedRoles, fallback }: PermissionGateProps) {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    async function checkPermission() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        if (alive) setGranted(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      const userRole = (profile?.role || session.user.user_metadata?.role || "peserta") as AppRole;
      if (alive) setGranted(allowedRoles.includes(userRole));
    }

    void checkPermission();
    return () => { alive = false; };
  }, [allowedRoles]);

  if (granted === null) return null;
  if (!granted) return fallback ?? null;
  return <>{children}</>;
}
