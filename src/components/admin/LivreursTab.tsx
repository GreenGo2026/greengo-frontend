/**
 * LivreursTab -- admin management of driver portal accounts.
 *
 * Drivers log in at /livreur with a PIN and no username, so the PIN is the
 * whole credential: it is write-only here (never returned by the API), must be
 * 6-12 digits, and the backend rejects a PIN already used by another active
 * driver because PIN-only login cannot disambiguate two drivers sharing one.
 */
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, Plus, RefreshCw, Send, Truck, X } from "lucide-react";
import { adminHeaders } from "../../services/adminJwt";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

/** Same shape as AdminOrders: bearer header plus the cookie session. */
function authFetch(path: string, init?: RequestInit) {
  return fetch(API + path, {
    ...init,
    headers: { ...(init?.headers || {}), ...adminHeaders() },
    credentials: "include",
  });
}

type Driver = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  status: "pending" | "active" | "inactive" | "rejected";
  vehicle_type: string;
  created_at: string | null;
  activated_at: string | null;
};

const PIN_MIN = 6;
const PIN_MAX = 12;

export default function LivreursTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [pin,   setPin]   = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId,   setBusyId]   = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "warn" | "err" } | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  function flash(msg: string, tone: "ok" | "warn" | "err" = "ok") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 6000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/admin/drivers");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDrivers(await res.json());
    } catch {
      setError("Impossible de charger les livreurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function validateDriver(d: Driver) {
    setBusyId(d.id);
    setError("");
    try {
      const res = await authFetch(`/api/v1/admin/drivers/${d.id}/validate`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.detail || "Validation impossible."); return; }
      if (body.whatsapp_sent) {
        flash(`✅ PIN envoyé à ${body.driver_name} — Code : ${body.pin}`, "ok");
      } else {
        flash(`⚠️ WhatsApp non envoyé — PIN manuel pour ${body.driver_name} : ${body.pin}`, "warn");
      }
      await load();
    } catch {
      setError("Validation impossible. Vérifiez votre connexion.");
    } finally {
      setBusyId(null);
    }
  }

  async function resendPin(d: Driver) {
    setResendingId(d.id);
    setError("");
    try {
      const res = await authFetch(`/api/v1/admin/drivers/${d.id}/resend-pin`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.detail || "Renvoi impossible."); return; }
      if (body.whatsapp_sent) {
        flash(`✅ PIN renvoyé à ${body.driver_name} — Code : ${body.pin}`, "ok");
      } else {
        flash(`⚠️ WhatsApp non envoyé — PIN manuel : ${body.pin}`, "warn");
      }
    } catch {
      setError("Renvoi impossible. Vérifiez votre connexion.");
    } finally {
      setResendingId(null);
    }
  }

  async function rejectDriver(d: Driver) {
    if (!window.confirm(`Refuser la demande de ${d.name} ?`)) return;
    setBusyId(d.id);
    setError("");
    try {
      const res = await authFetch(`/api/v1/admin/drivers/${d.id}/reject`, { method: "PATCH" });
      if (!res.ok) { setError("Refus impossible."); return; }
      flash(`Demande de ${d.name} refusée`, "ok");
      await load();
    } catch {
      setError("Refus impossible.");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => { void load(); }, [load]);

  const pinValid   = /^\d+$/.test(pin) && pin.length >= PIN_MIN && pin.length <= PIN_MAX;
  const formValid  = name.trim().length >= 2 && phone.trim().length >= 6 && pinValid;

  async function createDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || creating) return;
    setCreating(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), pin }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Surface the server's message verbatim -- it distinguishes a duplicate
        // phone from a duplicate PIN, which the admin needs to act on.
        setError(body?.detail || "Création impossible.");
        return;
      }
      setName(""); setPhone(""); setPin("");
      await load();
    } catch {
      setError("Création impossible. Vérifiez votre connexion.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(driver: Driver) {
    setBusyId(driver.id);
    setError("");
    try {
      const res = await authFetch(`/api/v1/admin/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !driver.active }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.detail || "Mise à jour impossible.");
        return;
      }
      await load();
    } catch {
      setError("Mise à jour impossible.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingDrivers = drivers.filter(d => d.status === "pending");
  const rosterDrivers  = drivers.filter(d => d.status !== "pending" && d.status !== "rejected");

  return (
    <div className="space-y-5">
      {toast && (
        <div className={
          "flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold " +
          (toast.tone === "ok"   ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
           toast.tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-800" :
                                   "border-red-200 bg-red-50 text-red-700")
        }>
          <span className="break-words">{toast.msg}</span>
        </div>
      )}

      {pendingDrivers.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-4">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-amber-700">
            Demandes en attente ({pendingDrivers.length})
          </p>
          <div className="space-y-2">
            {pendingDrivers.map(d => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800">{d.name}</p>
                  <p className="text-[11px] text-gray-500 font-latin">{d.phone} · {d.vehicle_type}</p>
                  {d.created_at && (
                    <p className="mt-0.5 text-[11px] text-gray-400 font-latin">
                      {new Date(d.created_at).toLocaleDateString("fr-MA")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void validateDriver(d)}
                    disabled={busyId === d.id}
                    className="flex items-center gap-1.5 rounded-xl bg-[#2E8B57] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#1F6B40] disabled:opacity-40"
                  >
                    {busyId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Valider &amp; Activer
                  </button>
                  <button
                    onClick={() => void rejectDriver(d)}
                    disabled={busyId === d.id}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    <X size={13} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck size={16} className="text-[#2E8B57]" />
          <p className="text-sm font-bold text-gray-700">
            {rosterDrivers.length} livreur{rosterDrivers.length === 1 ? "" : "s"}
            <span className="ml-2 text-xs font-semibold text-gray-400">
              {drivers.filter(d => d.active).length} actif{drivers.filter(d => d.active).length === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-xs font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* Create */}
      <form onSubmit={createDriver} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-gray-400">
          Nouveau livreur
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-gray-500">Nom</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Youssef"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2E8B57]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-gray-500">Téléphone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0612345678"
              inputMode="tel"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2E8B57]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold text-gray-500">
              PIN ({PIN_MIN}-{PIN_MAX} chiffres)
            </label>
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              maxLength={PIN_MAX}
              inputMode="numeric"
              autoComplete="off"
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm tracking-widest outline-none focus:border-[#2E8B57]"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">
            Le PIN n'est jamais réaffiché. Notez-le avant de valider.
          </p>
          <button
            type="submit"
            disabled={!formValid || creating}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#2E8B57] px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer
          </button>
        </div>
      </form>

      {/* List */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {rosterDrivers.length === 0 && !loading && (
          <p className="py-12 text-center text-sm text-gray-400">Aucun livreur enregistré.</p>
        )}
        {rosterDrivers.map((d, i) => (
          <div
            key={d.id}
            className={"flex flex-wrap items-center justify-between gap-3 px-4 py-3 " + (i > 0 ? "border-t" : "")}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-800">{d.name}</p>
              <p className="text-[11px] text-gray-400 font-latin">
                {d.phone}{d.vehicle_type ? ` · ${d.vehicle_type}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={
                  "rounded-full px-2.5 py-1 text-[10px] font-extrabold " +
                  (d.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")
                }
              >
                {d.active ? "ACTIF" : "INACTIF"}
              </span>
              {d.active && (
                <button
                  onClick={() => void resendPin(d)}
                  disabled={resendingId === d.id}
                  className="flex items-center gap-1.5 rounded-xl border border-[#2E8B57]/30 bg-[#2E8B57]/8 px-3 py-1.5 text-xs font-bold text-[#2E8B57] transition-all hover:bg-[#2E8B57]/15 disabled:opacity-40"
                >
                  {resendingId === d.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Send size={11} />}
                  Renvoyer PIN
                </button>
              )}
              <button
                onClick={() => void toggleActive(d)}
                disabled={busyId === d.id}
                className={
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 " +
                  (d.active
                    ? "border border-red-200 text-red-600 hover:bg-red-50"
                    : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50")
                }
              >
                {busyId === d.id
                  ? "…"
                  : d.active ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
