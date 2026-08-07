// src/pages/GuidesIndexPage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSeo } from "../hooks/useSeo";

const GREEN = "#2E8B57";
const GOLD  = "#C9A96E";
const DARK  = "#0c3228";

const GUIDES = [
  {
    to: "/guide/miel-artisanal-maroc",
    emoji: "🍯",
    title_fr: "Le Miel Artisanal Marocain", title_ar: "العسل المغربي التقليدي",
    sub_fr:   "Guide complet des variétés", sub_ar:   "دليل شامل للأنواع",
    read_fr:  "7 min de lecture", read_ar: "7 دقائق قراءة",
  },
  {
    to: "/guide/huile-olive-marocaine",
    emoji: "🫒",
    title_fr: "L'Huile d'Olive Marocaine", title_ar: "زيت الزيتون المغربي",
    sub_fr:   "Guide complet", sub_ar:   "دليل شامل",
    read_fr:  "8 min de lecture", read_ar: "8 دقائق قراءة",
  },
  {
    to: "/guide/poulet-beldi",
    emoji: "🐓",
    title_fr: "Le Poulet Beldi Marocain", title_ar: "الدجاج البلدي المغربي",
    sub_fr:   "Guide complet", sub_ar:   "دليل شامل",
    read_fr:  "6 min de lecture", read_ar: "6 دقائق قراءة",
  },
];

export default function GuidesIndexPage() {
  const { language, isRTL } = useLanguage();
  const l    = language as "fr" | "ar" | "en";
  const font = l === "ar" ? "font-arabic" : "font-latin";

  useSeo({
    title: "Guides produits — GreenGo Market",
    description: "Nos guides pour tout savoir sur le miel artisanal, l'huile d'olive et le poulet beldi marocains : origine, qualité, comment bien choisir.",
  });

  return (
    <div className={font} dir={isRTL ? "rtl" : "ltr"} style={{ background: "#FAF7F2", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,${GREEN} 100%)` }}>
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>
            {l === "ar" ? "الأدلة" : "Guides produits"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>
            {l === "ar" ? "تعرف على منتجاتنا" : "Apprenez à connaître nos produits"}
          </h1>
          <p className="text-white/50 mt-3 text-sm max-w-md mx-auto">
            {l === "ar"
              ? "أدلة مفصلة حول أصل ومزايا وكيفية اختيار أفضل منتجاتنا"
              : "Origine, qualité, comment bien choisir — tout ce qu'il faut savoir sur nos produits phares"}
          </p>
        </div>
        <div className="zellige-border" />
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {GUIDES.map((g) => (
            <Link key={g.to} to={g.to}
              className="flex flex-col items-center text-center rounded-2xl bg-white border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-5xl mb-4">{g.emoji}</span>
              <h2 className="font-bold text-sm" style={{ color: DARK }}>
                {l === "ar" ? g.title_ar : g.title_fr}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {l === "ar" ? g.sub_ar : g.sub_fr}
              </p>
              <p className="text-[10px] text-gray-300 mt-3 font-latin">
                {l === "ar" ? g.read_ar : g.read_fr}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
