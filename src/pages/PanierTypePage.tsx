// src/pages/PanierTypePage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCartStore } from "../store/cartStore";
import { getPaniers, getProducts } from "../services/api";
import type { Panier, PanierItem, DBProduct } from "../services/api";

type L = "fr" | "ar" | "en";

// Accent-insensitive, case-insensitive match -- mirrors normalizeLabel in
// PaniersTab.tsx so a panier item resolves to the same catalog product
// whether viewed by an admin or a customer. NFD-decompose then drop the
// combining-diacritical-marks block (U+0300-U+036F) by code point, rather
// than a \u-escaped regex literal.
function normalizeLabel(s: string): string {
  const decomposed = s.toLowerCase().trim().normalize("NFD");
  let out = "";
  for (const ch of decomposed) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x0300 || code > 0x036f) out += ch;
  }
  return out;
}

function resolveProduct(label: string, products: DBProduct[]): DBProduct | null {
  const norm = normalizeLabel(label);
  return products.find((p) => normalizeLabel(p.name_fr || "") === norm) ?? null;
}

// ── Presentation metadata ─────────────────────────────────────────────────────
// The `paniers` collection (shared with the admin editor in PaniersTab.tsx)
// only stores id/order/title/persons/accent/items -- no emoji, badge,
// subtitle or trilingual copy. That marketing dressing lives here, keyed by
// basket id, so editing a basket's items/price/persons in the admin panel
// stays live on this page without losing the richer public presentation.
interface Presentation {
  emoji:       string;
  badge:       Record<L, string>;
  subtitle:    Record<L, string>;
  description: Record<L, string>;
  color:       string;
}

const PRESENTATION: Record<string, Presentation> = {
  famille: {
    emoji: "👨‍👩‍👧‍👦",
    badge:       { fr: "Le plus populaire", ar: "الأكثر طلباً", en: "Most popular" },
    subtitle:    { fr: "4 personnes · 1 semaine", ar: "4 أشخاص · أسبوع", en: "4 people · 1 week" },
    description: { fr: "Légumes frais, fruits de saison et poulet entier pour une semaine complète.", ar: "خضروات طازجة وفواكه موسمية ودجاجة كاملة لأسبوع كامل.", en: "Fresh vegetables, seasonal fruits and whole chicken for a full week." },
    color: "from-green-900/30 to-emerald-900/20",
  },
  couple: {
    emoji: "👫",
    badge:       { fr: "Idéal débutants", ar: "مثالي للمبتدئين", en: "Great for beginners" },
    subtitle:    { fr: "2 personnes · 1 semaine", ar: "شخصان · أسبوع", en: "2 people · 1 week" },
    description: { fr: "L'essentiel pour deux — légumes, fruits et protéines pour la semaine.", ar: "الأساسيات لشخصين — خضروات وفواكه وبروتينات للأسبوع.", en: "The essentials for two — vegetables, fruits and proteins for the week." },
    color: "from-amber-900/25 to-orange-900/15",
  },
  legumes: {
    emoji: "🥗",
    badge:       { fr: "100% végétal", ar: "100% نباتي", en: "100% plant-based" },
    subtitle:    { fr: "Fraîcheur garantie", ar: "طازجة مضمونة", en: "Guaranteed fresh" },
    description: { fr: "Une sélection de légumes frais choisis ce matin — idéal pour cuisiner marocain toute la semaine.", ar: "تشكيلة من خضروات طازجة مختارة هذا الصباح — مثالية للطبخ المغربي طوال الأسبوع.", en: "A selection of fresh vegetables picked this morning — ideal for Moroccan cooking all week." },
    color: "from-emerald-900/25 to-green-900/15",
  },
  tajine: {
    emoji: "🫕",
    badge:       { fr: "Spécial Maroc", ar: "خاص بالمغرب", en: "Moroccan special" },
    subtitle:    { fr: "Tout pour vos tajines maison", ar: "كل ما تحتاجه لطواجنك", en: "Everything for home tajines" },
    description: { fr: "Les ingrédients parfaits pour cuisiner un tajine authentique — poulet, légumes et épices inclus.", ar: "المكونات المثالية لطهي طاجين أصيل — دجاج وخضروات وتوابل مشمولة.", en: "Perfect ingredients for an authentic tajine — chicken, vegetables and spices included." },
    color: "from-rose-900/20 to-orange-900/15",
  },
  fruits: {
    emoji: "🍇",
    badge:       { fr: "Vitamines & énergie", ar: "فيتامينات وطاقة", en: "Vitamins & energy" },
    subtitle:    { fr: "Fruits de saison · famille", ar: "فواكه موسمية · للعائلة", en: "Seasonal fruits · family" },
    description: { fr: "Une sélection de fruits frais de saison — idéal pour toute la famille.", ar: "تشكيلة من فواكه طازجة موسمية — مثالية للعائلة بأكملها.", en: "A selection of fresh seasonal fruits — ideal for the whole family." },
    color: "from-purple-900/20 to-pink-900/15",
  },
};

const DEFAULT_PRESENTATION: Presentation = {
  emoji: "🛒",
  badge:       { fr: "Panier prêt", ar: "سلة جاهزة", en: "Ready basket" },
  subtitle:    { fr: "", ar: "", en: "" },
  description: { fr: "", ar: "", en: "" },
  color: "from-gray-800/30 to-gray-900/20",
};

// ── Live price/stock resolution ───────────────────────────────────────────────
interface ResolvedItem extends PanierItem {
  product: DBProduct | null; // null = no catalog match ("Produit introuvable")
}

function resolveItems(items: PanierItem[], products: DBProduct[]): ResolvedItem[] {
  return items.map((it) => ({ ...it, product: resolveProduct(it.label, products) }));
}

function calcTotal(items: ResolvedItem[]): number {
  return items.reduce((sum, it) => {
    if (!it.product || !it.product.in_stock) return sum;
    return sum + it.product.price_mad * it.qty;
  }, 0);
}

function calcSaving(total: number): number {
  return Math.round(total * 0.08); // 8% basket discount
}

// ── Basket Card ───────────────────────────────────────────────────────────────
function BasketCard({ basket, products, lang }: { basket: Panier; products: DBProduct[]; lang: string }) {
  const l          = lang as L;
  const [open, setOpen]   = useState(false);
  const [added, setAdded] = useState(false);
  const addToCart  = useCartStore(s => s.addToCart);

  const presentation   = PRESENTATION[basket.id] ?? DEFAULT_PRESENTATION;
  const resolvedItems  = resolveItems(basket.items, products);
  const total          = calcTotal(resolvedItems);
  const saving         = calcSaving(total);
  const discounted     = total - saving;
  const missingCount   = resolvedItems.filter(it => !it.product).length;
  const hasAddable      = resolvedItems.some(it => it.product && it.product.in_stock);

  function itemDisplayName(it: ResolvedItem): string {
    if (l === "ar") return it.product?.name_ar || it.label;
    return it.product?.name_fr || it.label;
  }

  function handleAddAll() {
    resolvedItems.forEach(it => {
      if (!it.product || !it.product.in_stock) return; // skip unresolved / out-of-stock
      addToCart({
        name:           it.product.name_ar,
        price_per_unit: it.product.price_mad,
        unit:           it.product.unit,
        available:      true,
      }, it.qty);
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <article
      className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br ${presentation.color}`}
      style={{ border: `1px solid ${basket.accent}30` }}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className={`flex items-start justify-between mb-3 ${l === "ar" ? "flex-row-reverse" : ""}`}>
          <div>
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2"
              style={{ background: `${basket.accent}20`, color: basket.accent, border: `1px solid ${basket.accent}40` }}>
              ⭐ {presentation.badge[l]}
            </span>
            <h2 className={`text-xl font-black text-white leading-tight ${l === "ar" ? "font-arabic text-right" : "font-latin"}`} style={l !== "ar" ? { fontFamily: "var(--font-display)", fontSize: "1.4rem" } : {}}>
              {presentation.emoji} {basket.title}
            </h2>
            {presentation.subtitle[l] && (
              <p className={`text-xs text-white/50 mt-0.5 ${l === "ar" ? "font-arabic text-right" : "font-latin"}`}>
                {presentation.subtitle[l]}
              </p>
            )}
          </div>
          {/* Persons pill */}
          <div className="flex flex-col items-center shrink-0 rounded-2xl px-3 py-2"
            style={{ background: `${basket.accent}15`, border: `1px solid ${basket.accent}30` }}>
            <span className="text-2xl">👥</span>
            <span className="text-[10px] font-bold text-white/60 mt-0.5">{basket.persons} pers.</span>
          </div>
        </div>

        {presentation.description[l] && (
          <p className={`text-sm text-white/55 leading-relaxed mb-4 ${l === "ar" ? "font-arabic text-right" : "font-latin"}`}>
            {presentation.description[l]}
          </p>
        )}

        {/* Items preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {resolvedItems.map((item, i) => (
            <span key={i}
              className={"flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold " + (item.product ? "text-white/70" : "text-white/35")}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {itemDisplayName(item)}
              {item.qty > 1 && <span className="text-white/40 font-latin">×{item.qty}</span>}
            </span>
          ))}
        </div>

        {/* Pricing */}
        <div className={`flex items-center gap-3 mb-4 ${l === "ar" ? "flex-row-reverse" : ""}`}>
          <div>
            {total > 0 ? (
              <>
                <div className={`flex items-baseline gap-1.5 ${l === "ar" ? "flex-row-reverse" : ""}`}>
                  <span className="text-4xl font-black text-white font-latin" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.03em" }}>{discounted.toFixed(0)}</span>
                  <span className="text-sm text-white/50 font-latin">MAD</span>
                </div>
                <div className={`flex items-center gap-2 ${l === "ar" ? "flex-row-reverse" : ""}`}>
                  <span className="text-sm text-white/30 line-through font-latin">{total.toFixed(0)} MAD</span>
                  <span className="text-xs font-bold rounded-full px-2 py-0.5"
                    style={{ background: `${basket.accent}25`, color: basket.accent }}>
                    -{saving} MAD
                  </span>
                </div>
              </>
            ) : (
              <span className="text-sm font-bold text-white/40">
                {l === "ar" ? "السعر غير متوفر" : l === "fr" ? "Prix non disponible" : "Price unavailable"}
              </span>
            )}
          </div>
          <div className="flex-1" />
          {/* Toggle details */}
          <button onClick={() => setOpen(!open)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${l === "ar" ? "font-arabic" : "font-latin"}`}
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            {open
              ? (l === "ar" ? "إخفاء" : l === "fr" ? "Masquer" : "Hide")
              : (l === "ar" ? "التفاصيل" : l === "fr" ? "Détails" : "Details")}
          </button>
        </div>

        {missingCount > 0 && (
          <p className="mb-3 text-[11px] font-semibold text-amber-400/80">
            ⚠ {l === "ar" ? `${missingCount} منتج غير متوفر حالياً` : l === "fr" ? `${missingCount} produit${missingCount > 1 ? "s" : ""} indisponible${missingCount > 1 ? "s" : ""} dans ce panier` : `${missingCount} item${missingCount > 1 ? "s" : ""} currently unavailable`}
          </p>
        )}

        {/* Expanded items detail */}
        {open && (
          <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {resolvedItems.map((item, i) => (
              <div key={i}
                className={`flex items-center justify-between px-3 py-2 text-xs ${i % 2 === 0 ? "bg-white/[0.03]" : ""} ${l === "ar" ? "flex-row-reverse" : ""}`}>
                <span className="text-white/70 flex items-center gap-1.5">
                  <span className={l === "ar" ? "font-arabic" : "font-latin"}>
                    {itemDisplayName(item)}
                  </span>
                  {item.qty !== 1 && <span className="text-white/35 font-latin">×{item.qty} {item.unit}</span>}
                </span>
                {!item.product ? (
                  <span className="text-[10px] font-bold text-amber-400/80">
                    {l === "ar" ? "غير موجود" : l === "fr" ? "Indisponible" : "Unavailable"}
                  </span>
                ) : !item.product.in_stock ? (
                  <span className="text-[10px] font-bold text-red-400/80">
                    {l === "ar" ? "نفذ" : l === "fr" ? "Rupture" : "Out of stock"}
                  </span>
                ) : (
                  <span className="text-white/40 font-latin">{(item.product.price_mad * item.qty).toFixed(2)} MAD</span>
                )}
              </div>
            ))}
            {total > 0 && (
              <div className={`flex justify-between px-3 py-2 font-bold text-xs border-t border-white/10 ${l === "ar" ? "flex-row-reverse" : ""}`}>
                <span className={`text-white/50 ${l === "ar" ? "font-arabic" : "font-latin"}`}>
                  {l === "ar" ? "المجموع قبل الخصم" : l === "fr" ? "Total avant réduction" : "Total before discount"}
                </span>
                <span className="text-white/50 font-latin">{total.toFixed(2)} MAD</span>
              </div>
            )}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2">
          <button onClick={handleAddAll} disabled={!hasAddable}
            className={`flex-1 rounded-2xl py-4 text-sm font-extrabold text-white transition-all duration-200 active:scale-[0.97] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed ${l === "ar" ? "font-arabic" : "font-latin"}`}
            style={{
              background: added
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : `linear-gradient(135deg,${basket.accent},${basket.accent}cc)`,
              boxShadow: `0 4px 20px ${basket.accent}35`,
            }}>
            {added
              ? (l === "ar" ? "✓ تمت الإضافة للسلة" : l === "fr" ? "✓ Ajouté au panier !" : "✓ Added to cart!")
              : (l === "ar" ? "🛒 إضافة الكل للسلة" : l === "fr" ? "🛒 Ajouter tout au panier" : "🛒 Add all to cart")}
          </button>
          {added && (
            <Link to="/cart"
              className={`flex items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all ${l === "ar" ? "font-arabic" : "font-latin"}`}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PanierTypePage() {
  const { language, isRTL } = useLanguage();
  const l = language as L;
  const cart       = useCartStore(s => s.cart);
  const totalItems = cart.reduce((n, i) => n + (i.cartQuantity || 0), 0);

  const [baskets,  setBaskets]  = useState<Panier[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([getPaniers(), getProducts()])
      .then(([paniersData, productsData]) => {
        if (cancelled) return;
        const sorted = [...paniersData].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        setBaskets(sorted);
        setProducts(productsData);
      })
      .catch(() => {
        if (!cancelled) setError(
          l === "ar" ? "تعذر تحميل السلات. حاول مجدداً." : l === "fr" ? "Impossible de charger les paniers. Réessayez." : "Couldn't load baskets. Please try again."
        );
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [l]);

  return (
    <div className={language === "ar" ? "font-arabic" : "font-latin"} dir={isRTL ? "rtl" : "ltr"}
      style={{ minHeight: "100vh", background: "linear-gradient(160deg,#031409 0%,#061a12 40%,#0a2318 100%)" }}>
      <main>

        {/* Hero */}
        <section aria-label="Paniers types GreenGo Market" className="relative overflow-hidden px-6 py-14 text-center">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(46,139,87,0.18) 0%, transparent 65%)" }} />
          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-700/30 rounded-full px-4 py-1.5 mb-5">
              <span>🛒</span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-green-300">
                {l === "ar" ? "سلات جاهزة · GreenGo Market" : l === "fr" ? "Paniers prêts · GreenGo Market" : "Ready baskets · GreenGo Market"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              {l === "ar" ? "سلاتنا" : l === "fr" ? "Nos Paniers"  : "Our Baskets"}<br/>
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                {l === "ar" ? "الجاهزة" : l === "fr" ? "Prêts à Commander" : "Ready to Order"}
              </span>
            </h1>
            <div className="h-0.5 w-24 mx-auto my-4 bg-gradient-to-r from-green-500 to-amber-500" />
            <p className="text-white/45 text-base leading-relaxed max-w-lg mx-auto font-light">
              {l === "ar"
                ? "اختر سلتك الجاهزة وأضف كل المنتجات للسلة بنقرة واحدة. توفير مضمون على كل سلة."
                : l === "fr"
                ? "Choisissez votre panier et ajoutez tous les produits en un clic. Économie garantie sur chaque panier."
                : "Choose your basket and add all products in one click. Guaranteed savings on every basket."}
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {[
                { e:"💰", fr:"8% de réduction",       ar:"خصم 8%",              en:"8% discount"        },
                { e:"🛵", fr:"Livraison incluse",      ar:"التوصيل مشمول",       en:"Delivery included"  },
                { e:"🌿", fr:"100% frais ce matin",   ar:"طازج 100% هذا الصباح",en:"100% fresh today"   },
                { e:"✅", fr:"Qualité garantie",       ar:"جودة مضمونة",         en:"Quality guaranteed" },
              ].map(p => (
                <span key={p.en} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/60"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {p.e} {l === "ar" ? p.ar : l === "fr" ? p.fr : p.en}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Baskets grid */}
        <section aria-label="Liste des paniers types" className="px-4 pb-8 max-w-5xl mx-auto">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-white/50">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm font-semibold">
                {l === "ar" ? "جارٍ تحميل السلال..." : l === "fr" ? "Chargement des paniers…" : "Loading baskets…"}
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <AlertCircle size={22} className="text-red-400" />
              <p className="text-sm font-semibold text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {baskets.map(basket => (
                <BasketCard key={basket.id} basket={basket} products={products} lang={language} />
              ))}
            </div>
          )}
        </section>

        {/* Cart shortcut — shows when items added */}
        {totalItems > 0 && (
          <section className="px-4 pb-24 max-w-xl mx-auto text-center">
            <Link to="/cart"
              className="flex items-center justify-center gap-3 w-full rounded-2xl py-4 text-sm font-extrabold text-white"
              style={{ background: "linear-gradient(135deg,#2E8B57,#1a5c38)", border: "1px solid rgba(46,139,87,0.5)", boxShadow: "0 4px 24px rgba(46,139,87,0.3)" }}>
              🛒
              {l === "ar"
                ? `عرض سلتي · ${totalItems} منتج`
                : l === "fr"
                ? `Voir mon panier · ${totalItems} article${totalItems > 1 ? "s" : ""}`
                : `View cart · ${totalItems} item${totalItems > 1 ? "s" : ""}`}
              →
            </Link>
          </section>
        )}

      </main>

      {/* Breadcrumb */}
      <nav aria-label="Fil d ariane" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2 rounded-full text-xs border border-green-800/30"
        style={{ background: "rgba(6,26,18,0.92)", backdropFilter: "blur(12px)" }}>
        <Link to="/"     className="text-green-400 font-semibold hover:text-green-300">GreenGo</Link>
        <span className="text-white/25">/</span>
        <span className="text-green-300 font-semibold">
          {l === "ar" ? "السلات الجاهزة" : l === "fr" ? "Paniers" : "Baskets"}
        </span>
      </nav>
    </div>
  );
}
