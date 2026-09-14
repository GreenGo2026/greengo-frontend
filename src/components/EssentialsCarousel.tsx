import { useEffect, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { useCartStore, getUnitStep } from "../store/cartStore";
import { useCustomerAuth } from "../hooks/useCustomerAuth";

interface Essential {
  name:            string;
  price_per_unit:  number;
  unit:            string;
  image_url:       string;
  in_stock:        boolean;
  count:           number;
}

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "") +
  "/api/v1/customers/auth";

/** "Mes Essentiels" -- a reorder shortcut for a verified customer, built from
 *  their own order history. Renders nothing for logged-out visitors or a
 *  customer with no history yet. */
export default function EssentialsCarousel() {
  const { token, isLoggedIn } = useCustomerAuth();
  const addToCart = useCartStore((s) => s.addToCart);

  const [items, setItems] = useState<Essential[]>([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    setLoading(true);
    fetch(API + "/me/essentials", { headers: { Authorization: "Bearer " + token } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: Essential[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoggedIn]);

  if (!isLoggedIn || (!loading && items.length === 0)) return null;

  function handleAdd(item: Essential): void {
    const step = getUnitStep(item.unit);
    addToCart({
      name:           item.name,
      price_per_unit: item.price_per_unit,
      unit:           item.unit,
      available:      item.in_stock,
    }, step);
    setAdded((prev) => new Set(prev).add(item.name));
    setTimeout(() => {
      setAdded((prev) => {
        const next = new Set(prev);
        next.delete(item.name);
        return next;
      });
    }, 1500);
  }

  function handleAddAll(): void {
    items.filter((i) => i.in_stock).forEach(handleAdd);
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-gray-800">Mes Essentiels 🛒</h2>
          <p className="mt-0.5 text-xs text-gray-400">Vos produits habituels</p>
        </div>
        <button
          onClick={handleAddAll}
          disabled={loading || items.every((i) => !i.in_stock)}
          className="flex items-center gap-1.5 rounded-xl bg-[#2E8B57] px-3 py-2 text-xs font-extrabold text-white shadow-md shadow-[#2E8B57]/20 transition-all hover:bg-[#1F6B40] active:scale-95 disabled:opacity-40"
        >
          <ShoppingCart size={12} />
          Tout ajouter
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[#2E8B57]" />
        </div>
      ) : (
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {items.map((item) => {
            const isAdded = added.has(item.name);
            return (
              <div key={item.name}
                className="flex w-36 shrink-0 snap-start flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="relative mb-2 flex h-20 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    : <span className="select-none text-3xl">🛒</span>}
                  {!item.in_stock && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <span className="text-[10px] font-bold text-white">Rupture</span>
                    </div>
                  )}
                </div>

                <p dir="rtl" className="mb-1 flex-1 text-right font-arabic text-xs font-bold leading-snug text-gray-800 line-clamp-2">
                  {item.name}
                </p>

                <p className="mb-2 font-latin text-[11px] font-semibold text-gray-400">
                  {item.price_per_unit.toFixed(2)} MAD / {item.unit}
                </p>

                <button
                  onClick={() => handleAdd(item)}
                  disabled={!item.in_stock}
                  className={"flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-extrabold transition-all active:scale-95 " +
                    (isAdded
                      ? "bg-emerald-500 text-white"
                      : item.in_stock
                      ? "bg-[#2E8B57]/10 text-[#2E8B57] hover:bg-[#2E8B57]/20"
                      : "cursor-not-allowed bg-gray-100 text-gray-300")}
                >
                  {isAdded ? "✓ Ajouté" : <><ShoppingCart size={11} /> Ajouter</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
