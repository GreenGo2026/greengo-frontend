// src/pages/HomePage.tsx
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  ShoppingCart, Plus, Minus, Loader2, RefreshCw,
  AlertCircle, Search, SlidersHorizontal, Leaf,
  CheckCircle2, Flame, Star,
} from "lucide-react";
import { getProducts } from "../services/api";
import type { DBProduct } from "../services/api";
import { Link, useSearchParams } from "react-router-dom";
import { useCartStore, getUnitStep, formatQuantity } from "../store/cartStore";
import SocialProofStrip from "../components/ui/SocialProofStrip";
import { useLanguage } from "../contexts/LanguageContext";
import { useSeo } from "../hooks/useSeo";
import { getUrgencySignal, getDiscountedPrice } from "../utils/urgencySignals";
import { useDeliveryUrgency } from "../hooks/useDeliveryUrgency";
import { scoreProduct, MIN_RELEVANT_SCORE } from "../utils/normalize";

// ── Niche category definitions ───────────────────────────────────────────────
export interface NicheCategory {
  key:      string;
  emoji:    string;
  label_fr: string;
  label_ar: string;
  label_en: string;
  db_match: string[];
}

// Resolve image URL — prepend API base for relative /static/ paths
const _API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
function resolveImg(url: string | null | undefined): string {
  if (!url || url.trim() === "") return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return _API + url;
  return _API + "/" + url;
}

export const NICHE_CATS: NicheCategory[] = [
  { key: "all",               emoji: "✨", label_fr: "Tous les produits", label_ar: "كل المنتجات",          label_en: "All",              db_match: [] },
  { key: "Fruits",            emoji: "🍎", label_fr: "Fruits",            label_ar: "فواكه",                 label_en: "Fruits",           db_match: ["Fruits", "fruits", "fruit"] },
  { key: "Vegetables",        emoji: "🥕", label_fr: "Légumes",           label_ar: "خضروات",                label_en: "Vegetables",       db_match: ["Vegetables", "vegetables", "Purified Greens", "purified greens"] },
  { key: "White Meats",       emoji: "🍗", label_fr: "Viandes blanches",  label_ar: "لحوم بيضاء",            label_en: "White Meats",      db_match: ["White Meats", "white meats", "Whole Chicken", "Chicken Cuts"] },
  { key: "Volailles",         emoji: "🐓", label_fr: "Volailles",         label_ar: "دواجن",                 label_en: "Poultry",          db_match: ["Volailles", "volailles"] },
  { key: "Viande Rouge",      emoji: "🥩", label_fr: "Viande rouge",      label_ar: "اللحم الأحمر",          label_en: "Red Meat",         db_match: ["Viande Rouge", "viande rouge"] },
  { key: "Eggs",              emoji: "🥚", label_fr: "Œufs",              label_ar: "بيض",                   label_en: "Eggs",             db_match: ["Eggs", "eggs"] },
  { key: "Fromage",           emoji: "🧀", label_fr: "Fromage",           label_ar: "الجبن",                 label_en: "Cheese",           db_match: ["Fromage", "fromage"] },
  { key: "Olives",            emoji: "🫒", label_fr: "Olives",            label_ar: "زيتون",                 label_en: "Olives",           db_match: ["Olives", "olives"] },
  { key: "Huile et miel",     emoji: "🍯", label_fr: "Huile & Miel",      label_ar: "زيت وعسل",              label_en: "Oil & Honey",      db_match: ["Huile et miel", "Huile", "Miel"] },
  { key: "Produits naturels", emoji: "🌾", label_fr: "Produits naturels", label_ar: "منتجات طبيعية",         label_en: "Natural Products", db_match: ["Produits naturels", "produits naturels"] },
  { key: "Epices",            emoji: "🧂", label_fr: "Épices",            label_ar: "توابل",                 label_en: "Spices",           db_match: ["Epices", "Épices", "epices", "spices", "Spices"] },
  { key: "Natural Juices",    emoji: "🧃", label_fr: "Jus naturels",      label_ar: "العصائر الطبيعية",      label_en: "Natural Juices",   db_match: ["Natural Juices", "Juices", "juices"] },
  { key: "Mixed Packs",       emoji: "🛒", label_fr: "Paniers mixtes",    label_ar: "باقات الخضار والفواكه", label_en: "Mixed Packs",      db_match: ["Mixed Packs", "Mixed Fruit & Veggie Packs", "mixed packs"] },
];

// Best-sellers seed — top 10 by order_count from a one-time /orders/top-products
// report (2026-08-01), ranked highest first. Order line items store
// product.name_ar (see cart proxy in ProductCard/QtyControl), not name_fr, so
// matching is done on name_ar. Kept as top 10 (not just top 6) so a
// temporarily out-of-stock bestseller (e.g. "أناناس") is backfilled by the
// next name in rank order — the displayed row below still slices to 6.
export const BESTSELLER_NAMES = [
  "برتقال",
  "جزر",
  "أناناس",
  "بصل أحمر",
  "طماطم",
  "بطاطا",
  "معدنوس",
  "أجنحة الدجاج",
  "بصل أصفر",
  "البطاطا الجديدة",
];

export function catLabel(cat: NicheCategory, lang: string): string {
  if (lang === "ar") return cat.label_ar;
  if (lang === "fr") return cat.label_fr;
  return cat.label_en;
}

// ── Category visual metadata ─────────────────────────────────────────────────
const CAT_META: Record<string, { emoji: string; bg: string; text: string; border: string }> = {
  Fruits:              { emoji: "🍎", bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-100" },
  Vegetables:          { emoji: "🥕", bg: "bg-green-50",   text: "text-green-700",   border: "border-green-100"  },
  "Purified Greens":   { emoji: "🥗", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100"},
  "White Meats":       { emoji: "🍗", bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-100"   },
  "Whole Chicken":     { emoji: "🍗", bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-100"   },
  "Chicken Cuts":      { emoji: "🥩", bg: "bg-red-50",     text: "text-red-600",     border: "border-red-100"    },
  Eggs:                { emoji: "🥚", bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-100" },
  "Natural Juices":    { emoji: "🧃", bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-100"   },
  "Fromage":           { emoji: "🧀", bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-100"  },
  Volailles:           { emoji: "🐓", bg: "bg-orange-50",  text: "text-orange-700", border: "border-orange-100" },
  "Viande Rouge":      { emoji: "🥩", bg: "bg-red-50",     text: "text-red-700",    border: "border-red-100"    },
  "Olives":            { emoji: "🫒", bg: "bg-lime-50",    text: "text-lime-700",   border: "border-lime-100"   },
  "Huile et miel":     { emoji: "🍯", bg: "bg-yellow-50",  text: "text-yellow-700", border: "border-yellow-100" },
  "Produits naturels": { emoji: "🌾", bg: "bg-green-50",   text: "text-green-700",  border: "border-green-100"  },
  "Epices":            { emoji: "🧂", bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-100" },
  "Épices":            { emoji: "🧂", bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-100" },
  "Mixed Packs":       { emoji: "🛒", bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100" },
  Other:               { emoji: "🛒", bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-100"   },
};

function getCatMeta(category: string) {
  return CAT_META[category] ?? CAT_META.Other;
}

// Fresh-produce categories that show the Morocco origin badge
const FRESH_CATS = ["Fruits", "Vegetables", "fruits", "vegetables", "Légumes", "légumes"];

// ── Sort options ──────────────────────────────────────────────────────────────
type SortKey = "default" | "price_asc" | "price_desc" | "name_az";

interface SortOption {
  key:      SortKey;
  label_fr: string;
  label_ar: string;
  label_en: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "default",   label_fr: "Par défaut",      label_ar: "افتراضي",           label_en: "Default"           },
  { key: "price_asc", label_fr: "Prix croissant",  label_ar: "سعر تصاعدي",        label_en: "Price: Low → High" },
  { key: "price_desc",label_fr: "Prix décroissant",label_ar: "سعر تنازلي",        label_en: "Price: High → Low" },
  { key: "name_az",   label_fr: "Nom A → Z",       label_ar: "الاسم أ → ي",       label_en: "Name A → Z"        },
];

function sortLabel(opt: SortOption, lang: string): string {
  if (lang === "ar") return opt.label_ar;
  if (lang === "fr") return opt.label_fr;
  return opt.label_en;
}

// ── QtyControl ────────────────────────────────────────────────────────────────
function QtyControl({ product }: { product: DBProduct }) {
  const cart       = useCartStore((s) => s.cart);
  const add        = useCartStore((s) => s.addToCart);
  const remove     = useCartStore((s) => s.removeFromCart);
  const { language } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";
  const salePrice = (product.on_sale && product.discount_pct)
    ? getDiscountedPrice(product.price_mad, product.discount_pct)
    : product.price_mad;

  const proxy = {
    name:           product.name_ar,
    price_per_unit: salePrice,
    unit:           product.unit,
    available:      product.in_stock,
    step:           (product as any).step,
  };
  const step = getUnitStep(proxy.unit, proxy);
  const item = cart.find((i) => i.name === product.name_ar);
  const qty  = item?.cartQuantity ?? 0;

  if (!product.in_stock) {
    return (
      <div className={"flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400 " + font}>
        {language === "ar" ? "غير متوفر" : language === "fr" ? "Épuisé" : "Out of stock"}
      </div>
    );
  }

  if (qty === 0) {
    return (
      <button
        onClick={() => { add(proxy, step); try { if ((window as any).gtag) { (window as any).gtag("event","add_to_cart",{currency:"MAD",value:salePrice,items:[{item_id:(product as any).sku||product.id,item_name:product.name_fr||product.name_ar,price:salePrice,quantity:step}]}); } } catch {} }}
        aria-label="Ajouter au panier"
        className={"group flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2E8B57] text-xs font-extrabold text-white shadow-md shadow-[#2E8B57]/20 transition-all duration-200 hover:bg-[#1F6B40] hover:shadow-lg hover:shadow-[#2E8B57]/25 active:scale-[0.97] " + font}>
        <ShoppingCart size={14} strokeWidth={2.5} className="transition-transform group-hover:-rotate-6" />
        {language === "ar" ? "أضف للسلة" : language === "fr" ? "Ajouter" : "Add to cart"}
      </button>
    );
  }

  return (
    <div className="flex h-10 items-center overflow-hidden rounded-xl border-2 border-[#2E8B57]/25 bg-[#2E8B57]/6">
      <button
        onClick={() => remove(product.name_ar, step)}
        aria-label="Réduire la quantité"
        className="flex h-full w-10 shrink-0 items-center justify-center text-[#2E8B57] transition-colors hover:bg-[#2E8B57]/12 active:scale-90">
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="flex flex-1 items-center justify-center text-sm font-extrabold text-[#2E8B57] font-latin">
        {formatQuantity(qty, product.unit)}
      </span>
      <button
        onClick={() => add(proxy, step)}
        aria-label="Augmenter la quantité"
        className="flex h-full w-10 shrink-0 items-center justify-center text-[#2E8B57] transition-colors hover:bg-[#2E8B57]/12 active:scale-90">
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ── VariantCardControl ─────────────────────────────────────────────────────────
// Weight-tier products (250g/500g/1kg) don't fit the continuous kg stepper --
// each variant is a discrete pack, so this shows weight tabs + a per-pack
// add/quantity control instead of QtyControl's fractional-kg +/-.
function VariantCardControl({ product }: { product: DBProduct }) {
  const cart   = useCartStore((s) => s.cart);
  const add    = useCartStore((s) => s.addToCart);
  const remove = useCartStore((s) => s.removeFromCart);
  const { language } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";
  const variants = product.variants!;

  const [selected, setSelected] = useState(() => {
    const firstInStock = variants.findIndex((v) => v.in_stock);
    return firstInStock >= 0 ? firstInStock : 0;
  });
  const activeVariant = variants[selected];

  const proxy = {
    name:           product.name_ar,
    price_per_unit: activeVariant.price_mad,
    // Variant is a discrete pack, not a kg/g quantity of the base product --
    // storing "piece" here (not product.unit) keeps downstream step lookups
    // (CartPage/CartDrawer) consistent with the step=1 used below.
    unit:           "piece",
    available:      activeVariant.in_stock,
    variant_label:  activeVariant.label,
  };
  const item = cart.find((i) => i.name === product.name_ar && (i.variant_label ?? null) === activeVariant.label);
  const qty  = item?.cartQuantity ?? 0;

  if (!product.in_stock) {
    return (
      <div className={"flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400 " + font}>
        {language === "ar" ? "غير متوفر" : language === "fr" ? "Épuisé" : "Out of stock"}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1 flex-wrap">
        {variants.map((v, i) => (
          <button
            key={i}
            type="button"
            disabled={!v.in_stock}
            onClick={() => setSelected(i)}
            className={"px-2 py-1 rounded-full text-[10px] font-bold border transition-all " +
              (!v.in_stock
                ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-300"
                : selected === i
                  ? "bg-[#0c3228] text-white border-[#0c3228]"
                  : "border-gray-200 text-gray-600 hover:border-[#0c3228]")}>
            {v.label}
          </button>
        ))}
      </div>

      {qty === 0 ? (
        <button
          onClick={() => { add(proxy, 1); try { if ((window as any).gtag) { (window as any).gtag("event","add_to_cart",{currency:"MAD",value:activeVariant.price_mad,items:[{item_id:(product as any).sku||product.id,item_name:product.name_fr||product.name_ar,price:activeVariant.price_mad,quantity:1}]}); } } catch {} }}
          aria-label="Ajouter au panier"
          className={"group flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#2E8B57] text-xs font-extrabold text-white shadow-md shadow-[#2E8B57]/20 transition-all duration-200 hover:bg-[#1F6B40] hover:shadow-lg hover:shadow-[#2E8B57]/25 active:scale-[0.97] " + font}>
          <ShoppingCart size={13} strokeWidth={2.5} className="transition-transform group-hover:-rotate-6" />
          {activeVariant.price_mad.toFixed(2)} MAD
        </button>
      ) : (
        <div className="flex h-9 items-center overflow-hidden rounded-xl border-2 border-[#2E8B57]/25 bg-[#2E8B57]/6">
          <button
            onClick={() => remove(product.name_ar, 1, activeVariant.label)}
            aria-label="Réduire la quantité"
            className="flex h-full w-9 shrink-0 items-center justify-center text-[#2E8B57] transition-colors hover:bg-[#2E8B57]/12 active:scale-90">
            <Minus size={13} strokeWidth={2.5} />
          </button>
          <span className="flex flex-1 items-center justify-center text-xs font-extrabold text-[#2E8B57] font-latin">
            {qty} × {activeVariant.label}
          </span>
          <button
            onClick={() => add(proxy, 1)}
            aria-label="Augmenter la quantité"
            className="flex h-full w-9 shrink-0 items-center justify-center text-[#2E8B57] transition-colors hover:bg-[#2E8B57]/12 active:scale-90">
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Magnifier hook ───────────────────────────────────────────────────────────
function useMagnifier(zoomFactor: number = 2.8) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const size = { w: 130, h: 130 };
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPos({
      x: Math.max(size.w / 2, Math.min(x, rect.width  - size.w / 2)),
      y: Math.max(size.h / 2, Math.min(y, rect.height - size.h / 2)),
    });
  }, []);
  return { imgRef, active, setActive, pos, size, onMove, zoomFactor };
}

// ── Premium Gallery Modal ─────────────────────────────────────────────────────
function ProductGalleryModal({
  product, onClose, onAddToCart, inCart,
}: {
  product: DBProduct;
  onClose: () => void;
  onAddToCart: () => void;
  inCart: boolean;
}) {
  const { language } = useLanguage();
  const font   = language === "ar" ? "font-arabic" : "font-latin";
  const meta   = getCatMeta(product.category);
  const mg     = useMagnifier(2.8);
  const [zoomed, setZoomed] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!product.image_url && !imgErr;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(8,18,12,0.72)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div
        className={"relative w-full md:max-w-3xl bg-white shadow-2xl overflow-hidden rounded-t-3xl md:rounded-3xl flex flex-col md:flex-row " + font}
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/8 hover:bg-black/15 transition-colors">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 1l11 11M12 1L1 12" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* LEFT panel */}
        <div className={"relative flex flex-col items-center justify-center overflow-hidden md:w-1/2 shrink-0 " + meta.bg}
          style={{ minHeight: "240px" }}>
          {hasImg ? (
            <>
              {/* Desktop magnifier */}
              <div
                className="hidden md:flex relative items-center justify-center w-full select-none"
                style={{ height: "400px", cursor: mg.active ? "none" : "crosshair" }}
                onMouseEnter={() => mg.setActive(true)}
                onMouseLeave={() => mg.setActive(false)}
                onMouseMove={mg.onMove}>
                <img
                  ref={mg.imgRef}
                  src={resolveImg(product.image_url)}
                  alt={product.name_fr || product.name_ar || "product"}
                  width={400}
                  height={400}
                  className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                  style={{ padding: "9%", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.10))" }}
                  onError={() => setImgErr(true)}
                  draggable={false}
                />
                {mg.active && (
                  <div className="absolute rounded-full pointer-events-none z-20"
                    style={{
                      width: mg.size.w, height: mg.size.h,
                      left: mg.pos.x - mg.size.w / 2,
                      top:  mg.pos.y - mg.size.h / 2,
                      border: "2px solid rgba(46,139,87,0.65)",
                      background: "rgba(255,255,255,0.06)",
                    }} />
                )}
                {mg.active && mg.imgRef.current && (() => {
                  const iw = mg.imgRef.current.offsetWidth;
                  const ih = mg.imgRef.current.offsetHeight;
                  const bw = iw * mg.zoomFactor;
                  const bh = ih * mg.zoomFactor;
                  const bx = -(mg.pos.x / iw * bw - 110);
                  const by = -(mg.pos.y / ih * bh - 110);
                  return (
                    <div className="absolute bottom-0 right-0 z-30 rounded-2xl overflow-hidden shadow-2xl border border-[#2E8B57]/20 pointer-events-none bg-white"
                      style={{ width: 220, height: 220 }}>
                      <div style={{
                        width: "100%", height: "100%",
                        backgroundImage: `url(${resolveImg(product.image_url)})`,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: `${bw}px ${bh}px`,
                        backgroundPosition: `${bx}px ${by}px`,
                      }} />
                      <div className="absolute bottom-2 right-2 rounded-full bg-[#2E8B57]/10 px-2 py-0.5 text-[9px] font-bold text-[#2E8B57]">
                        {mg.zoomFactor}x
                      </div>
                    </div>
                  );
                })()}
                {!mg.active && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/18 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm pointer-events-none">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                    </svg>
                    {language === "ar" ? "حرك للتكبير" : language === "fr" ? "Survolez pour zoomer" : "Hover to zoom"}
                  </div>
                )}
              </div>
              {/* Mobile */}
              <div
                className="md:hidden flex items-center justify-center w-full relative"
                style={{ height: "52vw", minHeight: "200px" }}
                onClick={() => setZoomed(true)}>
                <img
                  src={resolveImg(product.image_url)}
                  alt={product.name_fr || product.name_ar || "product"}
                  width={800}
                  height={800}
                  className="h-full w-full object-contain select-none"
                  style={{ padding: "8%", filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.10))" }}
                  onError={() => setImgErr(true)}
                />
                <div className="absolute bottom-2.5 right-3 flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                  {language === "ar" ? "تكبير" : "Agrandir"}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center" style={{ height: "360px" }}>
              <span className="text-[96px] select-none">{meta.emoji}</span>
            </div>
          )}
        </div>

        {/* RIGHT panel */}
        <div className="flex flex-col gap-4 overflow-y-auto p-5 md:p-6 md:w-1/2">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <span className={"rounded-full border px-3 py-1 text-[11px] font-bold " + meta.bg + " " + meta.text + " " + meta.border}>
              {product.category}
            </span>
            {product.in_stock ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-[#2E8B57]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2E8B57] animate-pulse shrink-0" />
                {language === "ar" ? "متوفر" : language === "fr" ? "En stock" : "In stock"}
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-400">
                {language === "ar" ? "نفذ" : language === "fr" ? "Epuise" : "Out of stock"}
              </span>
            )}
          </div>
          <div>
            <h2 dir="rtl" className={"text-xl font-extrabold text-gray-900 leading-tight font-arabic " + (language === "ar" ? "text-right" : "text-left")}>
              {product.name_ar || product.name_fr}
            </h2>
            {product.name_fr && product.name_fr !== product.name_ar && (
              <p className={"text-sm text-gray-400 font-latin mt-1 " + (language === "ar" ? "text-right" : "text-left")}>
                {product.name_fr}
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#f0f7f3] to-[#e8f4ec] border border-[#2E8B57]/12 px-4 py-3.5">
            <p className="text-[10px] text-[#2E8B57]/70 font-latin font-semibold mb-1 uppercase tracking-wide">
              {language === "ar" ? "السعر" : language === "fr" ? "Prix" : "Price"}
            </p>
            {product.on_sale && product.discount_pct ? (
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-3xl font-extrabold text-[#F97316] font-latin leading-none">
                  {getDiscountedPrice(product.price_mad, product.discount_pct).toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-[#2E8B57]/60 font-latin">MAD / {product.unit}</span>
                <span className="text-sm text-gray-400 line-through font-latin">{product.price_mad.toFixed(2)} MAD</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#1A6640] font-latin leading-none">
                  {product.price_mad.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-[#2E8B57]/60 font-latin">MAD / {product.unit}</span>
              </div>
            )}
          </div>
          {product.description_fr && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className={"text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 " + font}>
                {language === "ar" ? "الوصف" : language === "fr" ? "Description" : "Description"}
              </h4>
              <p className={"text-sm text-gray-600 leading-relaxed " + font} dir={language === "ar" ? "rtl" : "ltr"}>
                {product.description_fr}
              </p>
            </div>
          )}

          {/* About this item — Amazon-style structured specs, trilingual */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className={"text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 " + font}>
              {language === "ar" ? "حول هذا المنتج" : language === "fr" ? "À propos de ce produit" : "About this item"}
            </h4>
            <ul className="space-y-2.5">
              {[
                {
                  icon: "🌿",
                  fr: "Fraîcheur garantie", ar: "طازج مضمون", en: "Guaranteed freshness",
                  detail_fr: "Sélectionné et livré le jour même",
                  detail_ar: "يُختار ويُوصَّل في نفس اليوم",
                  detail_en: "Selected and delivered same-day",
                },
                {
                  icon: "🛵",
                  fr: "Livraison en 30 min", ar: "توصيل خلال 30 دقيقة", en: "30-min delivery",
                  detail_fr: "Salé, Rabat et Témara — 7j/7, 8h–21h",
                  detail_ar: "سلا، الرباط وتمارة — 7/7، من 8ص إلى 9م",
                  detail_en: "Salé, Rabat & Témara — 7 days a week, 8am–9pm",
                },
                {
                  icon: "🇲🇦",
                  fr: "Origine Maroc", ar: "من المغرب", en: "From Morocco",
                  detail_fr: "Producteurs locaux sélectionnés",
                  detail_ar: "من منتجين محليين مختارين",
                  detail_en: "Selected local producers",
                },
                {
                  icon: "✅",
                  fr: "Qualité vérifiée", ar: "جودة موثوقة", en: "Verified quality",
                  detail_fr: "Contrôle qualité avant chaque livraison",
                  detail_ar: "فحص الجودة قبل كل توصيل",
                  detail_en: "Quality checked before every delivery",
                },
              ].map((spec) => (
                <li key={spec.en} className="flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">{spec.icon}</span>
                  <div>
                    <p className={"text-sm font-medium text-[#0c3228] " + font}>
                      {language === "ar" ? spec.ar : language === "fr" ? spec.fr : spec.en}
                    </p>
                    <p className={"text-xs text-gray-500 leading-relaxed " + font}>
                      {language === "ar" ? spec.detail_ar : language === "fr" ? spec.detail_fr : spec.detail_en}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <button
            disabled={!product.in_stock}
            onClick={() => { onAddToCart(); onClose(); }}
            className={"mt-auto w-full rounded-2xl py-4 text-sm font-extrabold text-white flex items-center justify-center gap-2.5 transition-all duration-200 " +
              (product.in_stock
                ? "bg-[#2E8B57] hover:bg-[#1A6640] shadow-lg shadow-[#2E8B57]/20 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed") + " " + font}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
            </svg>
            {inCart
              ? (language === "ar" ? "اضافة مرة اخرى" : language === "fr" ? "Ajouter encore" : "Add again")
              : (language === "ar" ? "اضف للسلة" : language === "fr" ? "Ajouter au panier" : "Add to cart")}
          </button>
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.96)", zIndex: 60 }}
          onClick={() => setZoomed(false)}>
          <img
            src={resolveImg(product.image_url)}
            alt={product.name_fr || product.name_ar || "product"}
            width={800}
            height={800}
            className="max-h-[88vh] max-w-[92vw] object-contain select-none"
            style={{ cursor: "zoom-out" }}
          />
          <button
            aria-label="Fermer le zoom"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/22 transition-colors"
            onClick={() => setZoomed(false)}>
            <svg width="15" height="15" viewBox="0 0 13 13" fill="none">
              <path d="M1 1l11 11M12 1L1 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, rank, compact = false }: { product: DBProduct; rank: number; compact?: boolean }) {
  const { language } = useLanguage();
  const font    = language === "ar" ? "font-arabic" : "font-latin";
  const meta    = getCatMeta(product.category);
  const isFresh = FRESH_CATS.some((c) => product.category?.toLowerCase() === c.toLowerCase());
  const name    = product.name_ar || product.name_fr || "";
  const isTop3  = rank < 3;
  const [showModal, setShowModal] = useState(false);
  const [imgError,  setImgError]  = useState(false);
  const add    = useCartStore((s) => s.addToCart);
  const cart   = useCartStore((s) => s.cart);
  const signal = getUrgencySignal(product);
  const deliveryUrgency = useDeliveryUrgency();
  // "Rupture de stock" and "Frais du jour" already have dedicated badges on this
  // card (top-right stock pill, bottom-right Maroc/fresh pill) — only surface the
  // discount and low-stock signals here to avoid showing the same thing twice.
  // Discount gets its own circular badge (below); this pill now only covers
  // the low-stock signal, since discount already takes priority in
  // getUrgencySignal and would otherwise show in both places at once.
  const showUrgencyBadge = product.in_stock && signal.level === "medium" && !compact;
  const hasDiscount = !!(product.on_sale && product.discount_pct);
  const isNewArrival = !!(product.created_at && new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const salePrice = hasDiscount ? getDiscountedPrice(product.price_mad, product.discount_pct!) : product.price_mad;
  const proxy  = { name: product.name_ar, price_per_unit: salePrice, unit: product.unit, available: product.in_stock, step: (product as any).step };
  const step   = getUnitStep(proxy.unit, proxy);
  const inCart = !!cart.find((i) => i.name === product.name_ar);

  return (
    <>
      <article
        className="gg-product-card group relative flex flex-col overflow-hidden"
        style={{ minHeight: "340px" }}>
        {/* Image container — aspect-ratio 4/3, ready for Higgsfield video: swap
            <img> for <video autoPlay loop muted playsInline className="absolute
            inset-0 h-full w-full object-cover"> once a video URL is available,
            no restructuring needed. */}
        <div
          className="relative overflow-hidden cursor-pointer bg-white"
          style={{ aspectRatio: "4 / 3", width: "100%" }}
          onClick={() => product.image_url && !imgError && setShowModal(true)}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/6 via-transparent to-transparent pointer-events-none z-10" />
          {product.image_url && !imgError ? (
            <img
              src={resolveImg(product.image_url)}
              alt={product.name_fr || product.name_ar || "product"}
              width={400}
              height={400}
              loading={rank < 4 ? "eager" : "lazy"}
              fetchPriority={rank < 4 ? "high" : "auto"}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07] select-none pointer-events-none"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-[64px] drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                {meta.emoji}
              </span>
            </div>
          )}
          {product.image_url && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              <div className="rounded-full bg-black/28 px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5 text-white text-[11px] font-bold shadow-lg">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                </svg>
                {language === "ar" ? "عرض سريع" : language === "fr" ? "Aperçu" : "Quick view"}
              </div>
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 z-20 flex flex-col items-start gap-1.5">
            {rank === 0 && (
              <div className="flex items-center gap-1 rounded-full bg-[#FF9800] px-2.5 py-1 shadow-lg shadow-[#FF9800]/30">
                <Star size={9} className="fill-white text-white" />
                <span className="text-[9px] font-extrabold text-white tracking-wide">TOP</span>
              </div>
            )}
            {hasDiscount && (
              <div className="w-11 h-11 rounded-full bg-[#F97316] text-white flex items-center justify-center text-xs font-bold shadow-md leading-tight text-center">
                -{product.discount_pct}%
              </div>
            )}
            {showUrgencyBadge && (
              <div className={`rounded-full px-2.5 py-1 text-[9px] font-bold shadow-sm ${signal.color}`}>
                {signal.badge}
              </div>
            )}
            {isNewArrival && (
              <span className="rounded-full bg-[#0c3228] text-white text-[9px] font-bold px-2.5 py-1 shadow-sm">
                {language === "ar" ? "جديد" : language === "fr" ? "Nouveau" : "New"}
              </span>
            )}
          </div>
          <div className="absolute right-2.5 top-2.5 z-20">
            {product.in_stock ? (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#2E8B57] shadow-sm backdrop-blur-sm border border-[#2E8B57]/12">
                <CheckCircle2 size={9} className="shrink-0" />
                {language === "ar" ? "متوفر" : language === "fr" ? "Dispo" : "In stock"}
              </span>
            ) : (
              <span className="rounded-full bg-gray-900/55 px-2.5 py-1 text-[10px] font-bold text-white/85 backdrop-blur-sm">
                {language === "ar" ? "نفذ" : "Out"}
              </span>
            )}
          </div>
          <div className="absolute bottom-2.5 left-2.5 z-20">
            <span className={"rounded-full border px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm bg-white/75 " + meta.text + " " + meta.border}>
              {product.category}
            </span>
          </div>
          {isFresh && (
            <div className="absolute bottom-2.5 right-2.5 z-20">
              <span className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold text-gray-700 backdrop-blur-sm border border-white/50">
                🇲🇦 <span className="font-latin">Maroc</span>
              </span>
            </div>
          )}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-30">
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                {language === "ar" ? "غير متوفر" : language === "fr" ? "Indisponible" : "Unavailable"}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-3.5">
          <div>
            <Link to={`/produit/${product.id}`} className="group-hover:underline decoration-[#2E8B57]/40">
              <h3 dir="rtl" className={"line-clamp-2 font-extrabold leading-snug text-gray-900 font-arabic hover:text-[#2E8B57] transition-colors " + (compact ? "text-xs " : "text-sm ") + (language === "ar" ? "text-right" : "text-left")}>
                {name}
              </h3>
            </Link>
            {product.name_fr && product.name_fr !== product.name_ar && (
              <p className={"mt-0.5 text-[11px] text-gray-400 font-latin truncate " + (language === "ar" ? "text-right" : "text-left")}>
                {product.name_fr}
              </p>
            )}
            {product.image_url && (
              <div className="flex items-center gap-0.5 mt-1" title={language === "ar" ? "علامة جودة GreenGo — ليست تقييمات عملاء" : language === "fr" ? "Repère qualité GreenGo — pas des avis clients" : "GreenGo quality mark — not a customer review"}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="text-yellow-400 text-xs leading-none">★</span>
                ))}
                <span className="text-[9px] text-gray-400 ml-1 font-latin">
                  {language === "ar" ? "جودة GreenGo" : language === "fr" ? "Qualité GreenGo" : "GreenGo quality"}
                </span>
              </div>
            )}
            {!compact && product.variants && product.variants.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {language === "ar" ? `${product.variants.length} أحجام متوفرة` : language === "fr" ? `${product.variants.length} tailles disponibles` : `${product.variants.length} sizes available`}
              </p>
            )}
          </div>
          <div className={"flex items-end justify-between " + (language === "ar" ? "flex-row-reverse" : "")}>
            <div className={language === "ar" ? "text-right" : "text-left"}>
              {product.variants && product.variants.length > 0 ? (
                <p className="text-[11px] text-gray-400 font-latin">
                  {language === "ar" ? "ابتداءً من " : language === "fr" ? "À partir de " : "From "}
                  <span className="text-sm font-black text-[#1A6640]">
                    {Math.min(...product.variants.map(v => v.price_mad)).toFixed(2)}
                  </span>
                  {" MAD"}
                </p>
              ) : (
                <>
                  {hasDiscount && (
                    <span className="block text-[11px] font-semibold text-gray-400 font-latin line-through leading-none mb-0.5">
                      {product.price_mad.toFixed(2)} MAD
                    </span>
                  )}
                  <div className="flex items-baseline gap-0.5">
                    <span className={"text-[22px] font-black font-latin leading-none tracking-tight " + (hasDiscount ? "text-[#F97316]" : "text-[#1A6640]")}>
                      {salePrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-gray-400 font-latin ml-0.5">MAD</span>
                  </div>
                  <p className={"text-[10px] text-gray-400 font-latin mt-0.5 " + font}>
                    {language === "ar" ? "لكل " : language === "fr" ? "par " : "per "}{product.unit || "kg"}
                  </p>
                </>
              )}
            </div>
            {isFresh && (
              <div className="flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-100 px-2 py-1">
                <Leaf size={9} className="text-[#2E8B57] shrink-0" />
                <span className={"text-[10px] font-bold text-[#2E8B57] " + font}>
                  {language === "ar" ? "طازج" : language === "fr" ? "Frais" : "Fresh"}
                </span>
              </div>
            )}
          </div>
          {!compact && deliveryUrgency.isAvailable && deliveryUrgency.isUrgent && (
            <p className="text-[10px] font-medium text-orange-500 -mt-1">
              ⚡ {deliveryUrgency.message}
            </p>
          )}
          <div className="mt-auto">
            {product.variants && product.variants.length > 0
              ? <VariantCardControl product={product} />
              : <QtyControl product={product} />}
          </div>
        </div>
      </article>
      {showModal && (
        <ProductGalleryModal
          product={product}
          onClose={() => setShowModal(false)}
          onAddToCart={() => add(proxy, step)}
          inCart={inCart}
        />
      )}
    </>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-sm">
      <div className="h-48 gg-skeleton rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded-lg gg-skeleton" />
        <div className="h-3 w-1/2 rounded-lg gg-skeleton" />
        <div className="h-6 w-1/3 rounded-lg gg-skeleton" />
        <div className="h-10 w-full rounded-xl gg-skeleton" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onReset, lang }: { onReset: () => void; lang: string }) {
  const font = lang === "ar" ? "font-arabic" : "font-latin";
  return (
    <div className={"flex flex-col items-center gap-4 py-24 text-center " + font}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl">
        🔍
      </div>
      <div>
        <p className="text-lg font-bold text-gray-700">
          {lang === "ar" ? "لا توجد منتجات" : lang === "fr" ? "Aucun produit trouvé" : "No products found"}
        </p>
        <p className="mt-1 text-sm text-gray-400">
          {lang === "ar" ? "جرب تصنيفاً آخر أو ابحث بكلمة مختلفة" : lang === "fr" ? "Essayez une autre catégorie ou recherche" : "Try a different category or search term"}
        </p>
      </div>
      <button onClick={onReset}
        className={"mt-1 rounded-xl bg-[#2E8B57] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1F6B40] " + font}>
        {lang === "ar" ? "عرض الكل" : lang === "fr" ? "Voir tout" : "Show all"}
      </button>
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { language, isRTL } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";
  const dir  = isRTL ? "rtl" : "ltr";
  useSeo({
    title: "Catalogue Produits Frais — GreenGo Market Salé & Rabat",
    description: "Découvrez nos produits frais : légumes, fruits, volailles, miel, amlou, olives, fromages. Livraison 30 min à Salé et Rabat. منتجات طازجة بسلا والرباط.",
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [products,  setProducts]  = useState<DBProduct[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [activeKey, setActiveKey] = useState<string>(() => searchParams.get("cat") || "all");
  const [search,       setSearch]       = useState(() => searchParams.get("q") || "");
  const [searchInput,  setSearchInput]  = useState(() => searchParams.get("q") || ""); // raw input value
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (val.trim()) next.set("q", val);
        else next.delete("q");
        return next;
      }, { replace: true });
    }, 180);
  }, [setSearchParams]);
  const [sortKey,   setSortKey]   = useState<SortKey>("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly,  setOnSaleOnly]  = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getProducts();
      setProducts(data);
    } catch {
      setError(
        language === "ar"
          ? "تعذّر تحميل المنتجات. هل الخادم يعمل؟"
          : language === "fr"
          ? "Impossible de charger les produits. Le serveur est-il actif ?"
          : "Could not load products. Is the server running?"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Keep activeKey/search in sync with ?cat=/?q= — covers links from
  // CategoryNavBand or the header GlobalSearchBar navigating into an
  // already-mounted HomePage (no remount, so the useState initializers
  // above won't re-run).
  useEffect(() => {
    setActiveKey(searchParams.get("cat") || "all");
    const q = searchParams.get("q") || "";
    setSearchInput((prev) => (prev === q ? prev : q));
    setSearch((prev) => (prev === q ? prev : q));
  }, [searchParams]);

  function handleCategoryChange(key: string) {
    setActiveKey(key);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === "all") next.delete("cat");
      else next.set("cat", key);
      return next;
    }, { replace: true });
  }

  const filtered = useMemo(() => {
    let list = [...products];

    // Category filter
    if (activeKey !== "all") {
      const cat = NICHE_CATS.find((c) => c.key === activeKey);
      if (cat) {
        list = list.filter((p) =>
          cat.db_match.some((m) => (p.category ?? "").toLowerCase() === m.toLowerCase())
        );
      }
    }

    // In-stock filter
    if (inStockOnly) list = list.filter((p) => p.in_stock !== false);

    // On-sale filter
    if (onSaleOnly) list = list.filter((p) => p.on_sale === true);

    const q = search.trim();
    if (q) {
      // Scored, ranked, typo-tolerant, cross-language (AR/FR) search —
      // relevance ranking takes priority over sortKey while a query is active.
      list = list
        .map((p) => ({ p, score: scoreProduct(p, q) }))
        .filter(({ score }) => score >= MIN_RELEVANT_SCORE)
        .sort((a, b) => b.score - a.score)
        .map(({ p }) => p);
    } else {
      // Sort — always in-stock first
      list.sort((a, b) => (b.in_stock ? 1 : 0) - (a.in_stock ? 1 : 0));
      if (sortKey === "price_asc")  list.sort((a, b) => (b.in_stock === a.in_stock ? a.price_mad - b.price_mad : (b.in_stock ? 1 : -1)));
      if (sortKey === "price_desc") list.sort((a, b) => (b.in_stock === a.in_stock ? b.price_mad - a.price_mad : (b.in_stock ? 1 : -1)));
      if (sortKey === "name_az")    list.sort((a, b) => (b.in_stock === a.in_stock ? (a.name_ar ?? "").localeCompare(b.name_ar ?? "") : (b.in_stock ? 1 : -1)));
    }

    return list;
  }, [products, activeKey, search, inStockOnly, onSaleOnly, sortKey]);

  const bestSellers = useMemo(() => {
    if (!products.length) return [];
    return BESTSELLER_NAMES
      .map((name) => products.find((p) => p.name_ar === name && p.in_stock))
      .filter((p): p is DBProduct => !!p)
      .slice(0, 6);
  }, [products]);

  // Same 7-day cutoff as ProductCard's own "Nouveau" badge (isNewArrival,
  // urgencySignals import not needed here -- computed inline there) so a
  // product shown in this strip always carries the matching badge.
  const newArrivals = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return products
      .filter((p) => p.in_stock !== false && p.created_at && new Date(p.created_at) > cutoff)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 8);
  }, [products]);

  const inStockCount = filtered.filter((p) => p.in_stock).length;

  function resetFilters() {
    setActiveKey("all");
    setSearch("");
    setSearchInput("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("cat");
      next.delete("q");
      return next;
    }, { replace: true });
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortKey("default");
  }

  return (
    <div className={"min-h-screen " + font} style={{ background: "var(--gg-dark)" }}>

      {/* ── Page hero strip ── */}
      <div className="gg-hero relative overflow-hidden">
        <div className="absolute inset-0 zellige-bg-light opacity-12 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-8 md:py-10" dir={dir}>
          <div className={language === "ar" ? "text-right" : "text-left"}>
            <div className={"inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 mb-3 " + (isRTL ? "flex-row-reverse" : "")}>
              <Flame size={12} className="text-[#FF9800]" />
              <span className={"text-[10px] font-bold uppercase tracking-widest text-[#FF9800]/80 " + font}>
                {language === "ar" ? "طازج يومياً" : language === "fr" ? "Frais chaque jour" : "Fresh every day"}
              </span>
            </div>
            <h1 className={"text-2xl md:text-4xl font-black text-white " + font} style={{ letterSpacing: "-0.03em", fontFamily: language !== "ar" ? "var(--font-display)" : undefined }}>
              {language === "ar" ? "تسوّق المنتجات الطازجة — سلا والرباط" : language === "fr" ? "Nos Produits Frais — Salé & Rabat" : "Fresh Product Catalog — Salé & Rabat"}
            </h1>
            <h2 className={"mt-1.5 text-sm text-white/50 font-normal " + font}>
              {loading
                ? (language === "ar" ? "جارٍ التحميل…" : "Chargement…")
                : inStockCount + " " + (language === "ar" ? "منتج يوصل في 30 دقيقة" : language === "fr" ? "produits livrés en 30 minutes" : "products delivered in 30 minutes")}
            </h2>
          </div>
        </div>
        <div className="zellige-border" />
      </div>
      <SocialProofStrip />

      {/* Breadcrumb — Amazon style, dark theme to match this page's background */}
      <nav dir={dir} className={"max-w-7xl mx-auto px-4 py-2 text-xs text-white/40 flex items-center gap-1.5 " + font + " " + (isRTL ? "flex-row-reverse" : "")}>
        <Link to="/" className="hover:text-emerald-400 transition-colors">
          {language === "ar" ? "الرئيسية" : language === "fr" ? "Accueil" : "Home"}
        </Link>
        <span className="text-white/20">/</span>
        <Link to="/shop" className="hover:text-emerald-400 transition-colors">
          {language === "ar" ? "الكتالوج" : language === "fr" ? "Catalogue" : "Catalog"}
        </Link>
        {activeKey !== "all" && (
          <>
            <span className="text-white/20">/</span>
            <span className="text-emerald-400 font-medium">
              {catLabel(NICHE_CATS.find((c) => c.key === activeKey) ?? NICHE_CATS[0], language)}
            </span>
          </>
        )}
      </nav>

      {!loading && newArrivals.length > 0 && (
        <section dir={dir} className={"max-w-7xl mx-auto px-4 pt-2 " + font}>
          <div className={"flex items-center justify-between mb-3 " + (isRTL ? "flex-row-reverse" : "")}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🌿 {language === "ar" ? "وصل حديثاً" : language === "fr" ? "Arrivages du jour" : "New arrivals"}
              <span className="text-xs font-normal text-white/40">
                ({newArrivals.length} {language === "ar" ? "منتج" : language === "fr" ? (newArrivals.length > 1 ? "produits" : "produit") : (newArrivals.length > 1 ? "products" : "product")})
              </span>
            </h2>
            <button
              onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm text-[#F97316] font-semibold hover:underline">
              {language === "ar" ? "عرض الكل ←" : language === "fr" ? "Voir tout →" : "See all →"}
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {newArrivals.map((product, i) => (
              <div key={product.id} className="flex-shrink-0 w-44 snap-start">
                {/* rank starts at 1, not 0: ProductCard shows a "TOP" star
                    badge for rank===0, which belongs to best-sellers, not
                    newest arrivals -- isNewArrival (the "Nouveau" badge) is
                    computed from created_at independently, unaffected by this. */}
                <ProductCard product={product} rank={i + 1} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && bestSellers.length > 0 && (
        <section dir={dir} className={"max-w-7xl mx-auto px-4 pt-2 " + font}>
          <div className={"flex items-center justify-between mb-3 " + (isRTL ? "flex-row-reverse" : "")}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🏆 {language === "ar" ? "الأكثر مبيعاً" : language === "fr" ? "Nos best-sellers" : "Best-sellers"}
            </h2>
            <button
              onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })}
              className="text-sm text-[#F97316] font-semibold hover:underline">
              {language === "ar" ? "عرض الكل ←" : language === "fr" ? "Voir tout →" : "See all →"}
            </button>
          </div>
          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:overflow-visible">
            {bestSellers.map((product, i) => (
              <div key={product.id} className="flex-shrink-0 w-40 snap-start lg:w-auto">
                <ProductCard product={product} rank={i} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-white">
            {language === "ar" ? "كيف يعمل GreenGo؟" : language === "fr" ? "Comment ça marche ?" : "How it works?"}
          </h2>
          <p className="text-xs text-white/40 mt-1" dir="rtl">
            كيف يعمل GreenGo؟
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Step 1 — COMMANDE.webp */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-white/10" style={{ aspectRatio: "4/3" }}>
              <span className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-[#0c3228] text-[#C9A96E] font-bold flex items-center justify-center text-sm">
                1
              </span>
              <img
                src="/assets/images/step1-phone-mockup.webp"
                alt={language === "ar" ? "اطلب عبر الهاتف" : language === "fr" ? "Commandez depuis votre téléphone" : "Order from your phone"}
                className="w-full h-full object-cover"
                loading="lazy"
                width={840}
                height={616}
              />
            </div>
            <h3 className="mt-4 font-semibold text-white text-sm">
              {language === "ar" ? "اطلب عبر الهاتف" : language === "fr" ? "Commandez en ligne" : "Order online"}
            </h3>
            <p className="text-xs text-white/40 mt-0.5" dir="rtl">اطلب عبر الهاتف</p>
            <p className="text-sm text-white/60 mt-1">
              {language === "fr" ? "Choisissez vos produits frais depuis chez vous" : language === "ar" ? "اختر منتجاتك الطازجة من منزلك" : "Choose your fresh products from home"}
            </p>
          </div>

          {/* Step 2 — placeholder (no verified image yet) */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#0c3228]/40 border border-white/10 flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
              <span className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-[#0c3228] text-[#C9A96E] font-bold flex items-center justify-center text-sm">
                2
              </span>
              <span className="text-5xl">📦</span>
            </div>
            <h3 className="mt-4 font-semibold text-white text-sm">
              {language === "ar" ? "نحضر طلبيتك" : language === "fr" ? "On prépare pour vous" : "We prepare it for you"}
            </h3>
            <p className="text-xs text-white/40 mt-0.5" dir="rtl">نحضر طلبيتك</p>
            <p className="text-sm text-white/60 mt-1">
              {language === "fr" ? "Nos équipes sélectionnent les meilleurs produits" : language === "ar" ? "فريقنا يختار أفضل المنتجات" : "Our team selects the best products"}
            </p>
          </div>

          {/* Step 3 — placeholder (no verified image yet) */}
          <div className="flex flex-col items-center text-center">
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#F97316]/15 border border-white/10 flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
              <span className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-[#0c3228] text-[#C9A96E] font-bold flex items-center justify-center text-sm">
                3
              </span>
              <span className="text-5xl">🛵</span>
            </div>
            <h3 className="mt-4 font-semibold text-white text-sm">
              {language === "ar" ? "توصيل في 30 دقيقة" : language === "fr" ? "Livré en 30 min" : "Delivered in 30 min"}
            </h3>
            <p className="text-xs text-white/40 mt-0.5" dir="rtl">توصيل في 30 دقيقة</p>
            <p className="text-sm text-white/60 mt-1">
              {language === "fr" ? "Reçu chez vous, frais et dans les meilleurs délais" : language === "ar" ? "يصلك طازجاً في أسرع وقت" : "Delivered fresh, as fast as possible"}
            </p>
          </div>

        </div>
      </section>

      <div id="catalogue" className="mx-auto max-w-7xl px-4 py-6 space-y-5">

        {/* ?? WhatsApp CTA banner ?? */}
        <div style={{
          background: "#25D366",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
        }}>
          <span style={{ color: "white", fontWeight: 700, fontSize: "clamp(13px, 3vw, 17px)" }}>
            📱 Commandez directement sur WhatsApp — Rapide et simple!
          </span>
          <a
            href="https://wa.me/212664397031?text=Bonjour%20GreenGo%20Market%2C%20je%20voudrais%20commander%20%3A%0A"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "white", color: "#25D366",
              padding: "10px 20px", borderRadius: 50,
              fontWeight: 800, fontSize: 14,
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            ? Commander maintenant
          </a>
        </div>

        {/* ── Sidebar (desktop) + content (mobile pills / search / grid) ── */}
        <div className="flex gap-6 items-start">

          {/* Desktop sidebar — lg+ only, persistent category filter */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/8 overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className={"text-xs font-semibold text-white/50 uppercase tracking-wider " + font}>
                  {language === "ar" ? "التصنيفات" : language === "fr" ? "Catégories" : "Categories"}
                </h3>
              </div>
              <div className="py-2">
                {NICHE_CATS.map((cat) => {
                  const active = activeKey === cat.key;
                  const count  = cat.key === "all"
                    ? products.length
                    : products.filter((p) => cat.db_match.some((m) => (p.category ?? "").toLowerCase() === m.toLowerCase())).length;
                  if (cat.key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleCategoryChange(cat.key)}
                      className={"w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors " + font + " " + (isRTL ? "flex-row-reverse text-right" : "") + " " + (active ? "bg-[#2E8B57] text-white font-medium" : "text-white/60 hover:bg-white/8 hover:text-white")}>
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{cat.emoji}</span>
                        <span className="truncate">{catLabel(cat, language)}</span>
                      </span>
                      {count > 0 && (
                        <span className={"shrink-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-extrabold " + (active ? "bg-white/20 text-white" : "bg-white/10 text-white/50")}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Filters section */}
              <div className="border-t border-white/10 px-4 py-3">
                <h3 className={"text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 " + font}>
                  {language === "ar" ? "الفلاتر" : language === "fr" ? "Filtres" : "Filters"}
                </h3>
                <div className="space-y-2.5">
                  <label className={"flex items-center gap-2 text-sm text-white/70 cursor-pointer " + font + " " + (isRTL ? "flex-row-reverse" : "")}>
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded accent-[#2E8B57]"
                    />
                    {language === "ar" ? "المتوفر فقط" : language === "fr" ? "En stock uniquement" : "In stock only"}
                  </label>
                  <label className={"flex items-center gap-2 text-sm text-white/70 cursor-pointer " + font + " " + (isRTL ? "flex-row-reverse" : "")}>
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                      className="rounded accent-[#2E8B57]"
                    />
                    <span className="flex items-center gap-1.5">
                      {language === "ar" ? "العروض فقط" : language === "fr" ? "En promotion" : "On sale"}
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">%</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Content column */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Mobile category pills — lg:hidden, unchanged behaviour */}
            <div className="lg:hidden relative">
              <div className={"flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide " + (isRTL ? "flex-row-reverse" : "")}>
                {NICHE_CATS.map((cat) => {
                  const active  = activeKey === cat.key;
                  const count   = cat.key === "all"
                    ? products.length
                    : products.filter((p) => cat.db_match.some((m) => (p.category ?? "").toLowerCase() === m.toLowerCase())).length;
                  // Hide categories with no matching products (except "all")
                  if (cat.key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleCategoryChange(cat.key)}
                      className={"gg-pill flex shrink-0 items-center gap-2 " + font + " " + (active ? "active" : "")}>
                      <span className="text-base leading-none">{cat.emoji}</span>
                      <span>{catLabel(cat, language)}</span>
                      {count > 0 && (
                        <span className={"flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-extrabold " + (active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile filter chips — lg:hidden */}
            <div className={"lg:hidden flex gap-2 overflow-x-auto scrollbar-hide " + (isRTL ? "flex-row-reverse" : "")}>
              <button
                onClick={() => setInStockOnly((v) => !v)}
                className={"text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors " + font + " " +
                  (inStockOnly ? "bg-[#2E8B57] text-white border-[#2E8B57]" : "border-white/15 text-white/60")}>
                {language === "ar" ? "المتوفر" : language === "fr" ? "En stock" : "In stock"}
              </button>
              <button
                onClick={() => setOnSaleOnly((v) => !v)}
                className={"text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors " + font + " " +
                  (onSaleOnly ? "bg-red-500 text-white border-red-500" : "border-white/15 text-white/60")}>
                {language === "ar" ? "العروض" : language === "fr" ? "En promo" : "On sale"}
              </button>
            </div>

            {/* Search — own full-width row, promoted per Amazon-style layout */}
            <div className="relative">
              <Search size={14} className={"absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none " + (isRTL ? "right-3.5" : "left-3.5")} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                dir={dir}
                placeholder={language === "ar" ? "ابحث عن منتج…" : language === "fr" ? "Rechercher un produit…" : "Search products…"}
                className={"w-full rounded-2xl border border-white/10 bg-white/8 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white/12 shadow-sm " + (isRTL ? "pr-10 pl-4" : "pl-10 pr-4") + " " + font}
              />
            </div>

            {/* Secondary tools row: sort / refresh / clear */}
            <div className={"flex flex-wrap items-center gap-3 " + (isRTL ? "flex-row-reverse" : "")}>

              {/* Sort */}
              <div className={"flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-2.5 shadow-sm " + (isRTL ? "flex-row-reverse" : "")}>
                <SlidersHorizontal size={13} className="text-gray-400 shrink-0" />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  dir={dir}
                  className={"bg-transparent text-sm text-white/70 outline-none cursor-pointer " + font}>
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{sortLabel(opt, language)}</option>
                  ))}
                </select>
              </div>

              {/* Refresh */}
              <button
                onClick={load}
                disabled={loading}
                title="Refresh"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/55 shadow-sm transition-all hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-40">
                {loading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <RefreshCw size={14} />
                }
              </button>

              {/* Active filters summary */}
              {(activeKey !== "all" || search || inStockOnly || onSaleOnly || sortKey !== "default") && (
                <button
                  onClick={resetFilters}
                  className={"flex items-center gap-1.5 rounded-2xl border border-[#2E8B57]/25 bg-[#2E8B57]/8 px-3.5 py-2.5 text-xs font-bold text-[#2E8B57] transition-all hover:bg-[#2E8B57]/15 " + font}>
                  ✕ {language === "ar" ? "إزالة الفلاتر" : language === "fr" ? "Effacer" : "Clear filters"}
                </button>
              )}
            </div>

        {/* ── Error state ── */}
        {error && !loading && (
          <div className={"flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center " + font}>
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm font-semibold text-gray-600">{error}</p>
            <button
              onClick={load}
              className={"flex items-center gap-2 rounded-xl bg-[#2E8B57] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1F6B40] " + font}>
              <RefreshCw size={13} />
              {language === "ar" ? "إعادة المحاولة" : language === "fr" ? "Réessayer" : "Retry"}
            </button>
          </div>
        )}

        {/* ── Skeleton grid ── */}
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState onReset={resetFilters} lang={language} />
        )}

        {/* ── Product grid ── */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Result count */}
            <p className={"text-xs text-emerald-400/70 " + font + " " + (isRTL ? "text-right" : "text-left")}>
              {filtered.length} {language === "ar" ? "نتيجة" : language === "fr" ? "résultats" : "results"}
              {inStockCount < filtered.length && (
                <span className="ml-1 text-[#2E8B57]">
                  ({inStockCount} {language === "ar" ? "متاح" : language === "fr" ? "disponibles" : "in stock"})
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} rank={i} />
              ))}
            </div>
          </>
        )}

          </div>
        </div>

        {/* ?? Trust strip ?? */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-6 sm:grid-cols-4">
            {[
              { emoji: "🛵", label_fr: "Livraison rapide",     label_ar: "توصيل سريع",          label_en: "Fast delivery"       },
              { emoji: "🌿", label_fr: "100% frais",           label_ar: "طازج 100%",            label_en: "100% fresh"          },
              { emoji: "💬", label_fr: "Support WhatsApp",     label_ar: "دعم عبر واتساب",       label_en: "WhatsApp support"    },
              { emoji: "🔒", label_fr: "Paiement sécurisé",    label_ar: "دفع آمن",              label_en: "Secure payment"      },
            ].map((item) => (
              <div key={item.label_en}
                className={"flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition-colors hover:border-green-700/25 hover:bg-white/[0.07] " + (isRTL ? "flex-row-reverse" : "")}>
                <span className="text-2xl leading-none">{item.emoji}</span>
                <span className={"text-xs font-semibold text-white/60 " + font}>
                  {language === "ar" ? item.label_ar : language === "fr" ? item.label_fr : item.label_en}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

