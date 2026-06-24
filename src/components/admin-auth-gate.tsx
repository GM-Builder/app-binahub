"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AppRole = "admin" | "facilitator" | "client";

const ROLE_LOGIN_PATHS: Record<AppRole, string> = {
  admin: "/admin/login",
  facilitator: "/facilitator/login",
  client: "/client/access",
};

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;

    async function checkAccess() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        if (alive) router.replace("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/session", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (alive) router.replace("/admin/login");
          return;
        }

        if (alive) setAllowed(true);
      } catch {
        if (alive) router.replace("/admin/login");
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

  return children;
}

interface PermissionGateProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallback?: React.ReactNode;
}

const ROLE_SESSION_ENDPOINTS: Record<AppRole, string> = {
  admin: "/api/admin/session",
  facilitator: "/api/facilitator/session",
  client: "/api/client/session",
};

export function PermissionGate({ children, allowedRoles, fallback }: PermissionGateProps) {
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    async function checkPermission() {
      const promises = allowedRoles.map(async (role) => {
        try {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(ROLE_SESSION_ENDPOINTS[role], { headers });
          return res.ok;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(promises);
      if (alive) setGranted(results.some(Boolean));
    }

    void checkPermission();
    return () => { alive = false; };
  }, [allowedRoles]);

  if (granted === null) return null;
  if (!granted) return fallback ?? null;
  return children;
}
