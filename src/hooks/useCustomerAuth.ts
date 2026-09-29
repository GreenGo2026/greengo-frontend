// Lightweight customer-session hook — no context provider needed at this scale.
// Mirrors the livreur portal's sessionStorage pattern, but localStorage here:
// a customer JWT is meant to survive closing the tab (30-day token), unlike
// the driver portal's deliberately short-lived, tab-scoped session.
import { useEffect, useState } from "react";

const TOKEN_KEY    = "gg_customer_token";
const CUSTOMER_KEY = "gg_customer_profile";
const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "") + "/api/v1";

export interface CustomerProfile {
  phone:         string;
  name:          string;
  last_address:  string;
  total_points:  number;
  total_orders:  number;
  referral_code: string;
  tier?:              "consumer" | "b2b";
  business_name?:     string | null;
  payment_terms?:     "cod" | "net7" | "net30" | null;
  credit_limit_mad?:  number | null;
  outstanding_mad?:   number | null;
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function useCustomerAuth() {
  const [token, setToken] = useState<string | null>(() => safeGet(TOKEN_KEY));
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => {
    try {
      const raw = safeGet(CUSTOMER_KEY);
      return raw ? (JSON.parse(raw) as CustomerProfile) : null;
    } catch {
      return null;
    }
  });

  function login(t: string, c: CustomerProfile): void {
    try {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(c));
    } catch { /* storage blocked -- state still updates for this session */ }
    setToken(t);
    setCustomer(c);
  }

  function logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_KEY);
    } catch { /* ignore */ }
    setToken(null);
    setCustomer(null);
  }

  // The profile cached in localStorage at login can go stale -- a customer
  // promoted to B2B *after* logging in would never see B2B features until
  // they logged out and back in. Refresh from the session's own /me on
  // mount (once, whenever a token exists) so tier/credit reflect the
  // server's current state. Frontend gating from this is UX only -- the
  // backend re-verifies session + tier + credit on every order regardless.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_BASE}/customers/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CustomerProfile | null) => {
        if (cancelled || !data) return;
        setCustomer(data);
        try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      })
      .catch(() => { /* stale cached profile is still usable if /me fails */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isLoggedIn = Boolean(token && customer);
  const isB2B = Boolean(customer?.tier === "b2b");
  const paymentTerms = customer?.payment_terms ?? "cod";
  const creditAvailable = isB2B
    ? Math.max(0, (customer?.credit_limit_mad ?? 0) - (customer?.outstanding_mad ?? 0))
    : 0;

  return { token, customer, isLoggedIn, isB2B, paymentTerms, creditAvailable, login, logout };
}
