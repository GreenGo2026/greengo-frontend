// src/pages/LivraisonSalePage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSeo, useJsonLd } from "../hooks/useSeo";
import TestimonialsSection, { type Testimonial } from "../components/TestimonialsSection";

const GREEN = "#2E8B57";
const GOLD  = "#C9A96E";
const DARK  = "#0c3228";

const NEIGHBORHOODS = ["Laayayda", "Tabriquet", "Hay Salam", "Bettana", "Hay Karima"];

const TOP_PRODUCTS = [
  { emoji: "🥬", fr: "Légumes frais",   ar: "خضروات طازجة" },
  { emoji: "🍎", fr: "Fruits de saison", ar: "فواكه الموسم" },
  { emoji: "🐓", fr: "Poulet Beldi",     ar: "دجاج بلدي" },
  { emoji: "🍯", fr: "Miel & Amlou",     ar: "عسل وأملو" },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Amina",
    neighborhood: "Tabriquet, Salé",
    text: "شكرا وصل داكشي مزيان، أملو غزال تبارك الله الوليدات عجبهم.",
    rating: 5,
    product: "Pack petit-déjeuner Amlou + Miel"
  },
  {
    id: 2,
    name: "Khadija",
    neighborhood: "Hay Salam, Salé",
    text: "Merci bzaaf kounte mzrouba w 3t9touni, raw3a.",
    rating: 5,
    product: "Panier fruits de saison"
  }
];

export default function LivraisonSalePage() {
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";
  const font = ar ? "font-arabic" : "font-latin";
  const dir = isRTL ? "rtl" : "ltr";

  useSeo({
    title: "Livraison Épicerie Salé en 30 min | GreenGo Market",
    description: "Épicerie fraîche livrée en 30 minutes à Salé. Légumes, fruits, volailles, miel. Laayayda, Tabriquet, Hay Salam, Bettana, Hay Karima. 7j/7 de 8h à 21h.",
  });

  useJsonLd("livraison-sale-ld", {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "GreenGo Market — Livraison Salé",
    description: "Épicerie fraîche livrée en 30 minutes à Salé, quartiers Laayayda, Tabriquet, Hay Salam, Bettana, Hay Karima.",
    url: "https://www.mygreengoo.com/livraison-sale",
    telephone: "+212664500789",
    address: { "@type": "PostalAddress", addressLocality: "Salé", addressRegion: "Rabat-Salé-Kénitra", addressCountry: "MA" },
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
            {ar ? "سلا" : "Salé"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>
            {ar ? "توصيل إلى سلا في 30 دقيقة" : "Livraison Épicerie Salé en 30 min"}
          </h1>
          <p className="text-white/60 mt-3 text-base max-w-lg mx-auto">
            {ar
              ? "خضر وفواكه طازجة، دجاج بلدي وعسل — توصيل سريع في سلا، 7 أيام في الأسبوع من 8ص إلى 9م"
              : "Légumes, fruits, volailles et miel — livrés frais dans tout Salé, 7j/7 de 8h à 21h"}
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

        {/* Testimonials from Salé */}
        <TestimonialsSection testimonials={TESTIMONIALS} />

        {/* CTA */}
        <section className="rounded-3xl p-8 text-center text-white" style={{ background: `linear-gradient(135deg,#0d3b36,${GREEN})` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, fontStyle: "italic", marginBottom: "0.5rem" }}>
            {ar ? "جاهز للطلب من سلا؟" : "Prêt à commander depuis Salé ?"}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link to="/shop" className="rounded-2xl px-6 py-3 text-sm font-extrabold transition-all hover:scale-105" style={{ background: GOLD, color: "#fff" }}>
              {ar ? "تسوق الآن" : "Voir le catalogue"}
            </Link>
            <a href="https://wa.me/212664500789" target="_blank" rel="noopener noreferrer"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold border border-white/30 hover:bg-white/10 transition-all">
              {ar ? "تواصل عبر واتساب" : "Commander sur WhatsApp"}
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
