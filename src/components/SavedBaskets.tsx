import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCustomerAuth } from "../hooks/useCustomerAuth";
import { useCartStore } from "../store/cartStore";

interface BasketItem {
  name:           string;
  price_per_unit: number;
  unit:           string;
  quantity:       number;
}

interface SavedBasket {
  id:               string;
  name:             string;
  items:            BasketItem[];
  active:           boolean;
  delivery_address: string;
  reminder_day:     string;
  created_at:       string;
}

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "") + "/api/v1/baskets";

const DAYS_FR: Record<string, string> = {
  monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi",
  thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche",
};

export default function SavedBaskets() {
  const { token, isLoggedIn } = useCustomerAuth();
  const addToCart = useCartStore((s) => s.addToCart);
  const cart = useCartStore((s) => s.cart);

  const [baskets, setBaskets] = useState<SavedBasket[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDay, setFormDay] = useState("friday");
  const [toast, setToast] = useState("");

  function showToast(msg: string): void {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function authHeaders(): Record<string, string> {
    return { Authorization: "Bearer " + token, "Content-Type": "application/json" };
  }

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    setLoading(true);
    fetch(API, { headers: { Authorization: "Bearer " + token } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: SavedBasket[]) => setBaskets(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoggedIn]);

  async function saveCartAsBasket(): Promise<void> {
    if (cart.length === 0 || !formName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        reminder_day: formDay,
        items: cart.map((i) => ({
          name: i.name,
          price_per_unit: i.price_per_unit,
          unit: i.unit,
          quantity: i.cartQuantity,
        })),
      };
      const res = await fetch(API, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      const data: SavedBasket = await res.json();
      setBaskets((prev) => [data, ...prev]);
      setShowForm(false);
      setFormName("");
      showToast("✅ Panier sauvegardé — rappel chaque " + DAYS_FR[formDay]);
    } catch {
      showToast("❌ Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(basket: SavedBasket): Promise<void> {
    const res = await fetch(API + "/" + basket.id, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        name: basket.name,
        items: basket.items,
        delivery_address: basket.delivery_address,
        reminder_day: basket.reminder_day,
        active: !basket.active,
      }),
    });
    if (res.ok) {
      setBaskets((prev) => prev.map((b) => (b.id === basket.id ? { ...b, active: !b.active } : b)));
    }
  }

  async function deleteBasket(id: string): Promise<void> {
    await fetch(API + "/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
    setBaskets((prev) => prev.filter((b) => b.id !== id));
    showToast("🗑️ Panier supprimé.");
  }

  function loadBasketToCart(basket: SavedBasket): void {
    basket.items.forEach((item) => {
      addToCart({
        name: item.name,
        price_per_unit: item.price_per_unit,
        unit: item.unit,
        available: true,
      }, item.quantity);
    });
    showToast("✅ " + basket.name + " ajouté au panier !");
  }

  if (!isLoggedIn) return null;

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-700">Mes Paniers Hebdo 📅</h3>
        {cart.length > 0 && (
          <button onClick={() => setShowForm((p) => !p)}
            className="flex items-center gap-1.5 rounded-xl bg-[#2E8B57]/10 px-3 py-1.5 text-xs font-bold text-[#2E8B57] transition-colors hover:bg-[#2E8B57]/20">
            <Plus size={12} /> Sauvegarder ce panier
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border border-[#2E8B57]/20 bg-[#2E8B57]/5 p-4">
          <input value={formName} onChange={(e) => setFormName(e.target.value)}
            placeholder="Nom du panier (ex: Panier Famille vendredi)"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2E8B57]/40" />
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-500">Rappel chaque:</label>
            <select value={formDay} onChange={(e) => setFormDay(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none">
              {Object.entries(DAYS_FR).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-gray-400">
            Vous recevrez un rappel WhatsApp chaque {DAYS_FR[formDay].toLowerCase()}.
          </p>
          <div className="flex gap-2">
            <button onClick={() => void saveCartAsBasket()} disabled={saving || !formName.trim()}
              className="flex-1 rounded-xl bg-[#2E8B57] py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-[#1F6B40] disabled:opacity-40">
              {saving ? <Loader2 size={14} className="mx-auto animate-spin" /> : "Sauvegarder"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-[#2E8B57]" />
        </div>
      )}

      {!loading && baskets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
          <p className="text-sm text-gray-400">Aucun panier sauvegardé.</p>
          <p className="mt-1 text-xs text-gray-300">
            Remplissez votre panier et sauvegardez-le pour commander en 1 tap chaque semaine.
          </p>
        </div>
      )}

      {baskets.map((basket) => (
        <div key={basket.id}
          className={"rounded-2xl border bg-white p-4 shadow-sm transition-all " +
            (basket.active ? "border-gray-100" : "border-dashed border-gray-200 opacity-60")}>
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-sm font-extrabold text-gray-800">{basket.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                {basket.active
                  ? <><Bell size={10} className="text-[#2E8B57]" /> Rappel chaque {DAYS_FR[basket.reminder_day]}</>
                  : <><BellOff size={10} /> Rappels désactivés</>}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => void toggleActive(basket)}
                title={basket.active ? "Désactiver les rappels" : "Activer les rappels"}
                className={"flex h-7 w-7 items-center justify-center rounded-lg border transition-colors " +
                  (basket.active
                    ? "border-[#2E8B57]/20 bg-[#2E8B57]/8 text-[#2E8B57]"
                    : "border-gray-200 bg-gray-50 text-gray-400")}>
                {basket.active ? <Bell size={12} /> : <BellOff size={12} />}
              </button>
              <button onClick={() => void deleteBasket(basket.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 transition-colors hover:bg-red-100">
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <p className="mb-3 text-xs text-gray-500">
            {basket.items.slice(0, 3).map((i) => i.name).join(", ")}
            {basket.items.length > 3 && ` +${basket.items.length - 3} autres`}
          </p>

          <button onClick={() => loadBasketToCart(basket)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E8B57] py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#2E8B57]/15 transition-all hover:bg-[#1F6B40] active:scale-[0.98]">
            <ShoppingCart size={12} />
            Commander maintenant
          </button>
        </div>
      ))}
    </div>
  );
}
