import { createClient } from "@/lib/supabase/client";

/**
 * One browser client for the lifetime of the tab. The SSR-aware client stores
 * the session in cookies so Next.js Proxy can refresh and verify it before a
 * protected route renders.
 */
export const supabase = createClient();
