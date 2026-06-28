// src/pages/Legal/FAQPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { ChevronDown } from "lucide-react";

const GREEN = "#2E8B57";
const GOLD  = "#C9A96E";
const DARK  = "#0c3228";

const FAQS = [
  {
    cat: "Commande",
    cat_ar: "\u0627\u0644\u0637\u0644\u0628",
    emoji: "\ud83d\uded2",
    items: [
      {
        q_fr: "Comment passer une commande ?",
        q_ar: "\u0643\u064a\u0641 \u0623\u0637\u0644\u0628\u061f",
        a_fr: "Parcourez notre catalogue sur /shop, ajoutez vos produits au panier, remplissez le formulaire avec votre nom, telephone et adresse, puis confirmez. Vous recevrez une confirmation WhatsApp en moins de 30 minutes.",
        a_ar: "\u062a\u0635\u0641\u062d \u0643\u062a\u0627\u0644\u0648\u062c\u0646\u0627 \u0639\u0644\u0649 /shop\u060c \u0623\u0636\u0641 \u0645\u0646\u062a\u062c\u0627\u062a\u0643 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629\u060c \u0627\u0645\u0644\u0623 \u0627\u0644\u0646\u0645\u0648\u0630\u062c \u0628\u0627\u0633\u0645\u0643 \u0648\u0647\u0627\u062a\u0641\u0643 \u0648\u0639\u0646\u0648\u0627\u0646\u0643\u060c \u062b\u0645 \u0623\u0643\u062f. \u0633\u062a\u0635\u0644\u0643 \u0631\u0633\u0627\u0644\u0629 \u062a\u0623\u0643\u064a\u062f \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u062e\u0644\u0627\u0644 30 \u062f\u0642\u064a\u0642\u0629.",
      },
      {
        q_fr: "Puis-je modifier ou annuler ma commande ?",
        q_ar: "\u0647\u0644 \u064a\u0645\u0643\u0646\u0646\u064a \u062a\u0639\u062f\u064a\u0644 \u0637\u0644\u0628\u064a\u061f",
        a_fr: "Oui, contactez-nous sur WhatsApp au +212 664 500 789 dans les 30 minutes suivant votre commande. Apres la preparation, les modifications ne sont plus possibles.",
        a_ar: "\u0646\u0639\u0645\u060c \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u062e\u0644\u0627\u0644 30 \u062f\u0642\u064a\u0642\u0629 \u0645\u0646 \u062a\u0642\u062f\u064a\u0645 \u0637\u0644\u0628\u0643. \u0628\u0639\u062f \u0628\u062f\u0621 \u0627\u0644\u062a\u062d\u0636\u064a\u0631\u060c \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0639\u062f\u064a\u0644.",
      },
      {
        q_fr: "Y a-t-il un montant minimum de commande ?",
        q_ar: "\u0647\u0644 \u064a\u0648\u062c\u062f \u062d\u062f \u0623\u062f\u0646\u0649 \u0644\u0644\u0637\u0644\u0628\u061f",
        a_fr: "Oui, le montant minimum est de 30 MAD. Contactez-nous sur WhatsApp pour toute commande speciale en dessous de ce seuil.",
        a_ar: "\u0646\u0639\u0645\u060c \u0627\u0644\u062d\u062f \u0627\u0644\u0623\u062f\u0646\u0649 30 \u062f\u0631\u0647\u0645. \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u0644\u0623\u064a \u0637\u0644\u0628 \u062e\u0627\u0635.",
      },
    ],
  },
  {
    cat: "Livraison",
    cat_ar: "\u0627\u0644\u062a\u0648\u0635\u064a\u0644",
    emoji: "\ud83d\ude9a",
    items: [
      {
        q_fr: "Quels sont les delais de livraison ?",
        q_ar: "\u0645\u0627 \u0647\u064a \u0645\u062f\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644\u061f",
        a_fr: "La livraison est effectuee en 30 minutes a Sale et Rabat, 7 jours sur 7 de 8h a 20h.",
        a_ar: "\u0646\u0648\u0635\u0644 \u0641\u064a 30 \u062f\u0642\u064a\u0642\u0629 \u0641\u064a \u0633\u0644\u0627 \u0648\u0627\u0644\u0631\u0628\u0627\u0637\u060c 7 \u0623\u064a\u0627\u0645 \u0641\u064a \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0645\u0646 8\u0635 \u0625\u0644\u0649 20\u0635.",
      },
      {
        q_fr: "Livrez-vous dans toute la region ?",
        q_ar: "\u0647\u0644 \u062a\u0648\u0635\u0644\u0648\u0646 \u0644\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0646\u0627\u0637\u0642\u061f",
        a_fr: "Nous livrons actuellement a Sale, Rabat et Temara. Pour toute autre ville, contactez-nous sur WhatsApp avant de passer commande.",
        a_ar: "\u0646\u0648\u0635\u0644 \u062d\u0627\u0644\u064a\u0627\u064b \u0625\u0644\u0649 \u0633\u0644\u0627 \u0648\u0627\u0644\u0631\u0628\u0627\u0637 \u0648\u062a\u0645\u0627\u0631\u0629. \u0644\u0623\u064a \u0645\u062f\u064a\u0646\u0629 \u0623\u062e\u0631\u0649\u060c \u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u0642\u0628\u0644 \u0627\u0644\u0637\u0644\u0628.",
      },
      {
        q_fr: "Comment suivre ma livraison ?",
        q_ar: "\u0643\u064a\u0641 \u0623\u062a\u0627\u0628\u0639 \u0637\u0644\u0628\u064a\u061f",
        a_fr: "Vous recevez une mise a jour WhatsApp a chaque etape. Vous pouvez aussi suivre votre commande en temps reel sur mygreengoo.com/track avec votre numero de commande.",
        a_ar: "\u062a\u0635\u0644\u0643 \u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u0641\u064a \u0643\u0644 \u0645\u0631\u062d\u0644\u0629. \u064a\u0645\u0643\u0646\u0643 \u0623\u064a\u0636\u0627\u064b \u062a\u062a\u0628\u0639 \u0637\u0644\u0628\u0643 \u0639\u0644\u0649 mygreengoo.com/track.",
      },
    ],
  },
  {
    cat: "Produits",
    cat_ar: "\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a",
    emoji: "\ud83e\udd57",
    items: [
      {
        q_fr: "Les produits sont-ils garantis frais ?",
        q_ar: "\u0647\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0637\u0627\u0632\u062c\u0629\u061f",
        a_fr: "Oui. Tous nos produits sont selectionnes chaque matin sur les marches de gros. En cas de produit non conforme, nous procedons au remplacement ou au remboursement dans les 24h.",
        a_ar: "\u0646\u0639\u0645. \u062c\u0645\u064a\u0639 \u0645\u0646\u062a\u062c\u0627\u062a\u0646\u0627 \u0645\u062e\u062a\u0627\u0631\u0629 \u0643\u0644 \u0635\u0628\u0627\u062d. \u0641\u064a \u062d\u0627\u0644\u0629 \u0648\u062c\u0648\u062f \u0645\u0634\u0643\u0644\u0629\u060c \u0646\u0633\u062a\u0628\u062f\u0644 \u0627\u0644\u0645\u0646\u062a\u062c \u0623\u0648 \u0646\u0631\u062f \u0627\u0644\u0645\u0628\u0644\u063a \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629.",
      },
      {
        q_fr: "Un produit est epuise, que faire ?",
        q_ar: "\u0645\u0646\u062a\u062c \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631\u060c \u0645\u0627\u0630\u0627 \u0623\u0641\u0639\u0644\u061f",
        a_fr: "Si un produit n'est plus disponible apres votre commande, notre equipe vous contacte immediatement sur WhatsApp pour proposer une alternative de meme qualite.",
        a_ar: "\u0625\u0630\u0627 \u0646\u0641\u062f \u0645\u0646\u062a\u062c \u0628\u0639\u062f \u0637\u0644\u0628\u0643\u060c \u064a\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0641\u0631\u064a\u0642\u0646\u0627 \u0641\u0648\u0631\u0627\u064b \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628 \u0644\u0627\u0642\u062a\u0631\u0627\u062d \u0628\u062f\u064a\u0644 \u0645\u0645\u0627\u062b\u0644.",
      },
    ],
  },
  {
    cat: "Paiement",
    cat_ar: "\u0627\u0644\u062f\u0641\u0639",
    emoji: "\ud83d\udcb3",
    items: [
      {
        q_fr: "Quels modes de paiement acceptez-vous ?",
        q_ar: "\u0645\u0627 \u0647\u064a \u0637\u0631\u0642 \u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0645\u062a\u0627\u062d\u0629\u061f",
        a_fr: "Nous acceptons le paiement en especes a la livraison (COD) et par carte bancaire via terminal TPE. Selectionnez votre mode lors de la commande.",
        a_ar: "\u0646\u0642\u0628\u0644 \u0627\u0644\u062f\u0641\u0639 \u0646\u0642\u062f\u0627\u064b \u0639\u0646\u062f \u0627\u0644\u062a\u0633\u0644\u064a\u0645 \u0623\u0648 \u0628\u0628\u0637\u0627\u0642\u0629 \u0628\u0646\u0643\u064a\u0629 \u0639\u0628\u0631 TPE. \u0627\u062e\u062a\u0631 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0637\u0644\u0628.",
      },
      {
        q_fr: "Puis-je obtenir une facture ?",
        q_ar: "\u0647\u0644 \u064a\u0645\u0643\u0646\u0646\u064a \u0627\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0641\u0627\u062a\u0648\u0631\u0629\u061f",
        a_fr: "Oui. Apres chaque commande, vous pouvez telecharger votre facture PDF directement depuis la page de confirmation ou via mygreengoo.com/track.",
        a_ar: "\u0646\u0639\u0645. \u0628\u0639\u062f \u0643\u0644 \u0637\u0644\u0628\u060c \u064a\u0645\u0643\u0646\u0643 \u062a\u062d\u0645\u064a\u0644 \u0641\u0627\u062a\u0648\u0631\u0629 PDF \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0623\u0643\u064a\u062f \u0623\u0648 \u0639\u0628\u0631 mygreengoo.com/track.",
      },
    ],
  },
];

function AccordionItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={"rounded-2xl border transition-all " + (open ? "border-[#2E8B57]/30 bg-[#2E8B57]/3" : "border-gray-100 bg-white")}
      style={{ boxShadow: open ? "0 2px 12px rgba(46,139,87,0.08)" : "0 1px 4px rgba(0,0,0,0.04)" }}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className={"text-sm font-bold leading-snug transition-colors " + (open ? "text-[#2E8B57]" : "text-gray-800")}>
          {q}
        </span>
        <ChevronDown size={16} className={"shrink-0 transition-transform text-gray-400 " + (open ? "rotate-180 text-[#2E8B57]" : "")} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { language, isRTL } = useLanguage();
  const l    = language as "fr" | "ar" | "en";
  const font = l === "ar" ? "font-arabic" : "font-latin";
  const [openItem, setOpenItem] = useState<string | null>("0-0");

  return (
    <div className={font} dir={isRTL ? "rtl" : "ltr"} style={{ background: "#FAF7F2", minHeight: "100vh" }}>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,${GREEN} 100%)` }}>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>
            {l === "ar" ? "\u0623\u0633\u0626\u0644\u0629 \u0634\u0627\u0626\u0639\u0629" : "Questions frequentes"}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,4vw,2.5rem)", fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1 }}>
            {l === "ar" ? "\u0643\u064a\u0641 \u064a\u0645\u0643\u0646\u0646\u0627 \u0645\u0633\u0627\u0639\u062f\u062a\u0643\u061f" : "Comment pouvons-nous vous aider ?"}
          </h1>
          <p className="text-white/50 mt-3 text-sm max-w-md mx-auto">
            {l === "ar"
              ? "\u0643\u0644 \u0645\u0627 \u062a\u062d\u062a\u0627\u062c \u0645\u0639\u0631\u0641\u062a\u0647 \u062d\u0648\u0644 \u062e\u062f\u0645\u0627\u062a\u0646\u0627"
              : "Tout ce que vous devez savoir sur GreenGo Market"}
          </p>
        </div>
        <div className="zellige-border" />
      </section>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {FAQS.map((cat, ci) => (
          <section key={ci}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{cat.emoji}</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: DARK, fontStyle: "italic" }}>
                {l === "ar" ? cat.cat_ar : cat.cat}
              </h2>
              <div className="flex-1 h-px bg-gray-200 mx-2" />
            </div>
            <div className="space-y-3">
              {cat.items.map((item, ii) => (
                <AccordionItem
                  key={ii}
                  q={l === "ar" ? item.q_ar : item.q_fr}
                  a={l === "ar" ? item.a_ar : item.a_fr}
                  open={openItem === `${ci}-${ii}`}
                  onToggle={() => setOpenItem(openItem === `${ci}-${ii}` ? null : `${ci}-${ii}`)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Still have questions */}
        <section className="rounded-3xl p-8 text-center" style={{ background: `linear-gradient(135deg,#0d3b36,${GREEN})` }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700, fontStyle: "italic", color: "#fff", marginBottom: "0.5rem" }}>
            {l === "ar" ? "\u0644\u0645 \u062a\u062c\u062f \u0625\u062c\u0627\u0628\u062a\u0643\u061f" : "Vous n'avez pas trouve votre reponse ?"}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {l === "ar"
              ? "\u0641\u0631\u064a\u0642\u0646\u0627 \u0645\u062a\u0648\u0641\u0631 7 \u0623\u064a\u0627\u0645 \u0645\u0646 8\u0635 \u0625\u0644\u0649 20\u0635"
              : "Notre equipe est disponible 7j/7 de 8h a 20h"}
          </p>
          <a href="https://wa.me/212664500789" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-white transition-all hover:scale-105"
            style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {l === "ar" ? "\u062a\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0648\u0627\u062a\u0633\u0627\u0628" : "Contacter sur WhatsApp"}
          </a>
        </section>

      </div>
    </div>
  );
}
