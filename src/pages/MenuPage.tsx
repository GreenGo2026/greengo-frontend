// src/pages/MenuPage.tsx — Menu Digital v4 — Unified GreenGo design
import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { getProducts } from "../services/api";
import type { DBProduct } from "../services/api";
import QRCode from "qrcode";

type L = "fr" | "ar" | "en";
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/[/]+$/, "");
const WA       = "https://wa.me/212664500789";

function resolveImg(url?: string | null): string {
  if (!url?.trim()) return "";
  return url.startsWith("http") ? url : API_BASE + (url.startsWith("/") ? url : "/" + url);
}

const CAT: Record<string, { emoji: string; fr: string; ar: string; en: string }> = {
  "Vegetables":      { emoji: "🥕", fr: "Légumes",          ar: "خضروات",        en: "Vegetables"     },
  "Purified Greens": { emoji: "🌿", fr: "Herbes fraîches",  ar: "أعشاب طازجة",   en: "Fresh Herbs"    },
  "Fruits":          { emoji: "🍊", fr: "Fruits",            ar: "فواكه",          en: "Fruits"         },
  "White Meats":     { emoji: "🍗", fr: "Viandes blanches", ar: "لحوم بيضاء",    en: "White Meats"    },
  "Eggs":            { emoji: "🥚", fr: "Œufs",             ar: "بيض",            en: "Eggs"           },
  "Olives":          { emoji: "🫒", fr: "Olives",            ar: "زيتون",          en: "Olives"         },
  "Epices":          { emoji: "🧂", fr: "Épices",            ar: "توابل",          en: "Spices"         },
  "Natural Juices":  { emoji: "🧃", fr: "Jus naturels",     ar: "عصائر طبيعية",  en: "Natural Juices" },
  "Mixed Packs":     { emoji: "🛒", fr: "Paniers mixtes",   ar: "سلال مشكلة",    en: "Mixed Packs"    },
};
const getCat = (c: string) => CAT[c] ?? { emoji: "🛒", fr: c, ar: c, en: c };

// ── Product Card ──────────────────────────────────────────────────────────────
function MenuCard({ p, lang }: { p: DBProduct; lang: string }) {
  const l    = lang as L;
  const meta = getCat(p.category);
  const img  = resolveImg(p.image_url);
  const isJpg = p.image_url?.endsWith(".jpg") || p.image_url?.endsWith(".jpeg");
  const name  = l === "ar" ? p.name_ar : (p.name_fr || p.name_ar);
  const alt   = l === "ar" ? p.name_fr : p.name_ar;
  const disc  = (p as any).discount_pct as number | undefined;
  const deal  = disc ? Math.round(p.price_mad * (1 - disc / 100) * 100) / 100 : null;
  const isKg  = p.unit?.toLowerCase() === "kg";

  const waMsg = l === "ar"
    ? `بغيت نطلب: ${name} - ${(deal ?? p.price_mad).toFixed(2)} درهم/${p.unit}`
    : l === "fr"
    ? `Commander: ${name} - ${(deal ?? p.price_mad).toFixed(2)} MAD/${p.unit}`
    : `Order: ${name} - ${(deal ?? p.price_mad).toFixed(2)} MAD/${p.unit}`;

  return (
    <div className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3 transition-all ${
      !p.in_stock ? "opacity-40" : "hover:shadow-md"
    }`} style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

      {/* Image */}
      <div className="shrink-0 w-[64px] h-[64px] rounded-xl overflow-hidden"
        style={{ background: isJpg ? "#f9fafb" : "#f0fdf4", border: "1px solid rgba(0,0,0,0.05)" }}>
        {img
          ? <img src={img} alt={name || ""} width={64} height={64} loading="lazy"
              className={`w-full h-full ${isJpg ? "object-cover" : "object-contain p-1"}`} />
          : <div className="w-full h-full flex items-center justify-center text-2xl">{meta.emoji}</div>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-gray-900 leading-tight text-[13px] ${l === "ar" ? "font-arabic text-right" : "font-latin"}`}>
          {name}
        </p>
        {alt && alt !== name && (
          <p className={`text-[11px] text-gray-400 mt-0.5 ${l === "ar" ? "font-latin" : "font-arabic"}`}>{alt}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] text-gray-400 font-latin">{p.unit}</span>
          {isKg && p.in_stock && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">
              {l === "fr" ? "½ kg min." : l === "ar" ? "½ كغ" : "½ kg"}
            </span>
          )}
          {disc && disc > 0 && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white bg-[#C9A96E]">
              -{disc}%
            </span>
          )}
          {!p.in_stock && (
            <span className="text-[9px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">
              {l === "fr" ? "Épuisé" : l === "ar" ? "نفذ" : "Out"}
            </span>
          )}
        </div>
      </div>

      {/* Price + Order */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="text-right">
          {deal ? (
            <>
              <span className="text-[10px] text-gray-300 line-through font-latin block leading-none">{p.price_mad.toFixed(2)}</span>
              <span className="text-[18px] font-black font-latin leading-none text-[#2E8B57]">{deal.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-[18px] font-black font-latin leading-none text-[#2E8B57]">{p.price_mad.toFixed(2)}</span>
          )}
          <span className="text-[9px] text-gray-400 font-latin block leading-none mt-0.5">MAD</span>
        </div>
        {p.in_stock && (
          <a href={`${WA}?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            style={{ border: "1px solid #bbf7d0" }}>
            <span>&#128172;</span>
            {l === "fr" ? "Commander" : l === "ar" ? "اطلب" : "Order"}
          </a>
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
  const [error,      setError]      = useState("");
  const [activeCat,  setActiveCat]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showQR,     setShowQR]     = useState(false);
  const [updatedAt,  setUpdatedAt]  = useState("");
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Load products — separate effect, no dependency on header hide
  useEffect(() => {
    setLoading(true);
    setError("");
    getProducts()
      .then(all => {
        const visible = all.filter(p => p.visible);
        setProducts(visible);
        setLoading(false);
        const now = new Date();
        setUpdatedAt(now.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(err => {
        console.error("MenuPage fetch error:", err);
        setError("Impossible de charger les produits.");
        setLoading(false);
      });
  }, []);

  // QR code
  useEffect(() => {
    if (showQR && qrRef.current) {
      QRCode.toCanvas(qrRef.current, "https://www.mygreengoo.com/menu", {
        width: 200, margin: 2, color: { dark: "#0c3228", light: "#ffffff" },
      }).catch(console.error);
    }
  }, [showQR]);

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category))]
      .filter(c => products.some(p => p.category === c && p.in_stock))
      .sort(),
  [products]);

  const filtered = useMemo(() => {
    let list = activeCat === "all" ? products : products.filter(p => p.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name_fr || "").toLowerCase().includes(q) ||
        (p.name_ar || "").includes(search)
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
      style={{ background: "#FAF7F2" }}>

      {/* ── Hero strip — matches CartHeroStrip style ── */}
      <section style={{
        background: "linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,#2E8B57 100%)",
        backgroundImage: "repeating-linear-gradient(90deg,rgba(201,169,110,0.15) 0,rgba(201,169,110,0.15) 1px,transparent 1px,transparent 60px),linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,#2E8B57 100%)",
      }}>
        <div className="mx-auto max-w-2xl px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/greengo-logo-header.png" alt="GreenGo Market"
              className="h-9 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={e => { e.currentTarget.style.display = "none"; }} />
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1 }}>
                {l === "ar" ? "قائمة المنتجات" : l === "fr" ? "Menu Digital" : "Digital Menu"}
              </h1>
              {updatedAt && (
                <p className="text-[9px] text-white/40 font-latin mt-0.5">
                  {l === "fr" ? `Mis à jour à ${updatedAt}` : `Updated ${updatedAt}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-600/30 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-bold text-green-300 font-latin">
                {loading ? "…" : `${inStockCount} dispo`}
              </span>
            </div>
            <button onClick={() => setShowQR(true)} aria-label="QR Code"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
                <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/>
                <rect x="18" y="18" width="3" height="3"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="zellige-border" />
      </section>

      {/* ── Sticky category nav ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100"
        style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
          <div className={`flex gap-1.5 overflow-x-auto flex-1 scrollbar-hide ${isRTL ? "flex-row-reverse" : ""}`}>
            <button onClick={() => setActiveCat("all")}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                activeCat === "all"
                  ? "bg-[#2E8B57] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {l === "ar" ? "الكل" : l === "fr" ? "Tout" : "All"}
              {!loading && <span className="ml-1 font-latin opacity-70">{products.length}</span>}
            </button>
            {categories.map(c => {
              const m = getCat(c);
              return (
                <button key={c} onClick={() => {
                  if (activeCat === "all") {
                    document.getElementById(`sec-${c.replace(/\s+/g, "-").toLowerCase()}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    setActiveCat(c);
                  }
                }}
                  className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all whitespace-nowrap ${
                    activeCat === c
                      ? "bg-[#2E8B57] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  <span>{m.emoji}</span>
                  <span>{l === "ar" ? m.ar : l === "fr" ? m.fr : m.en}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowSearch(s => !s)} aria-label="Search"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              showSearch ? "bg-[#2E8B57] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
        {showSearch && (
          <div className="px-4 pb-2 max-w-2xl mx-auto">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={l === "ar" ? "ابحث…" : l === "fr" ? "Rechercher un produit…" : "Search…"}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/15"
              dir="auto" />
          </div>
        )}
      </div>

      {/* ── Products ── */}
      <main className="px-4 pt-4 pb-32 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-2xl gg-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-gray-500 text-sm">{error}</p>
            <button onClick={() => window.location.reload()}
              className="text-xs font-bold text-[#2E8B57] underline">Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">🔍</span>
            <p className="text-gray-400 text-sm">
              {l === "fr" ? "Aucun produit trouvé" : l === "ar" ? "لا توجد منتجات" : "No products found"}
            </p>
            <button onClick={() => { setSearch(""); setActiveCat("all"); }}
              className="text-xs font-bold text-[#2E8B57] underline">
              {l === "fr" ? "Tout afficher" : "Show all"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => {
              const m      = getCat(cat);
              const prices = items.filter(p => p.in_stock).map(p => p.price_mad);
              const mn     = prices.length ? Math.min(...prices) : 0;
              const mx     = prices.length ? Math.max(...prices) : 0;
              return (
                <section key={cat} id={`sec-${cat.replace(/\s+/g, "-").toLowerCase()}`}>
                  {activeCat === "all" && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{m.emoji}</span>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "#0c3228", fontStyle: "italic" }}>
                        {l === "ar" ? m.ar : l === "fr" ? m.fr : m.en}
                      </h2>
                      <div className="flex-1 h-px bg-gray-200 mx-2" />
                      <span className="text-[10px] text-gray-400 font-latin shrink-0">
                        {items.filter(p => p.in_stock).length}/{items.length}
                        {prices.length > 0 && ` · ${mn === mx ? mn.toFixed(0) : `${mn.toFixed(0)}–${mx.toFixed(0)}`} MAD`}
                      </span>
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
        {!loading && !error && filtered.length > 0 && (
          <p className="text-center text-[10px] text-gray-300 mt-6 font-latin">
            GreenGo Market · mygreengoo.com · +212 664 500 789
          </p>
        )}
      </main>

      {/* ── Footer WhatsApp CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3"
        style={{ background: "linear-gradient(0deg,#FAF7F2 75%,transparent)" }}>
        <div className="max-w-2xl mx-auto space-y-1.5">
          <a href={WA} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full rounded-2xl py-3.5 text-sm font-extrabold text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {l === "ar" ? "اطلب الآن عبر واتساب" : l === "fr" ? "Commander via WhatsApp" : "Order via WhatsApp"}
          </a>
          <p className="text-center text-[9px] text-gray-400 font-latin">
            Laayayda, Salé · Livraison 2h · 8h–20h
          </p>
        </div>
      </div>

      {/* ── QR Modal ── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-xs w-full"
            onClick={e => e.stopPropagation()}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700, color: "#0c3228", fontStyle: "italic" }}>
              GreenGo Market
            </p>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#C9A96E] mb-4">Menu Digital</p>
            <div className="flex justify-center mb-3 p-3 rounded-2xl bg-gray-50">
              <canvas ref={qrRef} className="rounded-xl" />
            </div>
            <p className="text-[10px] text-gray-400 mb-4 font-latin">mygreengoo.com/menu</p>
            <button onClick={() => setShowQR(false)}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white bg-[#2E8B57]">
              {l === "fr" ? "Fermer" : l === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
