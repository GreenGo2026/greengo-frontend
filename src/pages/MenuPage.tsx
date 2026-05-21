// src/pages/MenuPage.tsx
// Digital Menu — mobile-first, live from API, QR-accessible
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getProducts } from "../services/api";
import type { DBProduct } from "../services/api";

type L = "fr" | "ar" | "en";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

function resolveImg(url: string | null | undefined): string {
  if (!url || url.trim() === "") return "";
  if (url.startsWith("http")) return url;
  return API + (url.startsWith("/") ? url : "/" + url);
}

// ── Category metadata ─────────────────────────────────────────────────────────
const CAT_META: Record<string, { emoji: string; label_fr: string; label_ar: string; label_en: string; color: string }> = {
  "Vegetables":      { emoji: "🥕", label_fr: "Légumes",        label_ar: "خضروات",      label_en: "Vegetables",    color: "#16a34a" },
  "Purified Greens": { emoji: "🥗", label_fr: "Herbes fraîches", label_ar: "أعشاب طازجة", label_en: "Fresh Herbs",   color: "#15803d" },
  "Fruits":          { emoji: "🍎", label_fr: "Fruits",          label_ar: "فواكه",        label_en: "Fruits",        color: "#ea580c" },
  "White Meats":     { emoji: "🍗", label_fr: "Viandes",         label_ar: "لحوم بيضاء",  label_en: "White Meats",   color: "#dc2626" },
  "Eggs":            { emoji: "🥚", label_fr: "Œufs",            label_ar: "بيض",          label_en: "Eggs",          color: "#ca8a04" },
  "Olives":          { emoji: "🫒", label_fr: "Olives",          label_ar: "زيتون",        label_en: "Olives",        color: "#65a30d" },
  "Epices":          { emoji: "🧂", label_fr: "Épices",          label_ar: "توابل",        label_en: "Spices",        color: "#9333ea" },
  "Natural Juices":  { emoji: "🧃", label_fr: "Jus naturels",    label_ar: "عصائر طبيعية", label_en: "Natural Juices",color: "#0891b2" },
  "Mixed Packs":     { emoji: "🛒", label_fr: "Paniers mixtes",  label_ar: "سلال مشكلة",  label_en: "Mixed Packs",   color: "#7c3aed" },
};

function getCat(cat: string) {
  return CAT_META[cat] ?? { emoji: "🛒", label_fr: cat, label_ar: cat, label_en: cat, color: "#2E8B57" };
}

// ── Product card ──────────────────────────────────────────────────────────────
function MenuCard({ product, lang }: { product: DBProduct; lang: string }) {
  const l   = lang as L;
  const cat = getCat(product.category);
  const img = resolveImg(product.image_url);
  const name = l === "ar" ? product.name_ar : (product.name_fr || product.name_ar);
  const isJpg = product.image_url?.endsWith(".jpg") || product.image_url?.endsWith(".jpeg");

  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white border border-gray-100 p-3 shadow-sm transition-all ${
      !product.in_stock ? "opacity-50" : ""
    }`}>
      {/* Image */}
      <div className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center ${
        isJpg ? "bg-white" : "bg-gray-50"
      }`}>
        {img
          ? <img src={img} alt={name || ""} width={64} height={64}
              className={`w-full h-full ${isJpg ? "object-cover" : "object-contain p-1"}`} />
          : <span className="text-2xl">{cat.emoji}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-gray-900 text-sm leading-tight truncate ${
          l === "ar" ? "font-arabic text-right" : "font-latin"
        }`}>{name}</p>
        {product.name_fr && product.name_ar && product.name_fr !== product.name_ar && (
          <p className={`text-xs text-gray-400 truncate ${l === "ar" ? "font-latin" : "font-arabic"}`}>
            {l === "ar" ? product.name_fr : product.name_ar}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5 font-latin">{product.unit}</p>
      </div>

      {/* Price + stock */}
      <div className="shrink-0 text-right">
        {product.in_stock ? (
          <>
            <p className="text-lg font-black text-[#2E8B57] font-latin leading-none">
              {product.price_mad.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-400 font-latin">MAD</p>
          </>
        ) : (
          <span className="text-[10px] font-bold text-red-400 bg-red-50 rounded-full px-2 py-1">
            {l === "ar" ? "نفذ" : l === "fr" ? "Épuisé" : "Out"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { language, isRTL } = useLanguage();
  const l = language as L;
  const [products,  setProducts]  = useState<DBProduct[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activecat, setActiveCat] = useState<string>("all");
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    getProducts().then(all => {
      setProducts(all.filter(p => p.visible));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))].sort();
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    let list = activecat === "all" ? products : products.filter(p => p.category === activecat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name_fr || "").toLowerCase().includes(q) ||
        (p.name_ar || "").includes(search)
      );
    }
    // In-stock first
    return [...list].sort((a, b) => (b.in_stock ? 1 : 0) - (a.in_stock ? 1 : 0));
  }, [products, activecat, search]);

  const grouped = useMemo(() => {
    if (activecat !== "all") return { [activecat]: filtered };
    const g: Record<string, DBProduct[]> = {};
    for (const p of filtered) {
      if (!g[p.category]) g[p.category] = [];
      g[p.category].push(p);
    }
    return g;
  }, [filtered, activecat]);

  return (
    <div className={`min-h-screen ${language === "ar" ? "font-arabic" : "font-latin"}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: "#f8faf8" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d3b36 0%, #2E8B57 100%)" }}
        className="sticky top-0 z-30 px-4 pt-4 pb-3 shadow-lg">

        {/* Brand */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/greengo-logo-header.png" alt="GreenGo Market"
              className="h-8 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display="none"; }} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest">
              {l === "ar" ? "قائمة المنتجات" : l === "fr" ? "Menu Digital" : "Digital Menu"}
            </p>
            <p className="text-[9px] text-white/40">
              {l === "ar" ? "يتحدث لحظياً" : l === "fr" ? "Mis à jour en temps réel" : "Live updated"}
            </p>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={l === "ar" ? "ابحث عن منتج..." : l === "fr" ? "Rechercher un produit..." : "Search products..."}
          className="w-full rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-white/40 mb-3 font-latin"
          dir="auto"
        />

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCat("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activecat === "all"
                ? "bg-white text-[#2E8B57] shadow-md"
                : "bg-white/15 text-white/70 hover:bg-white/25"
            }`}>
            {l === "ar" ? "الكل" : l === "fr" ? "Tout" : "All"}
            <span className="ml-1.5 opacity-60">{products.length}</span>
          </button>
          {categories.map(cat => {
            const meta = getCat(cat);
            const count = products.filter(p => p.category === cat).length;
            return (
              <button key={cat}
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  activecat === cat
                    ? "bg-white shadow-md"
                    : "bg-white/15 text-white/70 hover:bg-white/25"
                }`}
                style={activecat === cat ? { color: meta.color } : {}}>
                <span>{meta.emoji}</span>
                {l === "ar" ? meta.label_ar : l === "fr" ? meta.label_fr : meta.label_en}
                <span className="opacity-50">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-4 max-w-2xl mx-auto pb-24">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl gg-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-gray-400 text-sm">
              {l === "ar" ? "لا توجد منتجات" : l === "fr" ? "Aucun produit trouvé" : "No products found"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => {
              const meta = getCat(cat);
              return (
                <section key={cat}>
                  {activecat === "all" && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{meta.emoji}</span>
                      <h2 className="font-black text-gray-800 text-base"
                        style={{ color: meta.color }}>
                        {l === "ar" ? meta.label_ar : l === "fr" ? meta.label_fr : meta.label_en}
                      </h2>
                      <span className="text-xs text-gray-400 ml-auto">{items.length}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {items.map(p => <MenuCard key={p.id} product={p} lang={language} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 max-w-2xl mx-auto"
        style={{ background: "linear-gradient(0deg, #f8faf8 80%, transparent 100%)" }}>
        <a href="https://wa.me/212664500789"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-2xl py-3.5 text-sm font-extrabold text-white shadow-xl"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {l === "ar" ? "اطلب الآن عبر واتساب" : l === "fr" ? "Commander via WhatsApp" : "Order via WhatsApp"}
        </a>
      </div>

    </div>
  );
}
