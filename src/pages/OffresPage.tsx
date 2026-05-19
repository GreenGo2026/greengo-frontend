// src/pages/OffresPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SocialProofStrip from "../components/ui/SocialProofStrip";
import { useLanguage } from "../contexts/LanguageContext";
import { useCartStore, getUnitStep } from "../store/cartStore";

type L = "fr" | "ar" | "en";

interface Deal {
  id:           string;
  emoji:        string;
  name:         Record<L, string>;
  category:     Record<L, string>;
  originalPrice: number;
  dealPrice:    number;
  unit:         string;
  stockTotal:   number;
  stockLeft:    number;
  expiresAt:    Date;
  badge:        Record<L, string>;
  hot:          boolean;
}

// ── Static deals — replace with API call when backend supports it ─────────────
const BASE_TIME = new Date();
const h = (n: number) => new Date(BASE_TIME.getTime() + n * 3600000);

const DEALS: Deal[] = [
  {
    id: "tomate-flash",
    emoji: "🍅",
    name:          { fr:"Tomate Fraîche", ar:"طماطم طازجة",    en:"Fresh Tomato"     },
    category:      { fr:"Légumes",        ar:"خضروات",          en:"Vegetables"       },
    originalPrice: 8,  dealPrice: 5,  unit:"kg",
    stockTotal: 50, stockLeft: 12, expiresAt: h(2),
    badge: { fr:"Flash -38%", ar:"خصم 38%", en:"Flash -38%" }, hot: true,
  },
  {
    id: "poulet-semaine",
    emoji: "🍗",
    name:          { fr:"Poulet Entier",  ar:"دجاجة كاملة",    en:"Whole Chicken"    },
    category:      { fr:"Viandes",        ar:"اللحوم",          en:"Meats"            },
    originalPrice: 45, dealPrice: 35, unit:"pièce",
    stockTotal: 20, stockLeft: 7,  expiresAt: h(5),
    badge: { fr:"Promo -22%", ar:"تخفيض 22%", en:"Promo -22%" }, hot: true,
  },
  {
    id: "banane-lot",
    emoji: "🍌",
    name:          { fr:"Bananes (lot 3kg)", ar:"موز (3 كيلو)", en:"Bananas (3kg lot)" },
    category:      { fr:"Fruits",          ar:"فواكه",          en:"Fruits"            },
    originalPrice: 30, dealPrice: 22, unit:"lot",
    stockTotal: 30, stockLeft: 18, expiresAt: h(8),
    badge: { fr:"Eco -27%", ar:"وفر 27%", en:"Save -27%" }, hot: false,
  },
  {
    id: "oeufs-plateau",
    emoji: "🥚",
    name:          { fr:"Oeufs Beldi (30)",  ar:"بيض بلدي (30)", en:"Farm Eggs (30)"  },
    category:      { fr:"Oeufs",             ar:"بيض",           en:"Eggs"             },
    originalPrice: 55, dealPrice: 42, unit:"plateau",
    stockTotal: 15, stockLeft: 4,  expiresAt: h(1),
    badge: { fr:"Urgent -24%", ar:"عاجل 24%", en:"Urgent -24%" }, hot: true,
  },
];

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(expiresAt: Date) {
  const calc = () => {
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return { h:0, m:0, s:0, expired:true };
    const s = Math.floor(diff / 1000);
    return { h: Math.floor(s/3600), m: Math.floor((s%3600)/60), s: s%60, expired:false };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return time;
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// ── Stock bar ────────────────────────────────────────────────────────────────
function StockBar({ total, left, lang }: { total:number; left:number; lang:string }) {
  const l = lang as L;
  const pct = Math.round((left / total) * 100);
  const color = pct < 30 ? "#ef4444" : pct < 60 ? "#f59e0b" : "#22c55e";
  const label = { fr:`${left} restants`, ar:`${left} متبقية`, en:`${left} left` };
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color }} className="font-bold">{label[l]}</span>
        <span className="text-white/30">{total} {l==="ar"?"إجمالاً":l==="fr"?"au total":"total"}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Deal Card ────────────────────────────────────────────────────────────────
function DealCard({ deal, lang }: { deal: Deal; lang: string }) {
  const l        = lang as L;
  const time     = useCountdown(deal.expiresAt);
  const addToCart = useCartStore(s => s.addToCart);
  const cart      = useCartStore(s => s.cart);
  const step      = getUnitStep(deal.unit);
  const inCart    = cart.find(i => i.name === deal.name.fr);
  const discount  = Math.round((1 - deal.dealPrice / deal.originalPrice) * 100);
  const urgent    = (deal.stockLeft / deal.stockTotal) < 0.3;

  function handleAdd() {
    addToCart({
      name:           deal.name.fr,
      price_per_unit: deal.dealPrice,
      unit:           deal.unit,
      available:      true,
    }, step);
  }

  return (
    <article className={`relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
      urgent
        ? "border-red-700/40 bg-gradient-to-br from-red-900/10 to-black/20 hover:shadow-red-900/20"
        : deal.hot
        ? "border-amber-700/35 bg-gradient-to-br from-amber-900/10 to-black/20 hover:shadow-amber-900/20"
        : "border-white/10 bg-white/[0.03] hover:shadow-black/30"
    }`}>

      {/* Hot badge */}
      {deal.hot && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 shadow-lg">
          <span className="text-[10px]">🔥</span>
          <span className="text-[10px] font-black text-white">{deal.badge[l]}</span>
        </div>
      )}

      {/* Discount bubble */}
      <div className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-600/40 border border-green-400/30">
        <span className="text-[10px] font-black text-white">-{discount}%</span>
      </div>

      {/* Emoji hero */}
      <div className={`flex items-center justify-center py-8 text-7xl ${
        urgent ? "bg-red-900/10" : deal.hot ? "bg-amber-900/10" : "bg-white/[0.02]"
      }`}>
        {deal.emoji}
      </div>

      <div className="p-4">
        {/* Category */}
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1">{deal.category[l]}</p>

        {/* Name */}
        <h3 className="text-white font-black text-base leading-tight mb-3">{deal.name[l]}</h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-black text-green-400 font-latin">{deal.dealPrice.toFixed(2)}</span>
          <span className="text-xs text-white/40 font-latin">MAD/{deal.unit}</span>
          <span className="text-xs text-white/25 line-through font-latin ml-auto">{deal.originalPrice.toFixed(2)} MAD</span>
        </div>

        {/* Countdown */}
        {!time.expired ? (
          <div className={`flex items-center gap-1.5 rounded-xl p-2.5 mb-3 ${
            time.h === 0 && time.m < 30 ? "bg-red-900/20 border border-red-700/30" : "bg-white/[0.04] border border-white/8"
          }`}>
            <span className="text-xs">⏱️</span>
            <span className={`text-xs font-bold font-latin ${time.h === 0 && time.m < 30 ? "text-red-400" : "text-white/60"}`}>
              {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
            </span>
            <span className="text-[10px] text-white/30 ml-1">
              {l==="ar"?"متبقي":l==="fr"?"restant":"left"}
            </span>
          </div>
        ) : (
          <div className="rounded-xl p-2.5 mb-3 bg-red-900/20 border border-red-700/30 text-center">
            <span className="text-xs font-bold text-red-400">{l==="ar"?"انتهت المدة":l==="fr"?"Offre expirée":"Deal expired"}</span>
          </div>
        )}

        {/* Stock bar */}
        <StockBar total={deal.stockTotal} left={deal.stockLeft} lang={lang} />

        {/* CTA */}
        <button
          onClick={handleAdd}
          disabled={time.expired}
          className={`mt-4 w-full rounded-xl py-3.5 text-sm font-extrabold text-white transition-all active:scale-[0.97] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed ${
            inCart
              ? "bg-green-700/50 border border-green-600/40"
              : "bg-gradient-to-r from-green-700 to-green-900 border border-green-600/50 hover:opacity-90 shadow-lg shadow-green-900/30"
          }`}
        >
          {inCart
            ? (l==="ar"?"✓ في السلة":l==="fr"?"✓ Dans le panier":"✓ In cart")
            : (l==="ar"?"أضف للسلة 🛒":l==="fr"?"Ajouter au panier 🛒":"Add to cart 🛒")}
        </button>
      </div>
    </article>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OffresPage() {
  const { language, isRTL } = useLanguage();
  const l = language as L;
  const [filter, setFilter] = useState<"all"|"hot"|"urgent">("all");

  const filtered = DEALS.filter(d => {
    if (filter === "hot")    return d.hot;
    if (filter === "urgent") return (d.stockLeft / d.stockTotal) < 0.3;
    return true;
  });

  const FILTERS: { key:typeof filter; label:Record<L,string>; emoji:string }[] = [
    { key:"all",    emoji:"✨", label:{ fr:"Toutes les offres", ar:"كل العروض",   en:"All deals"    } },
    { key:"hot",    emoji:"🔥", label:{ fr:"Offres flash",      ar:"عروض سريعة",  en:"Flash deals"  } },
    { key:"urgent", emoji:"⚡", label:{ fr:"Stock critique",    ar:"مخزون محدود", en:"Low stock"    } },
  ];

  return (
    <div className={language==="ar"?"font-arabic":"font-latin"} dir={isRTL?"rtl":"ltr"}
      style={{ minHeight:"100vh", background:"linear-gradient(160deg,#031409 0%,#061a12 40%,#0a2318 100%)" }}>
      <main>
        <SocialProofStrip />

        {/* Hero */}
        <section aria-label="Offres flash GreenGo Market" className="relative overflow-hidden px-6 py-14 text-center">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background:"radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,146,60,0.12) 0%, transparent 60%)" }} />
          <div className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-900/20 border border-orange-700/30 rounded-full px-4 py-1.5 mb-5">
              <span className="animate-pulse">🔥</span>
              <span className="text-[11px] font-bold tracking-widest uppercase text-orange-300">
                {l==="ar"?"عروض اليوم · GreenGo Market":l==="fr"?"Offres du jour · GreenGo Market":"Today's Deals · GreenGo Market"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
              {l==="ar"?"عروض":l==="fr"?"Offres":"Flash"}<br/>
              <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                {l==="ar"?"حصرية اليوم":l==="fr"?"Flash du Jour":"Deals Today"}
              </span>
            </h1>
            <div className="h-0.5 w-24 mx-auto my-4 bg-gradient-to-r from-orange-500 to-green-600" />
            <p className="text-white/45 text-base leading-relaxed max-w-md mx-auto font-light">
              {l==="ar"?"أسعار مخفضة لفترة محدودة — اطلب قبل نفاد المخزون"
                :l==="fr"?"Prix réduits pour une durée limitée — commandez avant rupture de stock"
                :"Reduced prices for a limited time — order before stock runs out"}
            </p>

            {/* Live order count */}
            <div className="mt-6 inline-flex items-center gap-2 bg-green-900/20 border border-green-700/25 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-green-300">
                {l==="ar"?"23 طلبية اليوم في سلا والرباط"
                  :l==="fr"?"23 commandes passées aujourd'hui à Salé et Rabat"
                  :"23 orders placed today in Salé and Rabat"}
              </span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section aria-label="Filtres offres" className="px-6 mb-8 max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all ${
                  filter === f.key
                    ? "bg-orange-700/30 border-orange-600/50 text-orange-300"
                    : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}>
                <span>{f.emoji}</span>{f.label[l]}
                {f.key === "all" && <span className="ml-1 bg-white/10 rounded-full px-1.5 text-[10px]">{DEALS.length}</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Deals grid */}
        <section aria-label="Grille offres flash" className="px-6 pb-8 max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-4">😴</span>
              <p className="text-white/40 text-sm">{l==="ar"?"لا توجد عروض حالياً":l==="fr"?"Aucune offre pour ce filtre":"No deals for this filter"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map(deal => <DealCard key={deal.id} deal={deal} lang={language} />)}
            </div>
          )}
        </section>

        {/* CTA strip */}
        <section aria-label="Commander maintenant" className="px-6 pb-24 max-w-xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-900/15 to-green-900/10 border border-orange-700/20 rounded-3xl p-8">
            <span className="text-4xl block mb-3">🛒</span>
            <h2 className="text-lg font-black text-white mb-2">
              {l==="ar"?"جاهز للطلب؟":l==="fr"?"Prêt à commander ?":"Ready to order?"}
            </h2>
            <p className="text-white/45 text-sm mb-5">
              {l==="ar"?"أضف المنتجات للسلة وأكد طلبيتك الآن"
                :l==="fr"?"Ajoutez les produits au panier et confirmez maintenant"
                :"Add products to cart and confirm your order now"}
            </p>
            <Link to="/cart"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-700 to-green-900 border border-green-600/50 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-green-900/30">
              {l==="ar"?"عرض سلتي":l==="fr"?"Voir mon panier":"View my cart"} →
            </Link>
          </div>
        </section>
      </main>

      {/* Breadcrumb */}
      <nav aria-label="Fil ariane" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2 rounded-full text-xs border border-amber-800/20"
        style={{ background:"rgba(6,26,18,0.88)", backdropFilter:"blur(12px)" }}>
        <Link to="/" className="text-green-400 font-semibold">GreenGo</Link>
        <span className="text-white/25">/</span>
        <span className="text-orange-400 font-semibold">{l==="ar"?"العروض":l==="fr"?"Offres":"Deals"}</span>
      </nav>
    </div>
  );
}
