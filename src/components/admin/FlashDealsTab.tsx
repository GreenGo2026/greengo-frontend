import { useEffect, useState } from "react";
import { Clock, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { adminHeaders } from "../../services/adminJwt";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

function authFetch(path: string, init?: RequestInit) {
  return fetch(API + path, {
    ...init,
    headers: { ...(init?.headers || {}), ...adminHeaders() },
    credentials: "include",
  });
}

interface FlashDeal {
  id: string;
  product_name_ar: string;
  discount_pct: number;
  original_price_mad: number;
  deal_price_mad: number;
  starts_at: string;
  expires_at: string;
  active: boolean;
}

export default function FlashDealsTab() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product_name_ar: "", discount_pct: "20", starts_at: "", expires_at: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg: string): void {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function load(): Promise<void> {
    setLoading(true);
    try {
      const res = await authFetch("/api/v1/admin/flash-deals");
      if (!res.ok) throw new Error();
      setDeals(await res.json());
    } catch {
      setError("Impossible de charger les offres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createDeal(): Promise<void> {
    setSaving(true);
    setError("");
    try {
      const res = await authFetch("/api/v1/admin/flash-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name_ar: form.product_name_ar.trim(),
          discount_pct: parseFloat(form.discount_pct),
          starts_at: new Date(form.starts_at).toISOString(),
          expires_at: new Date(form.expires_at).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.detail || "Erreur."); return; }
      setDeals((prev) => [data, ...prev]);
      setForm({ product_name_ar: "", discount_pct: "20", starts_at: "", expires_at: "" });
      showToast("✅ Flash deal créé !");
    } catch {
      setError("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelDeal(id: string): Promise<void> {
    const res = await authFetch("/api/v1/admin/flash-deals/" + id, { method: "DELETE" });
    if (res.ok) {
      setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, active: false } : d)));
      showToast("✅ Deal annulé — promo produit retirée.");
    }
  }

  const now = Date.now();
  const canSubmit = form.product_name_ar.trim() && form.starts_at && form.expires_at;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-gray-700">
          <Zap size={15} className="text-orange-500" /> Créer une Offre Express
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-gray-500">Nom du produit (name_ar exact)</label>
            <input value={form.product_name_ar}
              onChange={(e) => setForm((f) => ({ ...f, product_name_ar: e.target.value }))}
              dir="rtl" placeholder="طماطم"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-arabic text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Remise (%)</label>
            <input type="number" min="1" max="99" value={form.discount_pct}
              onChange={(e) => setForm((f) => ({ ...f, discount_pct: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div />
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Début</label>
            <input type="datetime-local" value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Fin</label>
            <input type="datetime-local" value={form.expires_at}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400" />
          </div>
        </div>
        <button onClick={() => void createDeal()} disabled={saving || !canSubmit}
          className="mt-4 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-orange-600 disabled:opacity-40">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Créer l'offre
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-orange-500" size={24} /></div>
      ) : deals.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Aucune offre express.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const isActive = deal.active && new Date(deal.starts_at).getTime() <= now && new Date(deal.expires_at).getTime() > now;
            const isExpired = new Date(deal.expires_at).getTime() <= now || !deal.active;
            return (
              <div key={deal.id}
                className={"flex items-center justify-between gap-3 rounded-2xl border p-4 " +
                  (isActive ? "border-orange-200 bg-orange-50/30" : isExpired ? "border-gray-100 bg-gray-50 opacity-60" : "border-blue-100 bg-blue-50/20")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span dir="rtl" className="font-arabic text-sm font-bold text-gray-800">{deal.product_name_ar}</span>
                    <span className={"rounded-full border px-2 py-0.5 text-[10px] font-bold " +
                      (isActive ? "border-orange-200 bg-orange-100 text-orange-600" : isExpired ? "border-gray-200 bg-gray-100 text-gray-400" : "border-blue-200 bg-blue-100 text-blue-600")}>
                      {isActive ? "⚡ Actif" : isExpired ? "Expiré" : "Programmé"}
                    </span>
                    <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      −{deal.discount_pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-latin line-through">{deal.original_price_mad.toFixed(2)}</span>
                    <span className="font-latin font-bold text-orange-500">{deal.deal_price_mad.toFixed(2)} MAD</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {new Date(deal.expires_at).toLocaleString("fr-MA")}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <button onClick={() => void cancelDeal(deal.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100">
                    <Trash2 size={12} /> Annuler
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
