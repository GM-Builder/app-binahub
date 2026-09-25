import { NextRequest, NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/safe-navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket");
  if (!ticket || !/^[A-Za-z0-9_-]{32,128}$/.test(ticket)) return redirectToSignIn(request, "ams_ticket_invalid");

  const apiUrl = (process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id").replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/api/integrations/ams/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticket }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return redirectToSignIn(request, "ams_session_unavailable");
  }
  const login = await response.json().catch(() => null) as { success?: boolean; tokenHash?: string; nextPath?: string } | null;
  if (!response.ok || !login?.success || !login.tokenHash) {
    return redirectToSignIn(request, response.status === 401 ? "ams_ticket_expired" : "ams_session_failed");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: login.tokenHash,
    type: "magiclink",
  });
  if (verifyError) return redirectToSignIn(request, "ams_session_failed");

  const destination = safeInternalPath(login.nextPath || "/fasilitator/tbos", "/fasilitator/tbos");
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin), 303);
}

function redirectToSignIn(request: NextRequest, reason: string) {
  const destination = new URL("/", request.nextUrl.origin);
  destination.searchParams.set("mode", "signin");
  destination.searchParams.set("error", reason);
  return NextResponse.redirect(destination, 303);
}
