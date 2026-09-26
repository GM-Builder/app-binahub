import { NextRequest, NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/safe-navigation";
import { resolvePublicAppOrigin } from "@/lib/public-app-origin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Completes Supabase's PKCE exchange exactly once on the server. Keeping this
 * out of a hydrated client page prevents the browser client's URL detection
 * from racing an explicit exchange and consuming the verifier twice.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const providerError = request.nextUrl.searchParams.get("error");
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));

  if (!code || providerError) {
    return redirectToSignIn(request, "auth_callback_missing_code");
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] PKCE exchange failed:", error.message);
      return redirectToSignIn(request, "auth_callback_failed");
    }

    return NextResponse.redirect(new URL(next, resolvePublicAppOrigin(request.nextUrl.origin)), 303);
  } catch (error) {
    console.error("[auth/callback] Unexpected callback failure:", error);
    return redirectToSignIn(request, "auth_callback_failed");
  }
}

function redirectToSignIn(request: NextRequest, reason: string) {
  const destination = new URL("/", resolvePublicAppOrigin(request.nextUrl.origin));
  destination.searchParams.set("mode", "signin");
  destination.searchParams.set("error", reason);
  return NextResponse.redirect(destination, 303);
}
