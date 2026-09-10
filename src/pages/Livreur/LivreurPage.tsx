/**
 * LivreurPage -- standalone driver portal at /livreur.
 *
 * PIN-only login (no username field). The JWT lives in sessionStorage rather
 * than localStorage so it dies with the tab: drivers use shared or personal
 * phones, and a token surviving a closed tab is a handover risk.
 *
 * Four views: login / register / pending (all unauthenticated), then the
 * authenticated "app" shell -- a mobile-first dark UI with a fixed bottom nav
 * (Commandes / Gains / Profil).
 *
 * A driver can mark a delivery submitted but never undo it and never complete
 * it -- the backend moves the order to "Pending Confirmation" and only an
 * admin closes it out (which also credits the driver's earnings).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, CheckCircle2, Clock, Loader2, LogOut, MapPin,
  Phone, Shield, ShoppingBag, TrendingUp, Truck, User,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const LIVREUR_BASE = "/api/v1/livreur";

const TOKEN_KEY   = "greengo_livreur_token";
const EXPIRY_KEY  = "greengo_livreur_expires_at";
const NAME_KEY    = "greengo_livreur_name";

const PIN_MIN = 6;
const PIN_MAX = 12;

type AppTab   = "orders" | "gains" | "profile";
type OrderTab = "new" | "processing" | "delivered";

/** Backend serves capitalized, space-separated statuses ("Out for Delivery").
 *  Everything in this file works in lowercase snake_case. */
function normStatus(s: string): string {
  return (s || "").toLowerCase().replace(/ +/g, "_");
}

type GPSStatus = "idle" | "requesting" | "granted" | "denied" | "unavailable";

interface GPSBundle {
  gpsStatus: GPSStatus;
  coords: { lat: number; lng: number } | null;
  requestGPS: () => Promise<{ lat: number; lng: number } | null>;
}

/** A driver can only go online (and see the order pool) with a location fix --
 *  dispatch needs it to route by proximity. Called once at the app-shell level. */
function useGPS(): GPSBundle {
  const [gpsStatus, setGPSStatus] = useState<GPSStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestGPS = useCallback(() => {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        setGPSStatus("unavailable");
        resolve(null);
        return;
      }
      setGPSStatus("requesting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          setGPSStatus("granted");
          resolve(c);
        },
        () => { setGPSStatus("denied"); resolve(null); },
        { timeout: 10000, enableHighAccuracy: true },
      );
    });
  }, []);

  return { gpsStatus, coords, requestGPS };
}

interface RiderOrder {
  id:                string;
  customer_name:     string;
  customer_phone:    string;
  address:           string;
  gps_coordinates:   { lat: number; lng: number } | null;
  items:             { name: string; quantity: number; unit: string }[];
  total_price:       number;
  driver_payout_mad: number;
  status:            string;
  ready_at:          string;
  assigned_at:       string;
}

interface EarningsData {
  total_mad: number;
  today_mad: number;
  week_mad:  number;
  chart:  { date: string; amount_mad: number }[];
  recent: { date: string; amount_mad: number; order_id: string }[];
}

interface DriverProfile {
  id:             string;
  name:           string;
  phone:          string;
  vehicle_type:   string;
  cin_masked:     string;
  is_available:   boolean;
  total_earnings: number;
  status:         string;
}

type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>;

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

// ── Status pill ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending:              "En attente",
  assigned:             "Assigné",
  ready:                "Prêt",
  out_for_delivery:     "En livraison",
  pending_confirmation: "Attente confirmation",
  delivered:            "Livré",
  completed:            "Terminé",
};

const STATUS_COLORS: Record<string, string> = {
  pending:              "bg-amber-500/20 text-amber-300 border-amber-500/30",
  assigned:             "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ready:                "bg-purple-500/20 text-purple-300 border-purple-500/30",
  out_for_delivery:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  pending_confirmation: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  delivered:            "bg-slate-500/20 text-slate-300 border-slate-500/30",
  completed:            "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold " +
      (STATUS_COLORS[status] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Bottom nav ───────────────────────────────────────────────────────────────

function BottomNav({ tab, setTab }: { tab: AppTab; setTab: (t: AppTab) => void }) {
  const items: { key: AppTab; label: string; icon: typeof ShoppingBag }[] = [
    { key: "orders",  label: "Commandes", icon: ShoppingBag },
    { key: "gains",   label: "Gains",     icon: TrendingUp  },
    { key: "profile", label: "Profil",    icon: User        },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 border-t border-slate-700 bg-slate-900">
      {items.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => setTab(key)}
          className={"flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors " +
            (tab === key ? "text-emerald-400" : "text-slate-500 hover:text-slate-300")}>
          <Icon size={20} strokeWidth={tab === key ? 2.5 : 1.8} />
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── Orders view ──────────────────────────────────────────────────────────────

function OrdersView({ api, gps }: { api: AuthedFetch; gps: GPSBundle }) {
  const [orderTab, setOrderTab] = useState<OrderTab>("new");
  const [orders,   setOrders]   = useState<RiderOrder[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [claimingId,   setClaimingId]   = useState<string | null>(null);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [busyId,       setBusyId]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path = orderTab === "new"
        ? "/orders/available"
        : `/orders/my?tab=${orderTab === "processing" ? "processing" : "delivered"}`;
      const res = await api(path);
      if (res.ok) {
        const data: RiderOrder[] = await res.json();
        setOrders(data.map(o => ({ ...o, status: normStatus(o.status) })));
      }
    } catch { /* authedFetch handles auth errors; ignore transient network */ }
    finally { setLoading(false); }
  }, [api, orderTab]);

  // Poll while the tab is visible: faster on "new" (waiting for work).
  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState !== "hidden") void load();
    }, orderTab === "new" ? 8000 : 10000);
    return () => clearInterval(interval);
  }, [load, orderTab]);

  async function handleClaim(orderId: string) {
    setClaimingId(orderId);
    try {
      const res = await api(`/orders/${orderId}/claim`, { method: "POST" });
      if (res.ok || res.status === 409) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        if (res.ok) setOrderTab("processing");
      }
    } catch { /* ignore */ }
    finally { setClaimingId(null); }
  }

  async function handlePickingUp(orderId: string) {
    setBusyId(orderId);
    try {
      const res = await api(`/orders/${orderId}/picking-up`, { method: "PATCH" });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "out_for_delivery" } : o));
      }
    } catch { /* ignore */ }
    finally { setBusyId(null); }
  }

  async function handleDeliver(orderId: string) {
    setDeliveringId(orderId);
    try {
      const res = await api(`/orders/${orderId}/deliver`, { method: "PATCH" });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "pending_confirmation" } : o));
      }
    } catch { /* ignore */ }
    finally { setDeliveringId(null); }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-slate-700 bg-slate-900">
        {(["new", "processing", "delivered"] as OrderTab[]).map((t) => (
          <button key={t} onClick={() => setOrderTab(t)}
            className={"flex-1 border-b-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors " +
              (orderTab === t
                ? "border-[#2E8B57] text-[#3CAE6E]"
                : "border-transparent text-slate-500 hover:text-slate-300")}>
            {t === "new" ? "Nouvelles" : t === "processing" ? "En cours" : "Livrées"}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        {orderTab === "new" && (gps.gpsStatus === "denied" || gps.gpsStatus === "unavailable") ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <MapPin size={36} className="text-amber-400" />
            <p className="text-sm font-bold text-amber-300">GPS requis</p>
            <p className="text-xs text-slate-400">
              Activation du GPS obligatoire pour recevoir les commandes de livraison.
            </p>
            <button onClick={() => void gps.requestGPS()}
              className="rounded-xl bg-[#2E8B57] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1F6B40]">
              Autoriser le GPS
            </button>
          </div>
        ) : (
        <>
        {loading && orders.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ShoppingBag size={40} className="text-slate-600" />
            <p className="font-semibold text-slate-400">
              {orderTab === "new" ? "Aucune nouvelle commande"
                : orderTab === "processing" ? "Aucune commande en cours"
                : "Aucune livraison terminée"}
            </p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <span className="font-mono text-xs text-slate-500">#{order.id.slice(-6).toUpperCase()}</span>
              <StatusPill status={order.status} />
            </div>

            <div className="space-y-3 p-4">
              <div>
                <p className="text-base font-bold text-slate-100">{order.customer_name || "Client"}</p>
                <p className="mt-0.5 text-sm text-slate-400">{order.address || "Adresse non renseignée"}</p>
              </div>

              <div className="flex items-center gap-2">
                {order.customer_phone && (
                  <a href={"tel:" + order.customer_phone}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-600">
                    <Phone size={13} /> Appeler
                  </a>
                )}
                <a
                  href={order.gps_coordinates
                    ? `https://www.google.com/maps?q=${order.gps_coordinates.lat},${order.gps_coordinates.lng}`
                    : `https://www.google.com/maps/search/${encodeURIComponent(order.address || "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-600">
                  <MapPin size={13} /> Maps
                </a>
                <div className="ml-auto text-right">
                  <p className="font-latin text-lg font-extrabold text-emerald-400">
                    {order.driver_payout_mad.toFixed(0)} MAD
                  </p>
                  <p className="text-[10px] text-slate-500">commission</p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-700/50 px-3 py-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Articles</p>
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <span dir="rtl" className="flex-1 font-arabic text-sm text-slate-100">{item.name}</span>
                    <span className="ml-2 shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 font-latin text-[10px] font-bold text-emerald-300">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-slate-500">+{order.items.length - 3} autres</p>
                )}
              </div>

              {order.status === "ready" && (
                <div className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/15 px-3 py-2">
                  <CheckCircle2 size={14} className="shrink-0 text-purple-400" />
                  <span className="text-xs font-bold text-purple-300">Panier prêt — venez chercher</span>
                </div>
              )}

              {orderTab === "new" && (
                <button onClick={() => handleClaim(order.id)} disabled={claimingId === order.id}
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8B57] py-4 text-sm font-extrabold text-white shadow-lg shadow-[#2E8B57]/25 transition-all hover:bg-[#1F6B40] active:scale-[0.98] disabled:opacity-60">
                  {claimingId === order.id
                    ? <><Loader2 size={16} className="animate-spin" /> Prise en charge…</>
                    : <><Truck size={16} /> Accepter la livraison</>}
                </button>
              )}

              {orderTab === "processing" && order.status === "assigned" && (
                <button onClick={() => handlePickingUp(order.id)} disabled={busyId === order.id}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 py-3.5 text-sm font-extrabold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-60">
                  {busyId === order.id
                    ? <><Loader2 size={16} className="animate-spin" /> …</>
                    : <><Truck size={16} /> En cours de livraison</>}
                </button>
              )}

              {orderTab === "processing" && order.status === "out_for_delivery" && (
                <button onClick={() => handleDeliver(order.id)} disabled={deliveringId === order.id}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8B57] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#2E8B57]/25 transition-all hover:bg-[#1F6B40] active:scale-[0.98] disabled:opacity-60">
                  {deliveringId === order.id
                    ? <><Loader2 size={16} className="animate-spin" /> Confirmation…</>
                    : <><CheckCircle2 size={16} /> Marquer comme livré</>}
                </button>
              )}

              {order.status === "pending_confirmation" && (
                <div className="flex items-center gap-2 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
                  <Clock size={14} className="shrink-0 text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-300">En attente de confirmation admin ✓</span>
                </div>
              )}
            </div>
          </div>
        ))}
        </>
        )}
      </div>
    </div>
  );
}

// ── Gains view ───────────────────────────────────────────────────────────────

function GainsView({ api }: { api: AuthedFetch }) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);

  useEffect(() => {
    api("/earnings")
      .then(r => r.ok ? r.json() : null)
      .then((d) => { if (d) setEarnings(d); })
      .catch(() => {});
  }, [api]);

  if (!earnings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4 pb-24">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Aujourd'hui",   value: earnings.today_mad },
          { label: "Cette semaine", value: earnings.week_mad  },
          { label: "Total",         value: earnings.total_mad },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-center">
            <p className="font-latin text-2xl font-extrabold leading-none text-emerald-400">
              {value.toFixed(0)}
              <span className="ml-0.5 text-sm font-semibold text-emerald-600">MAD</span>
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {earnings.chart.length > 0 && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Gains par jour</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={earnings.chart} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(5)}
                tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Bar dataKey="amount_mad" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Activité récente</p>
        </div>
        {earnings.recent.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">Aucune livraison pour l'instant</p>
        ) : (
          <ul>
            {earnings.recent.map((e, i) => (
              <li key={i} className={"flex items-center justify-between px-4 py-3 " +
                (i < earnings.recent.length - 1 ? "border-b border-slate-700/50" : "")}>
                <div>
                  <p className="text-xs font-bold text-slate-300">{e.date}</p>
                  <p className="font-mono text-[10px] text-slate-500">#{e.order_id.slice(-6).toUpperCase()}</p>
                </div>
                <p className="font-latin text-sm font-extrabold text-emerald-400">+{e.amount_mad.toFixed(0)} MAD</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Profile view ─────────────────────────────────────────────────────────────

function ProfileView({ api, gps, onLogout }: { api: AuthedFetch; gps: GPSBundle; onLogout: () => void }) {
  const [profile,     setProfile]     = useState<DriverProfile | null>(null);
  const [toggling,    setToggling]    = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [gpsBlocked,  setGpsBlocked]  = useState(false);

  useEffect(() => {
    api("/profile")
      .then(r => r.ok ? r.json() : null)
      .then((d: DriverProfile | null) => { if (d) { setProfile(d); setIsAvailable(d.is_available); } })
      .catch(() => {});
  }, [api]);

  async function toggleAvailability() {
    if (!profile) return;
    setToggling(true);
    try {
      if (!isAvailable) {
        // Going online -- a location fix is mandatory.
        const c = await gps.requestGPS();
        if (!c) { setGpsBlocked(true); return; }
        setGpsBlocked(false);
        const res = await api("/availability", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_available: true, latitude: c.lat, longitude: c.lng }),
        });
        if (res.ok) setIsAvailable(true);
      } else {
        const res = await api("/availability", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_available: false }),
        });
        if (res.ok) setIsAvailable(false);
      }
    } catch { /* ignore */ }
    finally { setToggling(false); }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4 pb-24">
      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2E8B57] text-xl font-extrabold text-white">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-base font-extrabold text-slate-100">{profile.name}</p>
            <p className="font-latin text-sm text-slate-400">{profile.phone}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <button onClick={toggleAvailability} disabled={toggling || gps.gpsStatus === "requesting"}
              className={"relative h-7 w-12 rounded-full transition-colors " +
                (isAvailable ? "bg-[#2E8B57]" : "bg-slate-600") + (toggling ? " opacity-60" : "")}>
              <span className={"absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform " +
                (isAvailable ? "translate-x-5" : "translate-x-0.5")} />
            </button>
            <p className={"text-[10px] font-bold " + (isAvailable ? "text-emerald-400" : "text-slate-500")}>
              {gps.gpsStatus === "requesting" ? "GPS…" : isAvailable ? "En ligne" : "Hors ligne"}
            </p>
          </div>
        </div>

        {gpsBlocked && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <MapPin size={15} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-xs font-semibold text-amber-300">
              Activation du GPS obligatoire pour recevoir les commandes de livraison.
            </p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
        {[
          { label: "Type de véhicule", value: profile.vehicle_type || "—", icon: Truck },
          { label: "CIN",              value: profile.cin_masked || "—",   icon: Shield },
          { label: "Gains totaux",     value: `${profile.total_earnings.toFixed(0)} MAD`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }, i, arr) => (
          <div key={label}
            className={"flex items-center justify-between px-4 py-3.5 " +
              (i < arr.length - 1 ? "border-b border-slate-700/50" : "")}>
            <div className="flex items-center gap-2.5">
              <Icon size={14} className="shrink-0 text-slate-500" />
              <p className="text-xs font-semibold text-slate-500">{label}</p>
            </div>
            <p className="text-sm font-semibold text-slate-200">{value}</p>
          </div>
        ))}
      </div>

      <button onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-transparent py-3.5 text-sm font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 active:scale-[0.98]">
        <LogOut size={16} /> Se déconnecter
      </button>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function LivreurPage() {
  const [token,   setToken]   = useState<string | null>(() => store.get(TOKEN_KEY));
  const [name,    setName]    = useState<string>(() => store.get(NAME_KEY) || "");
  const [pin,     setPin]     = useState("");
  const [authing, setAuthing] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const [view, setView] = useState<"login" | "register" | "pending">("login");
  const [reg, setReg] = useState({ name: "", phone: "", vehicle_type: "moto", cin: "" });
  const [regBusy, setRegBusy] = useState(false);
  const [regErr,  setRegErr]  = useState("");
  const [registeredPhone, setRegisteredPhone] = useState("");

  const [appTab, setAppTab] = useState<AppTab>("orders");
  const gps = useGPS();

  const logoutTimer = useRef<number | null>(null);

  const logout = useCallback((reason?: string) => {
    store.clear([TOKEN_KEY, EXPIRY_KEY, NAME_KEY]);
    setToken(null);
    setName("");
    setPin("");
    setAppTab("orders");
    if (reason) setAuthErr(reason);
    if (logoutTimer.current) {
      window.clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  }, []);

  // Auto-logout exactly when the JWT expires, so the UI never sits on a dead
  // token. Re-armed on mount so a reload inside the 4h window keeps the
  // correct remaining time rather than restarting it.
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

  const authedFetch = useCallback<AuthedFetch>(async (path, init) => {
    const res = await fetch(API + LIVREUR_BASE + path, {
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
      setAppTab("orders");
    } catch {
      setAuthErr("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setAuthing(false);
    }
  }

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

  // ── Authenticated app shell ───────────────────────────────────────────────
  if (token) {
    return (
      <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/greengo-logo.svg" alt="GreenGo" className="h-5" />
              <span className="text-xs font-semibold text-slate-500">· Livreur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400">{name || "Livreur"}</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {appTab === "orders"  && <OrdersView  api={authedFetch} gps={gps} />}
            {appTab === "gains"   && <GainsView   api={authedFetch} />}
            {appTab === "profile" && <ProfileView api={authedFetch} gps={gps} onLogout={() => logout()} />}
          </div>

          <BottomNav tab={appTab} setTab={setAppTab} />
        </div>
      </div>
    );
  }

  // ── Pending view ──
  if (view === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5">
          <div className="w-full rounded-3xl border border-slate-700 bg-slate-800 p-8 text-center shadow-2xl">
            <CheckCircle2 size={56} className="mx-auto text-emerald-400" />
            <h2 className="mt-4 text-lg font-extrabold text-slate-100">Demande envoyée ✅</h2>
            <p className="mt-2 text-sm text-slate-400">
              Votre code PIN vous sera envoyé par WhatsApp au<br />
              <strong className="text-slate-100">{registeredPhone}</strong><br />
              après validation par l'administration.
            </p>
            <button
              onClick={() => { setView("login"); setAuthErr(""); }}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-emerald-400"
            >
              <ArrowLeft size={13} /> Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Register view ──
  if (view === "register") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10">
          <form onSubmit={submitRegistration} className="w-full rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
            <div className="mb-5 text-center">
              <img src="/greengo-logo.svg" alt="GreenGo" className="mx-auto mb-3 h-8" />
              <h1 className="text-xl font-extrabold text-slate-100">Devenir livreur</h1>
              <p className="mt-1 text-xs text-slate-400">Remplissez le formulaire ci-dessous</p>
            </div>

            <div className="space-y-3">
              <input
                value={reg.name}
                onChange={e => { setReg(r => ({ ...r, name: e.target.value })); setRegErr(""); }}
                placeholder="Nom complet"
                className="w-full rounded-xl border-2 border-slate-600 bg-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500"
              />
              <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-slate-600 bg-slate-700 focus-within:border-emerald-500">
                <span className="flex items-center bg-slate-600/50 px-3 text-sm font-semibold text-slate-300">🇲🇦 +212</span>
                <input
                  value={reg.phone}
                  onChange={e => { setReg(r => ({ ...r, phone: e.target.value.replace(/\D/g, "") })); setRegErr(""); }}
                  inputMode="tel"
                  placeholder="612345678"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-latin text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
              <select
                value={reg.vehicle_type}
                onChange={e => setReg(r => ({ ...r, vehicle_type: e.target.value }))}
                className="w-full rounded-xl border-2 border-slate-600 bg-slate-700 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
              >
                <option value="moto">Moto</option>
                <option value="vélo">Vélo</option>
                <option value="voiture">Voiture</option>
              </select>
              <input
                value={reg.cin}
                onChange={e => { setReg(r => ({ ...r, cin: e.target.value.toUpperCase() })); setRegErr(""); }}
                placeholder="CIN"
                className="w-full rounded-xl border-2 border-slate-600 bg-slate-700 px-3.5 py-2.5 font-latin text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500"
              />
            </div>

            {regErr && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-400">
                <AlertCircle size={14} /> {regErr}
              </p>
            )}

            <button
              type="submit"
              disabled={regBusy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8B57] py-4 text-base font-extrabold text-white shadow-lg shadow-[#2E8B57]/30 transition-all hover:bg-[#1F6B40] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {regBusy ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : "Envoyer ma demande"}
            </button>

            <button
              type="button"
              onClick={() => { setView("login"); setRegErr(""); }}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-emerald-400"
            >
              <ArrowLeft size={13} /> Retour à la connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Login view ──
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5">
        <form onSubmit={submitPin} className="w-full rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <img src="/greengo-logo.svg" alt="GreenGo" className="mx-auto mb-3 h-9" />
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3CAE6E]">Espace Livreur</p>
            <p className="mt-1 text-xs text-slate-400">Entrez votre code PIN</p>
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
            className="w-full rounded-2xl border-2 border-slate-600 bg-slate-700 px-4 py-4 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />

          {authErr && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-400">
              <AlertCircle size={14} /> {authErr}
            </p>
          )}

          <button
            type="submit"
            disabled={!pinValid || authing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2E8B57] py-4 text-base font-extrabold text-white shadow-lg shadow-[#2E8B57]/30 transition-all hover:bg-[#1F6B40] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {authing ? <><Loader2 size={18} className="animate-spin" /> Connexion…</> : "Se connecter"}
          </button>

          <button
            type="button"
            onClick={() => { setView("register"); setAuthErr(""); }}
            className="mt-2 w-full text-center text-sm text-slate-400 transition-colors hover:text-emerald-400"
          >
            Première fois ? Inscrivez-vous →
          </button>
        </form>
      </div>
    </div>
  );
}
