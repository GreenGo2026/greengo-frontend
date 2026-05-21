// src/pages/MenuPage.tsx — Menu Digital GreenGo Market
import { useState, useEffect, useMemo, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getProducts } from "../services/api";
import type { DBProduct } from "../services/api";

type L = "fr" | "ar" | "en";

const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const WA  = "https://wa.me/212664500789";

function resolveImg(url: string | null | undefined): string {
  if (!url || !url.trim()) return "";
  if (url.startsWith("http")) return url;
  return API + (url.startsWith("/") ? url : "/" + url);
}

const CAT: Record<string, { emoji: string; fr: string; ar: string; en: string; bg: string; accent: string }> = {
  "Vegetables":      { emoji: "\u{1F955}", fr: "L\u00e9gumes",         ar: "\u062e\u0636\u0631\u0648\u0627\u062a",      en: "Vegetables",     bg: "#f0fdf4", accent: "#16a34a" },
  "Purified Greens": { emoji: "\u{1F96C}", fr: "Herbes fra\u00eeches", ar: "\u0623\u0639\u0634\u0627\u0628 \u0637\u0627\u0632\u062c\u0629", en: "Fresh Herbs",   bg: "#f0fdf4", accent: "#15803d" },
  "Fruits":          { emoji: "\u{1F34E}", fr: "Fruits",               ar: "\u0641\u0648\u0627\u0643\u0647",             en: "Fruits",         bg: "#fff7ed", accent: "#ea580c" },
  "White Meats":     { emoji: "\u{1F357}", fr: "Viandes blanches",     ar: "\u0644\u062d\u0648\u0645 \u0628\u064a\u0636\u0627\u0621",  en: "White Meats",    bg: "#fff1f2", accent: "#dc2626" },
  "Eggs":            { emoji: "\u{1F95A}", fr: "\u0152ufs",            ar: "\u0628\u064a\u0636",                         en: "Eggs",           bg: "#fefce8", accent: "#ca8a04" },
  "Olives":          { emoji: "\u{1FAD2}", fr: "Olives",               ar: "\u0632\u064a\u062a\u0648\u0646",             en: "Olives",         bg: "#f7fee7", accent: "#65a30d" },
  "Epices":          { emoji: "\u{1F9C2}", fr: "\u00c9pices",          ar: "\u062a\u0648\u0627\u0628\u0644",             en: "Spices",         bg: "#faf5ff", accent: "#9333ea" },
  "Natural Juices":  { emoji: "\u{1F9C3}", fr: "Jus naturels",        ar: "\u0639\u0635\u0627\u0626\u0631 \u0637\u0628\u064a\u0639\u064a\u0629", en: "Natural Juices", bg: "#ecfeff", accent: "#0891b2" },
  "Mixed Packs":     { emoji: "\u{1F6D2}", fr: "Paniers mixtes",      ar: "\u0633\u0644\u0627\u0644 \u0645\u0634\u0643\u0644\u0629",  en: "Mixed Packs",    bg: "#f5f3ff", accent: "#7c3aed" },
};

function cat(c: string) {
  return CAT[c] ?? { emoji: "\u{1F6D2}", fr: c, ar: c, en: c, bg: "#f9fafb", accent: "#2E8B57" };
}

// ── Format unit display ───────────────────────────────────────────────────────
function fmtUnit(unit: string, lang: string): string {
  const l = lang as L;
  const u = unit.toLowerCase();
  if (u === "kg" || u === "\u0643\u064a\u0644\u0648") {
    return l === "ar" ? "/ \u0643\u063a" : "/ kg";
  }
  if (u === "piece" || u === "pi\u00e8ce") {
    return l === "ar" ? "/ \u0642\u0637\u0639\u0629" : l === "fr" ? "/ pi\u00e8ce" : "/ piece";
  }
  if (u === "bundle" || u === "botte") {
    return l === "ar" ? "/ \u0631\u0628\u0637\u0629" : l === "fr" ? "/ botte" : "/ bunch";
  }
  if (u === "500g") return "/ 500g";
  if (u === "100g") return "/ 100g";
  return `/ ${unit}`;
}

// ── Product card ──────────────────────────────────────────────────────────────
function MenuCard({ p, lang }: { p: DBProduct; lang: string }) {
  const l    = lang as L;
  const meta = cat(p.category);
  const img  = resolveImg(p.image_url);
  const isJpg = p.image_url?.endsWith(".jpg") || p.image_url?.endsWith(".jpeg");
  const name = l === "ar" ? p.name_ar : (p.name_fr || p.name_ar);
  const nameAlt = l === "ar" ? p.name_fr : p.name_ar;
  const disc = (p as any).discount_pct as number | undefined;
  const dealPrice = disc ? Math.round(p.price_mad * (1 - disc / 100) * 100) / 100 : null;

  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
      !p.in_stock
        ? "opacity-50 bg-gray-50 border-gray-100"
        : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
    }`}>

      {/* Image */}
      <div
        className="shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: isJpg ? "#fff" : meta.bg }}>
        {img
          ? <img src={img} alt={name || ""} width={68} height={68}
              className={`w-full h-full ${isJpg ? "object-cover" : "object-contain p-1.5"}`}
              loading="lazy" />
          : <span className="text-3xl">{meta.emoji}</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-gray-900 text-[14px] leading-snug ${
          l === "ar" ? "font-arabic text-right" : "font-latin"
        }`}>{name}</p>
        {nameAlt && nameAlt !== name && (
          <p className={`text-[11px] text-gray-400 leading-tight mt-0.5 ${
            l === "ar" ? "font-latin" : "font-arabic"
          }`}>{nameAlt}</p>
        )}
        {/* Step hint for kg products */}
        {(p.unit?.toLowerCase() === "kg" || p.unit === "\u0643\u064a\u0644\u0648") && p.in_stock && (
          <p className="text-[10px] text-green-600 mt-1 font-latin">
            {l === "ar" ? "\u0645\u062a\u0627\u062d \u0628\u0646\u0635\u0641 \u0643\u064a\u0644\u0648" : l === "fr" ? "Disponible au demi-kilo" : "Available per 500g"}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        {p.in_stock ? (
          <>
            {disc && dealPrice ? (
              <>
                <p className="text-base font-black font-latin leading-none" style={{ color: meta.accent }}>
                  {dealPrice.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-300 line-through font-latin">{p.price_mad.toFixed(2)}</p>
                <p className="text-[9px] font-bold rounded-full px-1.5 py-0.5 inline-block mt-0.5"
                  style={{ background: meta.bg, color: meta.accent }}>-{disc}%</p>
              </>
            ) : (
              <>
                <p className="text-base font-black font-latin leading-none" style={{ color: meta.accent }}>
                  {p.price_mad.toFixed(2)}
                </p>
                <p className="text-[9px] text-gray-400 font-latin">{fmtUnit(p.unit, lang)}</p>
              </>
            )}
          </>
        ) : (
          <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-full">
            {l === "ar" ? "\u0646\u0641\u0630" : l === "fr" ? "\u00c9puis\u00e9" : "Out"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const { language, isRTL } = useLanguage();
  const l = language as L;

  const [products,   setProducts]   = useState<DBProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [activeCat,  setActiveCat]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    getProducts()
      .then(all => { setProducts(all.filter(p => p.visible)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category))].sort(),
  [products]);

  const filtered = useMemo(() => {
    let list = activeCat === "all" ? products : products.filter(p => p.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name_fr || "").toLowerCase().includes(q) ||
        (p.name_ar || "").includes(search) ||
        (p.category || "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (b.in_stock ? 1 : 0) - (a.in_stock ? 1 : 0));
  }, [products, activeCat, search]);

  const grouped = useMemo(() => {
    if (activeCat !== "all") return { [activeCat]: filtered };
    const g: Record<string, DBProduct[]> = {};
    for (const p of filtered) {
      if (!g[p.category]) g[p.category] = [];
      g[p.category].push(p);
    }
    return g;
  }, [filtered, activeCat]);

  const inStockCount = products.filter(p => p.in_stock).length;

  return (
    <div className={`min-h-screen ${language === "ar" ? "font-arabic" : "font-latin"}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ background: "#f5f7f5" }}>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 shadow-lg"
        style={{ background: "linear-gradient(135deg,#0c3228 0%,#2E8B57 100%)" }}>

        {/* Top row */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="text-lg">\u{1F33F}</span>
            </div>
            <div>
              <p className="text-white font-black text-base leading-none" style={{ fontFamily: "var(--font-display)" }}>
                GreenGo <span style={{ color: "#C9A96E" }}>Market</span>
              </p>
              <p className="text-green-300 text-[10px] font-semibold leading-none mt-0.5">
                {l === "ar" ? "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a" : l === "fr" ? "Menu Digital" : "Digital Menu"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-600/30 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-300">
                {loading ? "..." : `${inStockCount} ${l === "ar" ? "\u0645\u062a\u0648\u0641\u0631" : l === "fr" ? "dispo" : "live"}`}
              </span>
            </div>
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(s => !s)}
              aria-label="Search"
              className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search bar — expandable */}
        {showSearch && (
          <div className="px-4 pb-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={l === "ar" ? "\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0646\u062a\u062c..." : l === "fr" ? "Rechercher..." : "Search..."}
              className="w-full rounded-xl bg-white/15 border border-white/20 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:bg-white/25"
              dir="auto"
            />
          </div>
        )}

        {/* Category pills */}
        <div className={`flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide ${isRTL ? "flex-row-reverse" : ""}`}>
          <button onClick={() => setActiveCat("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeCat === "all"
                ? "bg-white text-[#2E8B57] shadow-md"
                : "bg-white/15 text-white/70 hover:bg-white/25"
            }`}>
            {l === "ar" ? "\u0627\u0644\u0643\u0644" : l === "fr" ? "Tout" : "All"}
            {!loading && <span className="ml-1.5 opacity-70 font-latin">{products.length}</span>}
          </button>
          {categories.map(c => {
            const m     = cat(c);
            const count = products.filter(p => p.category === c).length;
            return (
              <button key={c} onClick={() => setActiveCat(c)}
                className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  activeCat === c
                    ? "bg-white shadow-md"
                    : "bg-white/15 text-white/70 hover:bg-white/25"
                }`}
                style={activeCat === c ? { color: m.accent } : {}}>
                <span>{m.emoji}</span>
                <span>{l === "ar" ? m.ar : l === "fr" ? m.fr : m.en}</span>
                <span className="opacity-50 font-latin">{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Products ── */}
      <main className="px-4 py-4 pb-32 max-w-2xl mx-auto">

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-2xl gg-skeleton" />
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">\u{1F50D}</span>
            <p className="text-gray-400 text-sm text-center">
              {l === "ar" ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a" : l === "fr" ? "Aucun produit trouv\u00e9" : "No products found"}
            </p>
            <button onClick={() => { setSearch(""); setActiveCat("all"); }}
              className="text-xs font-bold text-[#2E8B57] underline">
              {l === "ar" ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : l === "fr" ? "Tout afficher" : "Show all"}
            </button>
          </div>

        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([c, items]) => {
              const m = cat(c);
              return (
                <section key={c}>
                  {activeCat === "all" && (
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: m.bg }}>
                        {m.emoji}
                      </div>
                      <h2 className="font-black text-gray-800 text-[15px]" style={{ color: m.accent }}>
                        {l === "ar" ? m.ar : l === "fr" ? m.fr : m.en}
                      </h2>
                      <div className="flex-1 h-px bg-gray-200 mx-2" />
                      <span className="text-xs text-gray-400 font-latin shrink-0">{items.length}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {items.map(p => <MenuCard key={p.id} p={p} lang={language} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Product count footer */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6 font-latin">
            {filtered.length} {l === "ar" ? "\u0645\u0646\u062a\u062c" : l === "fr" ? "produits" : "products"} &bull; GreenGo Market &bull; mygreengoo.com
          </p>
        )}
      </main>

      {/* ── Fixed footer CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{ background: "linear-gradient(0deg,#f5f7f5 70%,transparent 100%)" }}>
        <div className="max-w-2xl mx-auto space-y-2">
          {/* WhatsApp order CTA */}
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-3.5 text-sm font-extrabold text-white shadow-xl transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {l === "ar" ? "\u0627\u0637\u0644\u0628 \u0627\u0644\u0622\u0646 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : l === "fr" ? "Commander via WhatsApp" : "Order via WhatsApp"}
          </a>
          {/* Site link */}
          <p className="text-center text-[10px] text-gray-400">
            <a href="https://www.mygreengoo.com/shop" className="hover:text-[#2E8B57] transition-colors font-latin">
              mygreengoo.com
            </a>
            {" "}&bull;{" "}
            <span className="font-latin">+212 664 500 789</span>
          </p>
        </div>
      </div>

    </div>
  );
}
