// src/pages/Legal/LivraisonPage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";

const GREEN  = "#2E8B57";
const GOLD   = "#C9A96E";
const DARK   = "#0c3228";

const ZONES = [
  { city: "Sale", ar: "\u0633\u0644\u0627", areas: "Laayayda, Hay Salam, Tabriquet, Bettana, Hay Karima", time: "< 1h" },
  { city: "Rabat", ar: "\u0627\u0644\u0631\u0628\u0627\u0637", areas: "Agdal, Hassan, Les Orangers, Hay Riad, Diour Jamaa", time: "30 min" },
  { city: "Temara", ar: "\u062a\u0645\u0627\u0631\u0629", areas: "Centre-ville, Ouled Mtaa", time: "< 2h30" },
];

const STEPS = [
  { n: "1", icon: "\ud83d\uded2", title: "Ajoutez vos produits", body: "Parcourez notre catalogue et ajoutez vos produits frais au panier en quelques clics." },
  { n: "2", icon: "\ud83d\udcdd", title: "Confirmez votre commande", body: "Remplissez le formulaire avec votre adresse et choisissez votre mode de paiement (especes ou carte)." },
  { n: "3", icon: "\ud83d\udcac", title: "Confirmation WhatsApp", body: "Notre equipe confirme votre commande sur WhatsApp dans les 30 minutes et vous donne l'heure de livraison." },
  { n: "4", icon: "\u26a1", title: "Livraison a domicile", body: "Votre commande arrive fraiche a votre porte en 30 minutes a Sale et Rabat." },
];

export default function LivraisonPage() {
  const { language, isRTL } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";
  const dir  = isRTL ? "rtl" : "ltr";

  return (
    <div className={font} dir={dir} style={{ background: "#FAF7F2", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,${GREEN} 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>
            {language === "ar" ? "\u0633\u0644\u0627 \u0648 \u0627\u0644\u0631\u0628\u0627\u0637" : "Sale & Rabat"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>
            {language === "ar" ? "\u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0625\u0644\u0649 \u0628\u0627\u0628\u0643" : "Livraison a votre porte"}
          </h1>
          <p className="text-white/60 mt-3 text-base max-w-lg mx-auto">
            {language === "ar"
              ? "\u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639 \u0641\u064a \u0633\u0644\u0627 \u0648\u0627\u0644\u0631\u0628\u0627\u0637 \u0641\u064a 30 \u062f\u0642\u064a\u0642\u0629 \u2014 \u0637\u0627\u0632\u062c \u0643\u0644 \u064a\u0648\u0645 \u0645\u0646 \u0627\u0644\u0633\u0627\u0639\u0629 8 \u0625\u0644\u0649 20"
              : "Produits frais livres en 30 minutes — 7j/7 de 8h a 20h"}
          </p>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto">
            {[
              { v: "30 min", l: language === "ar" ? "\u062a\u0648\u0635\u064a\u0644" : "Livraison" },
              { v: "7j/7", l: language === "ar" ? "\u0643\u0644 \u064a\u0648\u0645" : "Disponible" },
              { v: "100%", l: language === "ar" ? "\u0637\u0627\u0632\u062c" : "Frais garanti" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl py-4 px-3 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                <p className="text-2xl font-black text-white font-latin">{s.v}</p>
                <p className="text-[11px] text-white/50 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="zellige-border" />
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Zones */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">\ud83d\udccd</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {language === "ar" ? "\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u062a\u0648\u0635\u064a\u0644" : "Zones de livraison"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ZONES.map((z, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-base">{z.city}</h3>
                    <p className="text-xs text-gray-400 font-arabic">{z.ar}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-black text-white"
                    style={{ background: GREEN }}>{z.time}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{z.areas}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "#fff8e6", border: `1px solid ${GOLD}40` }}>
            <span className="text-lg shrink-0">\u26a0\ufe0f</span>
            <p className="text-sm text-amber-800">
              {language === "ar"
                ? "\u0646\u0648\u0635\u0644 \u062d\u0627\u0644\u064a\u0627\u064b \u0641\u0642\u0637 \u0625\u0644\u0649 \u0633\u0644\u0627 \u0648\u0627\u0644\u0631\u0628\u0627\u0637 \u0648 \u062a\u0645\u0627\u0631\u0629. \u0625\u0630\u0627 \u0643\u0646\u062a \u062e\u0627\u0631\u062c \u0647\u0630\u0647 \u0627\u0644\u0645\u0646\u0627\u0637\u0642\u060c \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u0642\u0628\u0644 \u0627\u0644\u0637\u0644\u0628."
                : "Nous livrons actuellement a Sale, Rabat et Temara uniquement. Si vous etes hors zone, contactez-nous sur WhatsApp avant de commander."}
            </p>
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">\ud83d\ude9a</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {language === "ar" ? "\u0643\u064a\u0641 \u062a\u0639\u0645\u0644 \u0627\u0644\u062e\u062f\u0645\u0629" : "Comment ca marche ?"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl font-black text-white"
                  style={{ background: `linear-gradient(135deg,${DARK},${GREEN})`, minWidth: 40 }}>
                  {s.n}
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-sm mb-1">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">\ud83d\udcb0</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
              {language === "ar" ? "\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644" : "Frais de livraison"}
            </h2>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {[
              { label: language === "ar" ? "\u0645\u0646\u0637\u0642\u0629 \u0633\u0644\u0627 (Laayayda)" : "Zone Sale (Laayayda)", price: language === "ar" ? "\u0627\u0633\u0623\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Nous contacter" },
              { label: language === "ar" ? "\u0633\u0644\u0627 \u2014 \u0623\u062d\u064a\u0627\u0621 \u0623\u062e\u0631\u0649" : "Sale — autres quartiers", price: language === "ar" ? "\u0627\u0633\u0623\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Nous contacter" },
              { label: language === "ar" ? "\u0627\u0644\u0631\u0628\u0627\u0637" : "Rabat", price: language === "ar" ? "\u0627\u0633\u0623\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Nous contacter" },
              { label: language === "ar" ? "\u062a\u0645\u0627\u0631\u0629" : "Temara", price: language === "ar" ? "\u0627\u0633\u0623\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Nous contacter" },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                <span className="text-sm text-gray-700 font-semibold">{row.label}</span>
                <a href="https://wa.me/212664500789" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                  style={{ background: "#f0fdf4", color: GREEN, border: `1px solid #bbf7d0` }}>
                  {row.price}
                </a>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {language === "ar"
              ? "\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u062a\u062e\u062a\u0644\u0641 \u062d\u0633\u0628 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0648\u062d\u062c\u0645 \u0627\u0644\u0637\u0644\u0628. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0644\u0644\u062a\u0641\u0627\u0635\u064a\u0644."
              : "Les frais varient selon votre adresse et le montant de la commande. Contactez-nous pour un devis precis."}
          </p>
        </section>

        {/* CTA */}
        <section className="rounded-3xl p-8 text-center text-white"
          style={{ background: `linear-gradient(135deg,#0d3b36,${GREEN})` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, fontStyle: "italic", marginBottom: "0.5rem" }}>
            {language === "ar" ? "\u062c\u0627\u0647\u0632 \u0644\u0644\u0637\u0644\u0628\u061f" : "Pret a commander ?"}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {language === "ar"
              ? "\u0623\u0636\u0641 \u0645\u0646\u062a\u062c\u0627\u062a\u0643 \u0648\u0627\u062d\u0635\u0644 \u0639\u0644\u0649 \u062a\u0648\u0635\u064a\u0644 \u0633\u0631\u064a\u0639"
              : "Ajoutez vos produits et recevez-les frais a domicile"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/shop"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold transition-all hover:scale-105"
              style={{ background: GOLD, color: "#fff" }}>
              {language === "ar" ? "\u062a\u0633\u0648\u0642 \u0627\u0644\u0622\u0646" : "Voir le catalogue"}
            </Link>
            <a href="https://wa.me/212664500789" target="_blank" rel="noopener noreferrer"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold border border-white/30 hover:bg-white/10 transition-all">
              {language === "ar" ? "\u062a\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Contacter sur WhatsApp"}
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
