// src/pages/PanierTypePage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCartStore } from "../store/cartStore";
import { getPaniers } from "../services/api";
import type { Panier } from "../services/api";

type L = "fr" | "ar" | "en";

// ── Presentation metadata ─────────────────────────────────────────────────────
// The `paniers` collection (shared with the admin editor in PaniersTab.tsx)
// only stores id/order/title/persons/accent/items/price/original_price -- no
// emoji, badge, subtitle or trilingual copy. That marketing dressing lives
// here, keyed by basket id, so editing a basket's items/persons/price in the
// admin panel stays live on this page without losing the richer public
// presentation.
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

// ── Basket Card ───────────────────────────────────────────────────────────────
// Pricing is admin-controlled only: basket.price is the single number
// customers see (no per-item calculation, no live catalog lookup). The whole
// pack is added to the cart as one line at that fixed price.
function BasketCard({ basket, lang }: { basket: Panier; lang: string }) {
  const l          = lang as L;
  const [open, setOpen]   = useState(false);
  const [added, setAdded] = useState(false);
  const addToCart  = useCartStore(s => s.addToCart);

  const presentation = PRESENTATION[basket.id] ?? DEFAULT_PRESENTATION;
  const hasDiscount  = !!(basket.original_price && basket.price && basket.original_price > basket.price);
  const discountPct  = hasDiscount ? Math.round((1 - basket.price! / basket.original_price!) * 100) : 0;

  function handleAddAll() {
    if (!basket.price) return; // no price set yet -- not orderable
    addToCart({
      name:           basket.title,
      price_per_unit: basket.price,
      unit:           "pack",
      available:      true,
    }, 1);
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

        {/* Items preview — names + quantities only, no per-item price */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {basket.items.map((item, i) => (
            <span key={i}
              className="flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold text-white/70"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {item.label}
              {item.qty > 1 && <span className="text-white/40 font-latin">×{item.qty}</span>}
            </span>
          ))}
        </div>

        {/* Pricing — admin-controlled only */}
        <div className={`flex items-center gap-3 mb-4 ${l === "ar" ? "flex-row-reverse" : ""}`}>
          <div>
            {basket.price ? (
              <>
                <div className={`flex items-baseline gap-1.5 ${l === "ar" ? "flex-row-reverse" : ""}`}>
                  <span className="text-4xl font-black text-white font-latin" style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.03em" }}>{basket.price.toFixed(0)}</span>
                  <span className="text-sm text-white/50 font-latin">MAD</span>
                </div>
                {hasDiscount && (
                  <div className={`flex items-center gap-2 ${l === "ar" ? "flex-row-reverse" : ""}`}>
                    <span className="text-sm text-white/30 line-through font-latin">{basket.original_price!.toFixed(0)} MAD</span>
                    <span className="text-xs font-bold rounded-full px-2 py-0.5"
                      style={{ background: `${basket.accent}25`, color: basket.accent }}>
                      -{discountPct}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm font-bold text-white/40 italic">
                {l === "ar" ? "السعر قريباً" : l === "fr" ? "Prix bientôt disponible" : "Price coming soon"}
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

        {/* Expanded items detail — still no per-item price, just the full list */}
        {open && (
          <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            {basket.items.map((item, i) => (
              <div key={i}
                className={`flex items-center justify-between px-3 py-2 text-xs ${i % 2 === 0 ? "bg-white/[0.03]" : ""} ${l === "ar" ? "flex-row-reverse" : ""}`}>
                <span className={"text-white/70 " + (l === "ar" ? "font-arabic" : "font-latin")}>
                  {item.label}
                </span>
                <span className="text-white/40 font-latin">{item.qty} {item.unit}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2">
          <button onClick={handleAddAll} disabled={!basket.price}
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

  const [baskets, setBaskets] = useState<Panier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPaniers()
      .then((paniersData) => {
        if (cancelled) return;
        const sorted = [...paniersData].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        setBaskets(sorted);
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
                ? "اختر سلتك الجاهزة وأضفها للسلة بنقرة واحدة."
                : l === "fr"
                ? "Choisissez votre panier et ajoutez-le en un clic."
                : "Choose your basket and add it in one click."}
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {[
                { e:"💰", fr:"Prix groupé avantageux", ar:"سعر مجمّع مميز",        en:"Bundle pricing"    },
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
                <BasketCard key={basket.id} basket={basket} lang={language} />
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
