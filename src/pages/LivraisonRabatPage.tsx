// src/pages/LivraisonRabatPage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSeo, useJsonLd } from "../hooks/useSeo";
import TestimonialsSection, { type Testimonial } from "../components/TestimonialsSection";

const GREEN = "#2E8B57";
const GOLD  = "#C9A96E";
const DARK  = "#0c3228";

const NEIGHBORHOODS = ["Agdal", "Hassan", "Hay Riad", "Les Orangers", "Diour Jamaa"];

const TOP_PRODUCTS = [
  { emoji: "🥬", fr: "Légumes frais",   ar: "خضروات طازجة" },
  { emoji: "🍎", fr: "Fruits de saison", ar: "فواكه الموسم" },
  { emoji: "🐓", fr: "Poulet Beldi",     ar: "دجاج بلدي" },
  { emoji: "🍯", fr: "Miel & Amlou",     ar: "عسل وأملو" },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Youssef",
    neighborhood: "Hay Riad, Rabat",
    text: "تبارك الله عليكم، الخضرة نقية بزاف والتوصيل كان فعلا فقل من نص ساعة. شكراً.",
    rating: 5,
    product: "Panier légumes + Poulet Beldi"
  },
  {
    id: 2,
    name: "Mehdi",
    neighborhood: "Agdal, Rabat",
    text: "Dajaj n9i bzaf o mghsoul mzyan. Service top bon courage.",
    rating: 5,
    product: "Poulet Beldi + Épices"
  },
  {
    id: 3,
    name: "Tarik",
    neighborhood: "Hassan, Rabat",
    text: "الزيتون والزيت ديالكم ديال البلاد نيت. الله يعطيكم الصحة.",
    rating: 5,
    product: "Olives + Huile d'olive extra vierge"
  }
];

export default function LivraisonRabatPage() {
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";
  const font = ar ? "font-arabic" : "font-latin";
  const dir = isRTL ? "rtl" : "ltr";

  useSeo({
    title: "Livraison Épicerie Rabat en 30 min | GreenGo Market",
    description: "Épicerie fraîche livrée en 30 minutes à Rabat. Légumes, fruits, volailles, miel. Agdal, Hassan, Hay Riad, Les Orangers, Diour Jamaa. 7j/7 de 8h à 21h.",
  });

  useJsonLd("livraison-rabat-ld", {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "GreenGo Market — Livraison Rabat",
    description: "Épicerie fraîche livrée en 30 minutes à Rabat, quartiers Agdal, Hassan, Hay Riad, Les Orangers, Diour Jamaa.",
    url: "https://www.mygreengoo.com/livraison-rabat",
    telephone: "+212664500789",
    address: { "@type": "PostalAddress", addressLocality: "Rabat", addressRegion: "Rabat-Salé-Kénitra", addressCountry: "MA" },
    areaServed: NEIGHBORHOODS.map((n) => ({ "@type": "Place", name: n })),
    openingHoursSpecification: [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "21:00",
    }],
  });

  return (
    <div className={font} dir={dir} style={{ background: "#FAF7F2", minHeight: "100vh" }}>

      <section style={{ background: `linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,${GREEN} 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}
          >
            {ar ? "الرباط" : "Rabat"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>
            {ar ? "توصيل إلى الرباط في 30 دقيقة" : "Livraison Épicerie Rabat en 30 min"}
          </h1>
          <p className="text-white/60 mt-3 text-base max-w-lg mx-auto">
            {ar
              ? "خضر وفواكه طازجة، دجاج بلدي وعسل — توصيل سريع في الرباط، 7 أيام في الأسبوع من 8ص إلى 9م"
              : "Légumes, fruits, volailles et miel — livrés frais dans tout Rabat, 7j/7 de 8h à 21h"}
          </p>
        </div>
        <div className="zellige-border" />
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Neighborhoods */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📍</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {ar ? "الأحياء المخدومة" : "Quartiers couverts"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {NEIGHBORHOODS.map((n) => (
              <span key={n} className="rounded-full bg-white border border-gray-100 shadow-sm px-4 py-2 text-sm font-semibold text-gray-700">
                {n}
              </span>
            ))}
          </div>
        </section>

        {/* Top products */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🛒</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {ar ? "منتجاتنا الأكثر طلباً" : "Nos produits phares"}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TOP_PRODUCTS.map((p) => (
              <Link key={p.fr} to="/shop" className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-all">
                <div className="text-3xl mb-2">{p.emoji}</div>
                <p className="text-xs font-bold text-gray-700">{ar ? p.ar : p.fr}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Testimonials from Rabat */}
        <TestimonialsSection testimonials={TESTIMONIALS} />

        {/* CTA */}
        <section className="rounded-3xl p-8 text-center text-white" style={{ background: `linear-gradient(135deg,#0d3b36,${GREEN})` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, fontStyle: "italic", marginBottom: "0.5rem" }}>
            {ar ? "جاهز للطلب من الرباط؟" : "Prêt à commander depuis Rabat ?"}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link to="/shop" className="rounded-2xl px-6 py-3 text-sm font-extrabold transition-all hover:scale-105" style={{ background: GOLD, color: "#fff" }}>
              {ar ? "تسوق الآن" : "Voir le catalogue"}
            </Link>
            <a href="https://wa.me/212664397031" target="_blank" rel="noopener noreferrer"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold border border-white/30 hover:bg-white/10 transition-all">
              {ar ? "تواصل عبر واتساب" : "Commander sur WhatsApp"}
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
