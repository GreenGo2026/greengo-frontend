// src/pages/MenuPage.tsx — Menu Digital GreenGo Market
import { useState, useEffect, useMemo, useRef } from "react";
import QRCode from "qrcode";
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
  "Vegetables":      { emoji: "🥕", fr: "L\u00e9gumes",         ar: "\u062e\u0636\u0631\u0648\u0627\u062a",      en: "Vegetables",     bg: "#f0fdf4", accent: "#16a34a" },
  "Purified Greens": { emoji: "🥬", fr: "Herbes fra\u00eeches", ar: "\u0623\u0639\u0634\u0627\u0628 \u0637\u0627\u0632\u062c\u0629", en: "Fresh Herbs",   bg: "#f0fdf4", accent: "#15803d" },
  "Fruits":          { emoji: "🍎", fr: "Fruits",               ar: "\u0641\u0648\u0627\u0643\u0647",             en: "Fruits",         bg: "#fff7ed", accent: "#ea580c" },
  "White Meats":     { emoji: "🍗", fr: "Viandes blanches",     ar: "\u0644\u062d\u0648\u0645 \u0628\u064a\u0636\u0627\u0621",  en: "White Meats",    bg: "#fff1f2", accent: "#dc2626" },
  "Eggs":            { emoji: "🥚", fr: "\u0152ufs",            ar: "\u0628\u064a\u0636",                         en: "Eggs",           bg: "#fefce8", accent: "#ca8a04" },
  "Olives":          { emoji: "🫒", fr: "Olives",               ar: "\u0632\u064a\u062a\u0648\u0646",             en: "Olives",         bg: "#f7fee7", accent: "#65a30d" },
  "Epices":          { emoji: "🧂", fr: "\u00c9pices",          ar: "\u062a\u0648\u0627\u0628\u0644",             en: "Spices",         bg: "#faf5ff", accent: "#9333ea" },
  "Natural Juices":  { emoji: "🧃", fr: "Jus naturels",        ar: "\u0639\u0635\u0627\u0626\u0631 \u0637\u0628\u064a\u0639\u064a\u0629", en: "Natural Juices", bg: "#ecfeff", accent: "#0891b2" },
  "Mixed Packs":     { emoji: "🛒", fr: "Paniers mixtes",      ar: "\u0633\u0644\u0627\u0644 \u0645\u0634\u0643\u0644\u0629",  en: "Mixed Packs",    bg: "#f5f3ff", accent: "#7c3aed" },
};

function cat(c: string) {
  return CAT[c] ?? { emoji: "🛒", fr: c, ar: c, en: c, bg: "#f9fafb", accent: "#2E8B57" };
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
    <div className={`relative flex items-stretch rounded-2xl overflow-hidden transition-all duration-200 ${
      !p.in_stock
        ? "opacity-40 bg-gray-50"
        : disc && disc > 0
          ? "bg-amber-50/60 shadow-[0_1px_6px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
          : "bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
    }`}
      style={p.in_stock
        ? disc && disc > 0
          ? { border: "1px solid rgba(251,146,60,0.25)" }
          : { border: "1px solid rgba(0,0,0,0.06)" }
        : { border: "1px solid #e5e7eb" }
      }>

      {/* Discount ribbon */}
      {disc && disc > 0 && p.in_stock && (
        <div className="absolute top-0 right-0 z-10">
          <div className="text-[9px] font-black text-white px-2 py-0.5 rounded-bl-xl"
            style={{ background: meta.accent }}>
            -{disc}%
          </div>
        </div>
      )}

      {/* Left accent bar */}
      <div className="w-1 shrink-0"
        style={{ background: p.in_stock ? meta.accent : "#e5e7eb" }} />

      {/* Image */}
      <div className="shrink-0 w-[72px] h-[72px] flex items-center justify-center my-auto mx-3"
        style={{ borderRadius: 14, background: isJpg ? "#f9fafb" : meta.bg, overflow: "hidden" }}>
        {img
          ? <img src={img} alt={name || ""} width={72} height={72}
              className={`w-full h-full ${isJpg ? "object-cover" : "object-contain p-1"}`}
              loading="lazy" />
          : <span className="text-[28px]">{meta.emoji}</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-3 pr-1">
        <p className={`font-extrabold text-gray-900 leading-tight ${
          l === "ar" ? "font-arabic text-right text-[14px]" : "font-latin text-[13px]"
        }`}>{name}</p>

        {nameAlt && nameAlt !== name && nameAlt !== "null" && (
          <p className={`leading-tight mt-[2px] text-gray-400 ${
            l === "ar" ? "font-latin text-[11px]" : "font-arabic text-[12px]"
          }`}>{nameAlt}</p>
        )}

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md font-latin">
            {p.unit}
          </span>
          {(p.unit?.toLowerCase() === "kg" || p.unit === "كيلو") && p.in_stock && (
            <span className="text-[9px] font-bold rounded-md px-1.5 py-0.5"
              style={{ background: meta.bg, color: meta.accent }}>
              {l === "fr" ? "½ kg min." : l === "ar" ? "½ كغ" : "½ kg"}
            </span>
          )}
          {!p.in_stock && (
            <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
              {l === "ar" ? "نفذ المخزون" : l === "fr" ? "Épuisé" : "Out of stock"}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 flex flex-col items-end justify-center px-3 py-3 text-right min-w-[72px]">
        {p.in_stock ? (
          <>
            {disc && dealPrice ? (
              <>
                <span className="text-[10px] text-gray-300 line-through font-latin leading-none">
                  {p.price_mad.toFixed(2)}
                </span>
                <span className="text-[22px] font-black font-latin leading-none mt-0.5"
                  style={{ color: meta.accent }}>
                  {dealPrice.toFixed(2)}
                </span>
                <span className="text-[9px] text-gray-400 font-latin leading-none mt-0.5">MAD</span>
              </>
            ) : (
              <>
                <span className="text-[22px] font-black font-latin leading-none"
                  style={{ color: meta.accent }}>
                  {p.price_mad.toFixed(2)}
                </span>
                <span className="text-[9px] text-gray-400 font-latin leading-none mt-0.5">
                  MAD {fmtUnit(p.unit, lang)}
                </span>
              </>
            )}
          </>
        ) : (
          <span className="text-[13px] text-gray-300 font-latin">—</span>
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
  const [showQR,     setShowQR]     = useState(false);
  const [updatedAt,  setUpdatedAt]  = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code
  useEffect(() => {
    if (showQR && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, "https://www.mygreengoo.com/menu", {
        width: 200,
        margin: 2,
        color: { dark: "#0c3228", light: "#ffffff" },
      }).catch(console.error);
    }
  }, [showQR]);

  // Isolate from main site — hide ALL site chrome elements
  useEffect(() => {
    const toHide: HTMLElement[] = [];
    const selectors = [
      "header",
      "header.sticky",
      "nav",
      ".zellige-border",
      "[class*='SocialProof']",
      "[class*='sticky-cart']",
      "[class*='MobileBottom']",
      "footer",
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        const e = el as HTMLElement;
        if (!e.closest("[data-menu-page]")) {
          e.style.setProperty("display", "none", "important");
          toHide.push(e);
        }
      });
    });
    // Also hide pb-16 bottom padding on PublicShell
    const shell = document.querySelector(".pb-16") as HTMLElement | null;
    if (shell) shell.style.paddingBottom = "0";
    return () => {
      toHide.forEach(e => e.style.removeProperty("display"));
      if (shell) shell.style.paddingBottom = "";
    };
  }, []);

  useEffect(() => {
    getProducts()
      .then(all => { setProducts(all.filter(p => p.visible)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Only show categories that have at least 1 in-stock product
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats
      .filter(c => products.some(p => p.category === c && p.in_stock))
      .sort();
  }, [products]);

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
      style={{ background: "#fafaf8" }}>

      {/* ── Menu Digital standalone header ── */}
      <header data-menu-page="true" className="sticky top-0 z-40"
        style={{ background: "linear-gradient(135deg,#0c3228 0%,#1a5c3a 60%,#2E8B57 100%)", boxShadow: "0 2px 16px rgba(0,0,0,0.25)" }}>

        {/* Zellige top strip */}
        <div style={{
          height: 3,
          backgroundImage: "repeating-linear-gradient(90deg,#C9A96E 0px,#C9A96E 10px,transparent 10px,transparent 14px,#2E8B57 14px,#2E8B57 24px,transparent 24px,transparent 28px)",
          backgroundSize: "56px 3px",
          opacity: 0.65,
        }} />

        {/* Brand row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <img src="/greengo-logo-header.png" alt="GreenGo Market"
              className="h-8 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="h-5 w-px bg-white/20" />
            <div>
              <p className="text-amber-200 text-[11px] font-black leading-none tracking-[0.12em] uppercase">
                {l === "ar" ? "قائمة رقمية" : l === "fr" ? "Menu Digital" : "Digital Menu"}
              </p>
              <p className="text-white/35 text-[9px] leading-none mt-0.5 font-latin">mygreengoo.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live stock count */}
            <div className="flex items-center gap-1.5 bg-green-900/40 border border-green-600/30 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-300 font-latin">
                {loading ? "..." : `${inStockCount} dispo`}
              </span>
            </div>
            {/* QR Code button */}
            <button
              onClick={() => setShowQR(true)}
              aria-label="Afficher le QR Code"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-300 hover:bg-amber-500/20 transition-colors"
              style={{ background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.25)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="3" height="3" rx="0.5"/>
                <rect x="19" y="14" width="2" height="2" rx="0.5"/>
                <rect x="14" y="19" width="2" height="2" rx="0.5"/>
                <rect x="18" y="18" width="3" height="3" rx="0.5"/>
              </svg>
            </button>
            {/* Share button */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "GreenGo Market — Menu Digital", url: window.location.href });
                } else {
                  navigator.clipboard?.writeText(window.location.href);
                }
              }}
              aria-label="Partager le menu"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-300 hover:bg-amber-500/20 transition-colors"
              style={{ background: "rgba(201,169,110,0.15)", border: "1px solid rgba(201,169,110,0.25)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(s => !s)}
              aria-label="Rechercher"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/15 transition-colors"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Last updated timestamp */}
        {updatedAt && !loading && (
          <div className="px-4 pb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            <p className="text-[9px] text-green-300/70 font-latin">
              {l === "fr" ? `Mis à jour ${updatedAt}` : l === "ar" ? `آخر تحديث: ${updatedAt}` : `Updated ${updatedAt}`}
            </p>
          </div>
        )}

        {/* Expandable search */}
        {showSearch && (
          <div className="px-4 pb-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={l === "ar" ? "ابحث عن منتج..." : l === "fr" ? "Rechercher un produit..." : "Search products..."}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
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
                : "text-white/70 hover:bg-white/20"
            }`}
            style={activeCat !== "all" ? { background: "rgba(255,255,255,0.12)" } : {}}>
            {l === "ar" ? "الكل" : l === "fr" ? "Tout" : "All"}
            {!loading && <span className="ml-1.5 opacity-60 font-latin">{products.length}</span>}
          </button>
          {categories.map(c => {
            const m     = cat(c);
            const count = products.filter(p => p.category === c).length;
            return (
              <button key={c} onClick={() => {
                if (activeCat === "all") {
                  const el = document.getElementById(`section-${c.replace(/\s+/g, "-").toLowerCase()}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  setActiveCat(c);
                }
              }}
                className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  activeCat === c ? "bg-white shadow-md" : "text-white/70 hover:bg-white/20"
                }`}
                style={{ background: activeCat === c ? "#fff" : "rgba(255,255,255,0.12)", ...(activeCat === c ? { color: m.accent } : {}) }}>
                <span>{m.emoji}</span>
                <span>{l === "ar" ? m.ar : l === "fr" ? m.fr : m.en}</span>
                <span className="opacity-50 font-latin">{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Products ── */}
      <main className="px-3 py-4 pb-32 max-w-lg mx-auto sm:px-4">

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[76px] rounded-2xl gg-skeleton" />
            ))}
          </div>

        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">🔍</span>
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
                <section key={c} id={`section-${c.replace(/\s+/g, "-").toLowerCase()}`}>
                  {activeCat === "all" && (
                    <div className="flex items-center gap-3 mb-3 mt-1">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-sm shrink-0"
                        style={{ background: m.bg, border: `1px solid ${m.accent}20` }}>
                        {m.emoji}
                      </div>
                      <div className="flex-1">
                        <h2 className="font-black text-[15px] leading-none" style={{ color: m.accent }}>
                          {l === "ar" ? m.ar : l === "fr" ? m.fr : m.en}
                        </h2>
                        <p className="text-[10px] text-gray-400 font-latin mt-0.5">
                          {items.filter(i => i.in_stock).length}/{items.length} {l === "fr" ? "disponibles" : l === "ar" ? "متوفر" : "available"}
                        </p>
                      </div>
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

      {/* ── QR Code modal ── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-xs w-full"
            onClick={e => e.stopPropagation()}>
            <p className="font-black text-gray-900 text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>
              GreenGo <span style={{ color: "#2E8B57" }}>Market</span>
            </p>
            <p className="text-[11px] text-gray-400 mb-4 font-latin">Menu Digital — mygreengoo.com/menu</p>
            <div className="flex justify-center mb-4">
              <canvas ref={qrCanvasRef} className="rounded-xl" />
            </div>
            <p className="text-[10px] text-gray-400 mb-4 font-latin">
              {l === "fr" ? "Scannez pour voir le menu en direct" : l === "ar" ? "امسح لرؤية القائمة مباشرة" : "Scan to view live menu"}
            </p>
            <button onClick={() => setShowQR(false)}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: "#2E8B57" }}>
              {l === "fr" ? "Fermer" : l === "ar" ? "إغلاق" : "Close"}
            </button>
          </div>
        </div>
      )}

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
          <div className="text-center space-y-1">
            <p className="text-[10px] text-gray-400">
              <a href="https://www.mygreengoo.com/shop" className="hover:text-[#2E8B57] transition-colors font-latin font-semibold">
                mygreengoo.com
              </a>
              <span className="mx-1.5 text-gray-300">&bull;</span>
              <span className="font-latin">+212 664 500 789</span>
            </p>
            <p className="text-[9px] text-gray-300 font-latin">
              Laayayda, Salé &bull; Livraison rapide à Salé &amp; Rabat
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
