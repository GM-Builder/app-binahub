import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const API_ORIGIN = (process.env.NEXT_PUBLIC_BINAHUB_API_URL || "https://api.binahub.id").replace(/\/+$/, "");

function signInRedirect(request: NextRequest, response: NextResponse) {
  const url = new URL("/", request.url);
  url.searchParams.set("mode", "signin");
  url.searchParams.set("reason", "session_expired");
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const redirect = NextResponse.redirect(url, 303);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

function accessDeniedRedirect(request: NextRequest, response: NextResponse) {
  const redirect = NextResponse.redirect(new URL("/access-denied", request.url), 303);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return accessDeniedRedirect(request, response);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return signInRedirect(request, response);
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return signInRedirect(request, response);
  }

  try {
    const roleResponse = await fetch(`${API_ORIGIN}/api/auth/role`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const payload = await roleResponse.json().catch(() => null) as { success?: boolean; role?: unknown } | null;

    if (roleResponse.status === 401 || roleResponse.status === 403) {
      return signInRedirect(request, response);
    }
    if (!roleResponse.ok || payload?.success !== true || payload.role !== "admin") {
      return accessDeniedRedirect(request, response);
    }
  } catch {
    // A protected workspace must not render while the authoritative role API
    // is unavailable or returns an unreadable response.
    return accessDeniedRedirect(request, response);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
