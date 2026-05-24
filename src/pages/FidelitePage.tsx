// src/pages/FidelitePage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { Star, Truck, Gift, Zap, Crown, ShoppingCart } from "lucide-react";

const GREEN = "#2E8B57";
const GOLD  = "#C9A96E";
const DARK  = "#0c3228";

const TIERS = [
  {
    name_fr: "Vert",      name_ar: "\u0623\u062e\u0636\u0631",
    min: 0,   max: 99,
    color: GREEN, bg: "#f0fdf4", border: "#bbf7d0",
    perks_fr: ["10 MAD = 1 point", "Offres membres exclusives", "Support WhatsApp prioritaire"],
    perks_ar: ["10 \u062f\u0631\u0647\u0645 = 1 \u0646\u0642\u0637\u0629", "\u0639\u0631\u0648\u0636 \u062d\u0635\u0631\u064a\u0629", "\u062f\u0639\u0645 \u0648\u0627\u062a\u0633\u0627\u0628 \u0645\u062c\u0627\u0646\u064a"],
  },
  {
    name_fr: "Or",        name_ar: "\u0630\u0647\u0628\u064a",
    min: 100, max: 499,
    color: GOLD,  bg: "#fdf8ef", border: "#f2ddb4",
    perks_fr: ["Tout le niveau Vert", "100 pts = 10 MAD de remise", "Livraison offerte au-dessus de 100 MAD"],
    perks_ar: ["\u0643\u0644 \u0645\u0632\u0627\u064a\u0627 \u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0623\u062e\u0636\u0631", "100 \u0646\u0642\u0637\u0629 = 10 \u062f\u0631\u0627\u0647\u0645 \u062e\u0635\u0645", "\u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a \u0641\u0648\u0642 100 \u062f\u0631\u0647\u0645"],
  },
  {
    name_fr: "VIP",       name_ar: "VIP",
    min: 500, max: null,
    color: "#7B1FA2", bg: "#f5f3ff", border: "#ddd6fe",
    perks_fr: ["Tout le niveau Or", "Livraison gratuite illimitee", "Acces prioritaire nouveautes", "Emballage premium offert", "Offre anniversaire speciale"],
    perks_ar: ["\u0643\u0644 \u0645\u0632\u0627\u064a\u0627 \u0627\u0644\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0630\u0647\u0628\u064a", "\u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f", "\u0648\u0635\u0648\u0644 \u0623\u0648\u0644\u0648\u064a \u0644\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u062c\u062f\u064a\u062f\u0629", "\u062a\u063a\u0644\u064a\u0641 \u0628\u0631\u064a\u0645\u064a\u0648\u0645 \u0645\u062c\u0627\u0646\u064a", "\u0639\u0631\u0636 \u0639\u064a\u062f \u0645\u064a\u0644\u0627\u062f \u062e\u0627\u0635"],
  },
];

const STEPS = [
  { n:"1", icon: ShoppingCart, color: GREEN,
    title_fr:"Commandez",          title_ar:"\u0627\u0637\u0644\u0628",
    body_fr: "Passez votre commande sur mygreengoo.com ou via WhatsApp. Chaque dirham compte.",
    body_ar: "\u0627\u0637\u0644\u0628 \u0639\u0628\u0631 \u0645\u0648\u0642\u0639\u0646\u0627 \u0623\u0648 \u0648\u0627\u062a\u0633\u0627\u0628. \u0643\u0644 \u062f\u0631\u0647\u0645 \u064a\u062d\u0633\u0628.",
  },
  { n:"2", icon: Star, color: GOLD,
    title_fr:"Cumulez des points",  title_ar:"\u0627\u062c\u0645\u0639 \u0627\u0644\u0646\u0642\u0627\u0637",
    body_fr: "10 MAD depenses = 1 point GreenGo credite automatiquement sur votre compte.",
    body_ar: "10 \u062f\u0631\u0627\u0647\u0645 = 1 \u0646\u0642\u0637\u0629 GreenGo \u062a\u0636\u0627\u0641 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0625\u0644\u0649 \u062d\u0633\u0627\u0628\u0643.",
  },
  { n:"3", icon: Gift, color: "#e11d48",
    title_fr:"Echangez vos points", title_ar:"\u0627\u0633\u062a\u0628\u062f\u0644 \u0646\u0642\u0627\u0637\u0643",
    body_fr: "100 points = 10 MAD de remise sur votre prochaine commande. Simple et automatique.",
    body_ar: "100 \u0646\u0642\u0637\u0629 = 10 \u062f\u0631\u0627\u0647\u0645 \u062e\u0635\u0645 \u0639\u0644\u0649 \u0637\u0644\u0628\u062a\u0643 \u0627\u0644\u0642\u0627\u062f\u0645\u0629.",
  },
  { n:"4", icon: Crown, color: "#7B1FA2",
    title_fr:"Devenez VIP",         title_ar:"\u0627\u0631\u062a\u0642 \u0625\u0644\u0649 VIP",
    body_fr: "500 points et vous accoedez au statut VIP avec livraison gratuite et offres exclusives.",
    body_ar: "500 \u0646\u0642\u0637\u0629 \u0648\u062a\u062d\u0635\u0644 \u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 VIP \u0645\u0639 \u062a\u0648\u0635\u064a\u0644 \u0645\u062c\u0627\u0646\u064a \u0648\u0639\u0631\u0648\u0636 \u062d\u0635\u0631\u064a\u0629.",
  },
];

export default function FidelitePage() {
  const { language, isRTL } = useLanguage();
  const l    = language as "fr" | "ar" | "en";
  const font = l === "ar" ? "font-arabic" : "font-latin";

  return (
    <div className={font} dir={isRTL ? "rtl" : "ltr"} style={{ background: "#FAF7F2", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{ background: `linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,${GREEN} 100%)` }}>
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>
            <Star size={11} className="fill-current" />
            {l === "ar" ? "\u0628\u0631\u0646\u0627\u0645\u062c \u0627\u0644\u0648\u0644\u0627\u0621" : "Programme de fidelite"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>
            {l === "ar" ? "\u0628\u0631\u0646\u0627\u0645\u062c \u0648\u0644\u0627\u0621 GreenGo" : "Fidelite GreenGo"}
          </h1>
          <p className="text-white/60 mt-3 text-base max-w-lg mx-auto">
            {l === "ar"
              ? "\u0627\u0637\u0644\u0628\u060c \u0627\u062c\u0645\u0639 \u0627\u0644\u0646\u0642\u0627\u0637 \u0648\u0627\u0633\u062a\u0645\u062a\u0639 \u0628\u0645\u0643\u0627\u0641\u0622\u062a \u062d\u0635\u0631\u064a\u0629 \u0645\u0639 \u0643\u0644 \u062a\u0648\u0635\u064a\u0644"
              : "Commandez, cumulez des points et profitez de recompenses exclusives a chaque livraison."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link to="/shop"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: GOLD, boxShadow: `0 4px 16px ${GOLD}40` }}>
              {l === "ar" ? "\u0627\u0628\u062f\u0623 \u0627\u0644\u0622\u0646" : "Commencer a gagner"}
            </Link>
            <Link to="/profile/user"
              className="rounded-2xl px-6 py-3 text-sm font-bold border border-white/30 text-white hover:bg-white/10 transition-all">
              {l === "ar" ? "\u0631\u0635\u064a\u062f \u0646\u0642\u0627\u0637\u064a" : "Voir mon solde"}
            </Link>
          </div>
        </div>
        <div className="zellige-border" />
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">

        {/* ── How it works ── */}
        <section>
          <div className="text-center mb-8">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {l === "ar" ? "\u0643\u064a\u0641 \u064a\u0639\u0645\u0644 \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062c\u061f" : "Comment ca marche ?"}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {l === "ar" ? "\u0628\u0633\u064a\u0637\u060c \u062a\u0644\u0642\u0627\u0626\u064a\u060c \u0648\u0645\u062c\u0632\u064d" : "Simple, automatique et recompensant."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-start gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: `linear-gradient(135deg,${s.color}dd,${s.color})`, minWidth: 44 }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800 text-sm mb-1">
                      {l === "ar" ? s.title_ar : s.title_fr}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {l === "ar" ? s.body_ar : s.body_fr}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Tiers ── */}
        <section>
          <div className="text-center mb-8">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {l === "ar" ? "\u0645\u0633\u062a\u0648\u064a\u0627\u062a \u0627\u0644\u0639\u0636\u0648\u064a\u0629" : "Niveaux d'adhesion"}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {l === "ar" ? "\u0643\u0644\u0645\u0627 \u0637\u0644\u0628\u062a \u0623\u0643\u062b\u0631\u060c \u0643\u0644\u0645\u0627 \u0631\u0628\u062d\u062a \u0623\u0643\u062b\u0631" : "Plus vous commandez, plus vous gagnez."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TIERS.map((tier, i) => (
              <div key={i} className="rounded-2xl p-5 border-2 transition-all hover:shadow-lg"
                style={{ background: tier.bg, borderColor: tier.border }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: tier.color + "20" }}>
                    <Star size={16} style={{ color: tier.color }} className="fill-current" />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800">{l === "ar" ? tier.name_ar : tier.name_fr}</p>
                    <p className="text-[10px] font-bold font-latin" style={{ color: tier.color }}>
                      {tier.max ? `${tier.min}–${tier.max} pts` : `${tier.min}+ pts`}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {(l === "ar" ? tier.perks_ar : tier.perks_fr).map((perk, pi) => (
                    <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="mt-0.5 shrink-0" style={{ color: tier.color }}>✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Points calculator ── */}
        <section className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg,#fdf8ef,#f9efda)", border: `1px solid ${GOLD}30` }}>
          <div className="text-center mb-6">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {l === "ar" ? "\u0643\u0645 \u062a\u0631\u0628\u062d\u061f" : "Combien gagnez-vous ?"}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center max-w-lg mx-auto">
            {[
              { spend: "100 MAD",  pts: "10 pts",  save: "—" },
              { spend: "500 MAD",  pts: "50 pts",  save: "—" },
              { spend: "1000 MAD", pts: "100 pts", save: "10 MAD" },
            ].map((row, i) => (
              <div key={i} className="rounded-2xl bg-white border border-amber-100 shadow-sm p-4">
                <p className="text-base font-black text-gray-800 font-latin">{row.spend}</p>
                <p className="text-xs text-[#C9A96E] font-bold mt-1 font-latin">{row.pts}</p>
                {row.save !== "—" && (
                  <p className="text-[10px] text-green-600 font-bold mt-1 font-latin">= {row.save} offerts</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Check balance CTA ── */}
        <section className="rounded-3xl p-8 text-center text-white"
          style={{ background: `linear-gradient(135deg,#0d3b36,${GREEN})` }}>
          <Zap size={28} className="mx-auto mb-3 text-[#C9A96E]" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, fontStyle: "italic", marginBottom: "0.5rem" }}>
            {l === "ar" ? "\u0643\u0634\u0641 \u0631\u0635\u064a\u062f \u0646\u0642\u0627\u0637\u0643" : "Consultez votre solde"}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {l === "ar"
              ? "\u0633\u062c\u0644 \u0628\u0631\u0642\u0645 \u0647\u0627\u062a\u0641\u0643 \u0648\u0627\u0637\u0644\u0639 \u0639\u0644\u0649 \u0646\u0642\u0627\u0637\u0643 \u0648\u0637\u0644\u0628\u0627\u062a\u0643 \u0627\u0644\u0633\u0627\u0628\u0642\u0629"
              : "Connectez-vous avec votre telephone pour voir vos points et vos commandes"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/profile/user"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold transition-all hover:scale-105"
              style={{ background: GOLD }}>
              {l === "ar" ? "\u062d\u0633\u0627\u0628\u064a" : "Mon espace client"}
            </Link>
            <a href="https://wa.me/212664500789" target="_blank" rel="noopener noreferrer"
              className="rounded-2xl px-6 py-3 text-sm font-bold border border-white/30 hover:bg-white/10 transition-all">
              {l === "ar" ? "\u0627\u0633\u0623\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Demander via WhatsApp"}
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
