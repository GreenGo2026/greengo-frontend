// Lightweight customer-session hook — no context provider needed at this scale.
// Mirrors the livreur portal's sessionStorage pattern, but localStorage here:
// a customer JWT is meant to survive closing the tab (30-day token), unlike
// the driver portal's deliberately short-lived, tab-scoped session.
import { useState } from "react";

const TOKEN_KEY    = "gg_customer_token";
const CUSTOMER_KEY = "gg_customer_profile";

export interface CustomerProfile {
  phone:         string;
  name:          string;
  last_address:  string;
  total_points:  number;
  total_orders:  number;
  referral_code: string;
  tier?:         "consumer" | "b2b";
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

  const isLoggedIn = Boolean(token && customer);

  return { token, customer, isLoggedIn, login, logout };
}
