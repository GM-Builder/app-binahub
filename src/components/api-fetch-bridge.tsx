"use client";

import { useEffect } from "react";
import { publicApiUrl } from "@/lib/public-api";
import { supabase } from "@/lib/supabase";

async function withApiAuth(init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return {
    ...init,
    headers,
    credentials: init?.credentials || "include",
  };
}

export function ApiFetchBridge() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      if (typeof input === "string" && input.startsWith("/api/")) {
        return originalFetch(publicApiUrl(input), await withApiAuth(init));
      }

      if (input instanceof Request && input.url.startsWith(`${window.location.origin}/api/`)) {
        const url = new URL(input.url);
        return originalFetch(
          publicApiUrl(`${url.pathname}${url.search}`),
          await withApiAuth({
            ...init,
            credentials: init?.credentials || input.credentials || "include",
            headers: init?.headers || input.headers,
          }),
        );
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
