import { useEffect, useRef, useState } from "react";
import { Clock, ShoppingCart, Zap } from "lucide-react";
import { useCartStore, getUnitStep } from "../store/cartStore";

interface FlashDeal {
  id:                 string;
  product_name_ar:    string;
  product_name_fr:    string;
  unit:               string;
  image_url:          string;
  discount_pct:       number;
  original_price_mad: number;
  deal_price_mad:     number;
  expires_at:         string;
  in_stock:           boolean;
}

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "") + "/api/v1/flash-deals";

function useCountdown(expiresAt: string): string {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    function tick(): void {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setDisplay("Expiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${h > 0 ? h + "h " : ""}${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return display;
}

function DealCard({ deal }: { deal: FlashDeal }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const [added, setAdded] = useState(false);
  const countdown = useCountdown(deal.expires_at);
  const expired = countdown === "Expiré";

  function handleAdd(): void {
    if (!deal.in_stock || expired) return;
    addToCart({
      name: deal.product_name_ar,
      price_per_unit: deal.deal_price_mad,
      unit: deal.unit,
      available: true,
    }, getUnitStep(deal.unit));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="relative flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-md">
      <div className="absolute left-2 top-2 z-10 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
        −{deal.discount_pct.toFixed(0)}%
      </div>

      <div className="relative flex h-24 items-center justify-center overflow-hidden bg-orange-50">
        {deal.image_url
          ? <img src={deal.image_url} alt={deal.product_name_fr} className="h-full w-full object-cover" />
          : <span className="select-none text-4xl">⚡</span>}
        {(!deal.in_stock || expired) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-[10px] font-bold text-white">{expired ? "Expiré" : "Rupture"}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p dir="rtl" className="mb-2 flex-1 text-right font-arabic text-xs font-bold leading-snug text-gray-800 line-clamp-2">
          {deal.product_name_ar}
        </p>

        <div className="mb-2">
          <span className="mr-1 font-latin text-[10px] text-gray-400 line-through">
            {deal.original_price_mad.toFixed(2)}
          </span>
          <span className="font-latin text-sm font-extrabold text-orange-500">
            {deal.deal_price_mad.toFixed(2)} MAD
          </span>
          <span className="ml-0.5 text-[10px] text-gray-400">/{deal.unit}</span>
        </div>

        <div className="mb-2 flex items-center gap-1">
          <Clock size={10} className="shrink-0 text-orange-400" />
          <span className="font-latin text-[10px] font-bold tabular-nums text-orange-500">{countdown}</span>
        </div>

        <button onClick={handleAdd} disabled={!deal.in_stock || expired}
          className={"flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-extrabold transition-all active:scale-95 " +
            (added
              ? "bg-emerald-500 text-white"
              : !deal.in_stock || expired
              ? "cursor-not-allowed bg-gray-100 text-gray-300"
              : "bg-orange-500 text-white shadow-sm shadow-orange-500/25 hover:bg-orange-600")}>
          {added ? "✓ Ajouté" : <><ShoppingCart size={11} /> Ajouter</>}
        </button>
      </div>
    </div>
  );
}

export default function FlashDealsSection() {
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function fetchDeals(): void {
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: FlashDeal[]) => {
        setDeals(Array.isArray(data) ? data.filter((d) => new Date(d.expires_at).getTime() > Date.now()) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDeals();
    timerRef.current = setInterval(fetchDeals, 60_000);

    function handleVisibility(): void {
      if (document.visibilityState === "hidden") {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      } else {
        fetchDeals();
        timerRef.current = setInterval(fetchDeals, 60_000);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (!loading && deals.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500">
            <Zap size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-extrabold leading-none text-gray-800">Offres Express ⚡</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-orange-500">Prix cassés — durée limitée</p>
          </div>
        </div>
        <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-500">
          {deals.length} offre{deals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 w-40 shrink-0 animate-pulse snap-start rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {deals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
        </div>
      )}
    </section>
  );
}
