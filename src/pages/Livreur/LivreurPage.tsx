/**
 * LivreurPage -- standalone driver portal at /livreur.
 *
 * PIN-only login (no username field). The JWT lives in sessionStorage rather
 * than localStorage so it dies with the tab: drivers use shared or personal
 * phones, and a token surviving a closed tab is a handover risk.
 *
 * A driver can mark a delivery submitted but never undo it and never complete
 * it -- the backend moves the order to "Pending Confirmation" and only an
 * admin closes it out.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, CheckCircle2, Loader2, LogOut, MapPin, Package, Phone, RefreshCw,
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const TOKEN_KEY   = "greengo_livreur_token";
const EXPIRY_KEY  = "greengo_livreur_expires_at";
const NAME_KEY    = "greengo_livreur_name";

const PIN_MIN = 6;
const PIN_MAX = 12;

type Delivery = {
  order_id: string;
  customer_name: string;
  phone: string;
  address: string;
  gps: { lat: number; lng: number } | null;
  maps_url: string | null;
  total_price: number;
  items_count: number;
  status: string;
  delivery_zone: string;
  created_at: string | null;
};

/** sessionStorage can throw (private mode, blocked site data) -- never let it break login. */
function safeSession() {
  return {
    get(key: string): string | null {
      try { return sessionStorage.getItem(key); } catch { return null; }
    },
    set(key: string, val: string): void {
      try { sessionStorage.setItem(key, val); } catch { /* ignore */ }
    },
    clear(keys: string[]): void {
      try { keys.forEach(k => sessionStorage.removeItem(k)); } catch { /* ignore */ }
    },
  };
}

const store = safeSession();

export default function LivreurPage() {
  const [token,   setToken]   = useState<string | null>(() => store.get(TOKEN_KEY));
  const [name,    setName]    = useState<string>(() => store.get(NAME_KEY) || "");
  const [pin,     setPin]     = useState("");
  const [authing, setAuthing] = useState(false);
  const [authErr, setAuthErr] = useState("");

  // Unauthenticated view: "login" | "register" | "pending". Additive to the
  // existing PIN flow -- a driver with no account registers here and waits for
  // an admin to approve and WhatsApp them a PIN.
  const [view, setView] = useState<"login" | "register" | "pending">("login");
  const [reg, setReg] = useState({ name: "", phone: "", vehicle_type: "moto", cin: "" });
  const [regBusy, setRegBusy] = useState(false);
  const [regErr,  setRegErr]  = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");

  async function submitRegistration(e?: React.FormEvent) {
    e?.preventDefault();
    if (regBusy) return;
    if (reg.name.trim().length < 2 || reg.phone.trim().length < 6 || reg.cin.trim().length < 4) {
      setRegErr("Remplissez tous les champs correctement.");
      return;
    }
    setRegBusy(true);
    setRegErr("");
    try {
      const res = await fetch(API + "/api/v1/livreur/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reg.name.trim(),
          phone: reg.phone.trim(),
          vehicle_type: reg.vehicle_type,
          cin: reg.cin.trim(),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRegErr(body?.detail || "Envoi impossible. Réessayez.");
        return;
      }
      setRegisteredPhone(reg.phone.trim());
      setReg({ name: "", phone: "", vehicle_type: "moto", cin: "" });
      setView("pending");
    } catch {
      setRegErr("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setRegBusy(false);
    }
  }

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [loadErr,    setLoadErr]    = useState("");
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const logoutTimer = useRef<number | null>(null);

  const logout = useCallback((reason?: string) => {
    store.clear([TOKEN_KEY, EXPIRY_KEY, NAME_KEY]);
    setToken(null);
    setDeliveries([]);
    setName("");
    setPin("");
    if (reason) setAuthErr(reason);
    if (logoutTimer.current) {
      window.clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  }, []);

  // Auto-logout exactly when the JWT expires, so the UI never sits on a dead
  // token showing stale deliveries. Re-armed on mount so a reload inside the
  // 4h window keeps the correct remaining time rather than restarting it.
  useEffect(() => {
    if (!token) return;
    const expiresAt = Number(store.get(EXPIRY_KEY) || 0);
    if (!expiresAt) return;
    const msLeft = expiresAt - Date.now();
    if (msLeft <= 0) {
      logout("Session expirée. Reconnectez-vous.");
      return;
    }
    logoutTimer.current = window.setTimeout(
      () => logout("Session expirée. Reconnectez-vous."),
      msLeft,
    );
    return () => {
      if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
    };
  }, [token, logout]);

  const authedFetch = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(API + path, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
    });
    // The server is the authority on session validity -- a deactivated driver
    // is rejected mid-session even though the token hasn't expired.
    if (res.status === 401 || res.status === 403) {
      const body = await res.json().catch(() => ({}));
      logout(body?.detail || "Session terminée.");
      throw new Error("unauthorized");
    }
    return res;
  }, [token, logout]);

  const loadDeliveries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadErr("");
    try {
      const res = await authedFetch("/api/v1/livreur/deliveries");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDeliveries(await res.json());
    } catch (err) {
      if ((err as Error).message !== "unauthorized") {
        setLoadErr("Impossible de charger les livraisons. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, authedFetch]);

  useEffect(() => { void loadDeliveries(); }, [loadDeliveries]);

  const pinValid = /^\d+$/.test(pin) && pin.length >= PIN_MIN && pin.length <= PIN_MAX;

  async function submitPin(e?: React.FormEvent) {
    e?.preventDefault();
    if (!pinValid || authing) return;
    setAuthing(true);
    setAuthErr("");
    try {
      const res = await fetch(API + "/api/v1/livreur/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthErr(body?.detail || "PIN incorrect.");
        setPin("");
        return;
      }
      store.set(TOKEN_KEY, body.access_token);
      store.set(NAME_KEY, body.name || "");
      store.set(EXPIRY_KEY, String(Date.now() + (body.expires_in || 4 * 3600) * 1000));
      setName(body.name || "");
      setToken(body.access_token);
      setPin("");
    } catch {
      setAuthErr("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setAuthing(false);
    }
  }

  async function markDelivered(orderId: string) {
    if (submitting[orderId]) return;
    setSubmitting(s => ({ ...s, [orderId]: true }));
    try {
      const res = await authedFetch(`/api/v1/livreur/orders/${orderId}/deliver`, { method: "PATCH" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoadErr(body?.detail || "Impossible de marquer cette commande.");
        return;
      }
      // Reflect the new status locally instead of refetching -- the driver is
      // often on a weak mobile connection and a full reload can fail.
      setDeliveries(list => list.map(d =>
        d.order_id === orderId ? { ...d, status: "Pending Confirmation" } : d,
      ));
    } catch (err) {
      if ((err as Error).message !== "unauthorized") {
        setLoadErr("Échec de l'envoi. Réessayez.");
      }
    } finally {
      setSubmitting(s => ({ ...s, [orderId]: false }));
    }
  }

  const pending = useMemo(
    () => deliveries.filter(d => d.status !== "Pending Confirmation").length,
    [deliveries],
  );

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!token) {
    // ── Pending view ──
    if (view === "pending") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl">
            <CheckCircle2 size={56} className="mx-auto text-[#2E8B57]" />
            <h2 className="mt-4 text-lg font-extrabold text-gray-900">Demande envoyée ✅</h2>
            <p className="mt-2 text-sm text-gray-600">
              Votre code PIN vous sera envoyé par WhatsApp au<br />
              <strong className="text-gray-900">{registeredPhone}</strong><br />
              après validation par l'administration.
            </p>
            <button
              onClick={() => { setView("login"); setAuthErr(""); }}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#2E8B57] transition-colors"
            >
              <ArrowLeft size={13} /> Retour à la connexion
            </button>
          </div>
        </div>
      );
    }

    // ── Register view ──
    if (view === "register") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 py-10">
          <form onSubmit={submitRegistration} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E8B57]/10">
                <Package size={26} className="text-[#2E8B57]" />
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">Devenir livreur</h1>
              <p className="mt-1 text-xs text-gray-500">Remplissez le formulaire ci-dessous</p>
            </div>

            <div className="space-y-3">
              <input
                value={reg.name}
                onChange={e => { setReg(r => ({ ...r, name: e.target.value })); setRegErr(""); }}
                placeholder="Nom complet"
                className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2E8B57]"
              />
              <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-gray-200 focus-within:border-[#2E8B57]">
                <span className="flex items-center bg-gray-50 px-3 text-sm font-semibold text-gray-500">🇲🇦 +212</span>
                <input
                  value={reg.phone}
                  onChange={e => { setReg(r => ({ ...r, phone: e.target.value.replace(/\D/g, "") })); setRegErr(""); }}
                  inputMode="tel"
                  placeholder="612345678"
                  className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none font-latin"
                />
              </div>
              <select
                value={reg.vehicle_type}
                onChange={e => setReg(r => ({ ...r, vehicle_type: e.target.value }))}
                className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2E8B57]"
              >
                <option value="moto">Moto</option>
                <option value="vélo">Vélo</option>
                <option value="voiture">Voiture</option>
              </select>
              <input
                value={reg.cin}
                onChange={e => { setReg(r => ({ ...r, cin: e.target.value.toUpperCase() })); setRegErr(""); }}
                placeholder="CIN"
                className="w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#2E8B57] font-latin"
              />
            </div>

            {regErr && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle size={14} /> {regErr}
              </p>
            )}

            <button
              type="submit"
              disabled={regBusy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8B57] py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {regBusy ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : "Envoyer ma demande"}
            </button>

            <button
              type="button"
              onClick={() => { setView("login"); setRegErr(""); }}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#2E8B57] transition-colors"
            >
              <ArrowLeft size={13} /> Retour à la connexion
            </button>
          </form>
        </div>
      );
    }

    // ── Login view ──
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4">
        <form onSubmit={submitPin} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E8B57]/10">
              <Package size={26} className="text-[#2E8B57]" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">Espace Livreur</h1>
            <p className="mt-1 text-xs text-gray-500">Entrez votre code PIN</p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            maxLength={PIN_MAX}
            onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setAuthErr(""); }}
            placeholder="••••••"
            aria-label="Code PIN"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.4em] font-bold outline-none transition focus:border-[#2E8B57]"
          />

          {authErr && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertCircle size={14} /> {authErr}
            </p>
          )}

          <button
            type="submit"
            disabled={!pinValid || authing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8B57] py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {authing ? <><Loader2 size={18} className="animate-spin" /> Connexion…</> : "Se connecter"}
          </button>

          <button
            type="button"
            onClick={() => { setView("register"); setAuthErr(""); }}
            className="mt-3 w-full text-center text-xs font-semibold text-gray-400 hover:text-[#2E8B57] transition-colors"
          >
            Première fois ? Inscrivez-vous →
          </button>
        </form>
      </div>
    );
  }

  // ── Delivery list ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="text-sm font-extrabold text-gray-900">{name || "Livreur"}</p>
            <p className="text-[11px] text-gray-500">
              {pending} livraison{pending === 1 ? "" : "s"} à faire
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => void loadDeliveries()}
              disabled={loading}
              aria-label="Rafraîchir"
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-40"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => logout()}
              aria-label="Se déconnecter"
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        {loadErr && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-xs font-semibold text-red-700">{loadErr}</p>
          </div>
        )}

        {loading && deliveries.length === 0 && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#2E8B57]" />
          </div>
        )}

        {!loading && deliveries.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <Package size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-bold text-gray-600">Aucune livraison aujourd'hui</p>
            <p className="mt-1 text-xs text-gray-400">Les commandes assignées apparaîtront ici.</p>
          </div>
        )}

        <div className="space-y-3">
          {deliveries.map(d => {
            const submitted = d.status === "Pending Confirmation";
            const busy      = !!submitting[d.order_id];
            return (
              <article key={d.order_id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-gray-900">{d.customer_name || "Client"}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
                      #{d.order_id.slice(-6)} · {d.items_count} article{d.items_count === 1 ? "" : "s"}
                      {d.delivery_zone ? ` · ${d.delivery_zone}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-extrabold text-[#2E8B57]">{d.total_price.toFixed(2)} MAD</p>
                </div>

                <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-600">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  <span className="break-words">{d.address || "Adresse non renseignée"}</span>
                </p>

                <div className="mt-3 flex gap-2">
                  {d.phone && (
                    <a
                      href={`tel:${d.phone}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Phone size={14} /> Appeler
                    </a>
                  )}
                  {d.maps_url && (
                    <a
                      href={d.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                    >
                      📍 Maps
                    </a>
                  )}
                </div>

                <button
                  onClick={() => void markDelivered(d.order_id)}
                  disabled={submitted || busy}
                  className={
                    "mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition " +
                    (submitted
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-[#2E8B57] text-white hover:bg-[#256e46] disabled:opacity-50")
                  }
                >
                  {busy
                    ? <><Loader2 size={16} className="animate-spin" /> Envoi…</>
                    : submitted
                      ? <><CheckCircle2 size={16} /> En attente de confirmation ✓</>
                      : "Marquer comme livré"}
                </button>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
