// src/services/adminJwt.ts
// Admin session — JWT stored in httpOnly cookie (XSS-resistant).
// A non-sensitive "logged in" flag lives in sessionStorage so JS can
// check auth state without reading the cookie.

const LOGGED_IN_KEY  = "gg_admin_logged_in";
const LEGACY_JWT_KEY = "gg_admin_jwt"; // pre-cookie migration key
const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** Returns legacy sessionStorage JWT for backward compat during cookie migration. */
export function getJwt(): string {
  return sessionStorage.getItem(LEGACY_JWT_KEY) ?? "";
}

/** @deprecated Cookie is set server-side — this is a no-op. */
export function setJwt(_token: string): void {
  // intentionally empty
}

/** Clear session flags, legacy JWT, and ask server to expire the httpOnly cookie. */
export function clearJwt(): void {
  sessionStorage.removeItem(LOGGED_IN_KEY);
  sessionStorage.removeItem(LEGACY_JWT_KEY);
  fetch(`${API_BASE}/api/v1/admin/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}

export function isAdminLoggedIn(): boolean {
  // Accept either the new flag (cookie session) or a legacy JWT still in sessionStorage
  return (
    sessionStorage.getItem(LOGGED_IN_KEY) === "1" ||
    (sessionStorage.getItem(LEGACY_JWT_KEY) ?? "").length > 0
  );
}

/**
 * Sends the legacy Bearer token if present (pre-cookie sessions).
 * New sessions authenticate via httpOnly cookie — browser sends it automatically.
 */
export function adminHeaders(): Record<string, string> {
  const jwt = getJwt();
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

/** POST /api/v1/admin/auth/login — returns {ok, error?} */
export async function loginAdmin(
  password: string,
  totpCode: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/admin/auth/login`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ password, totp_code: totpCode }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({})) as { access_token?: string };
      sessionStorage.setItem(LOGGED_IN_KEY, "1");
      // Store JWT so apiClient can send Bearer token for admin API calls
      if (data.access_token) {
        sessionStorage.setItem(LEGACY_JWT_KEY, data.access_token);
      }
      return { ok: true };
    }
    const err = await res.json().catch(() => ({})) as { detail?: string };
    return { ok: false, error: err.detail ?? "Identifiants invalides." };
  } catch {
    return { ok: false, error: "Serveur inaccessible. Vérifiez votre connexion." };
  }
}
