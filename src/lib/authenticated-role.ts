import type { Role } from "@/lib/roles";
import type { SupabaseClient } from "@supabase/supabase-js";

type RolePayload = {
  success?: boolean;
  role?: unknown;
  fullName?: unknown;
  error?: unknown;
};

export type AuthenticatedRoleResult = {
  ok: boolean;
  status: number;
  role: Role | null;
  fullName: string;
  error: string;
};

export type CurrentAuthenticatedRoleResult = AuthenticatedRoleResult & {
  userId: string;
};

type SupabaseAuthClient = Pick<SupabaseClient["auth"], "getSession" | "refreshSession" | "signOut">;

function isAppRole(value: unknown): value is Role {
  return value === "admin"
    || value === "client"
    || value === "facilitator"
    || value === "peserta";
}

export async function fetchAuthenticatedRole(accessToken: string): Promise<AuthenticatedRoleResult> {
  const token = accessToken.trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      role: null,
      fullName: "",
      error: "Token tidak ditemukan",
    };
  }

  const response = await fetch("/api/auth/role", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as RolePayload | null;
  const roleValue = payload?.role;
  const role = isAppRole(roleValue) ? roleValue : null;

  return {
    ok: response.ok && payload?.success === true && role !== null,
    status: response.status,
    role,
    fullName: typeof payload?.fullName === "string" ? payload.fullName : "",
    error: typeof payload?.error === "string" ? payload.error : "",
  };
}

function signedOutResult(error: string): CurrentAuthenticatedRoleResult {
  return {
    ok: false,
    status: 401,
    role: null,
    fullName: "",
    error,
    userId: "",
  };
}

async function clearLocalSession(auth: SupabaseAuthClient) {
  try {
    await auth.signOut({ scope: "local" });
  } catch {
    // The caller still redirects to sign-in. A storage/network failure must not
    // leave the protected workspace visible.
  }
}

/**
 * Resolve the authoritative role and recover once from a stale access token.
 * If the refreshed token is also rejected, clear only the local browser
 * session so the user can sign in again instead of retrying the same token.
 */
export async function fetchCurrentAuthenticatedRole(
  auth: SupabaseAuthClient,
): Promise<CurrentAuthenticatedRoleResult> {
  const { data: sessionData, error: sessionError } = await auth.getSession();
  let session = sessionData.session;

  if (sessionError || !session) {
    return signedOutResult("Sesi tidak tersedia. Silakan masuk kembali.");
  }

  let result = await fetchAuthenticatedRole(session.access_token);
  if (result.status !== 401 && result.status !== 403) {
    return { ...result, userId: session.user.id };
  }

  const { data: refreshedData, error: refreshError } = await auth.refreshSession();
  session = refreshedData.session;

  if (refreshError || !session) {
    await clearLocalSession(auth);
    return signedOutResult("Sesi telah berakhir. Silakan masuk kembali.");
  }

  result = await fetchAuthenticatedRole(session.access_token);
  if (result.status === 401 || result.status === 403) {
    await clearLocalSession(auth);
    return signedOutResult("Sesi tidak valid. Silakan masuk kembali.");
  }

  return { ...result, userId: session.user.id };
}
