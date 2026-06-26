// src/services/adminJwt.ts
// Admin session — JWT stored in httpOnly cookie (XSS-resistant).
// A non-sensitive "logged in" flag lives in sessionStorage so JS can
// check auth state without reading the cookie.

const LOGGED_IN_KEY = "gg_admin_logged_in";
const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** @deprecated JWT no longer stored in sessionStorage — always returns "". */
export function getJwt(): string {
  return "";
}

/** @deprecated Cookie is set server-side — this is a no-op. */
export function setJwt(_token: string): void {
  // intentionally empty
}

/** Clear the sessionStorage flag and ask the server to expire the cookie. */
export function clearJwt(): void {
  sessionStorage.removeItem(LOGGED_IN_KEY);
  // Fire-and-forget: tell server to clear the httpOnly cookie
  fetch(`${API_BASE}/api/v1/admin/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}

export function isAdminLoggedIn(): boolean {
  return sessionStorage.getItem(LOGGED_IN_KEY) === "1";
}

/** No Authorization header needed — browser sends the httpOnly cookie automatically. */
export function adminHeaders(): Record<string, string> {
  return {};
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
      sessionStorage.setItem(LOGGED_IN_KEY, "1");
      return { ok: true };
    }
    const err = await res.json().catch(() => ({})) as { detail?: string };
    return { ok: false, error: err.detail ?? "Identifiants invalides." };
  } catch {
    return { ok: false, error: "Serveur inaccessible. Vérifiez votre connexion." };
  }
}
