// src/services/adminJwt.ts
// JWT-based admin session — stored in sessionStorage only (cleared on tab close).
// The raw X-Admin-Key never reaches the browser; only short-lived JWTs do.

const JWT_KEY  = "gg_admin_jwt";
const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export function getJwt(): string {
  return sessionStorage.getItem(JWT_KEY) ?? "";
}

export function setJwt(token: string): void {
  sessionStorage.setItem(JWT_KEY, token.trim());
}

export function clearJwt(): void {
  sessionStorage.removeItem(JWT_KEY);
}

export function isAdminLoggedIn(): boolean {
  return getJwt().length > 0;
}

/** Returns the Authorization header object for fetch() / axios calls. */
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
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password, totp_code: totpCode }),
    });
    if (res.ok) {
      const data = await res.json() as { access_token: string };
      setJwt(data.access_token);
      return { ok: true };
    }
    const err = await res.json().catch(() => ({})) as { detail?: string };
    return { ok: false, error: err.detail ?? "Identifiants invalides." };
  } catch {
    return { ok: false, error: "Serveur inaccessible. Vérifiez votre connexion." };
  }
}
