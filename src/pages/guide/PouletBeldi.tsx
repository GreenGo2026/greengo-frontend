// src/pages/guide/PouletBeldi.tsx
import { Link } from "react-router-dom";
import { useSeo, useJsonLd } from "../../hooks/useSeo";

const DIFFERENCES = [
  { aspect: "Durée d'élevage", beldi: "90 à 120 jours", industriel: "35 à 42 jours" },
  { aspect: "Mode d'élevage", beldi: "Plein air, en liberté", industriel: "Batterie, confiné" },
  { aspect: "Alimentation", beldi: "Grains, herbes, insectes", industriel: "Aliments enrichis" },
  { aspect: "Hormones / antibiotiques", beldi: "Aucun", industriel: "Systématiques" },
  { aspect: "Texture de la chair", beldi: "Ferme, dense", industriel: "Molle, gorgée d'eau" },
  { aspect: "Prix indicatif", beldi: "50 à 80 MAD/kg", industriel: "20 à 30 MAD/kg" },
];

const RECOGNITION_SIGNS = [
  {
    icon: "🐔",
    good: "✅ Beldi authentique",
    color: "bg-green-50 border-green-200",
    signs: [
      "Peau fine, légèrement jaunâtre",
      "Chair ferme, peu d'eau à la cuisson",
      "Gabarit naturel et asymétrique",
      "Goût profond et concentré",
      "Prix entre 50 et 80 MAD/kg",
    ],
  },
  {
    icon: "🏭",
    good: "❌ Poulet industriel",
    color: "bg-red-50 border-red-200",
    signs: [
      "Peau épaisse, blanche et uniforme",
      "Chair molle, rend beaucoup d'eau",
      "Filets et cuisses disproportionnés",
      "Goût neutre même avec des épices",
      "Prix sous 30 MAD/kg pour un 'beldi'",
    ],
  },
];

const NUTRITION = [
  { icon: "💪", title: "Protéines", desc: "Plus de protéines par gramme de chair — sa croissance lente développe une musculature dense." },
  { icon: "🫀", title: "Profil lipidique", desc: "Davantage d'oméga-3 et moins d'acides gras saturés grâce à son alimentation variée." },
  { icon: "🌿", title: "Absence de résidus", desc: "Sans antibiotiques préventifs ni hormones, exempt des résidus trouvés dans les volailles intensives." },
  { icon: "⚡", title: "Fer et zinc", desc: "Plus riche en minéraux essentiels — fer héminique et zinc, souvent déficitaires." },
];

const RECIPES = [
  { name: "Djaj mcharmel", ar: "الدجاج المسمر", desc: "Poulet mariné au citron confit, olives et épices. La sauce acquiert une profondeur et une onctuosité impossibles avec du poulet industriel." },
  { name: "Rfissa", ar: "الرفيسة", desc: "Plat de fête servi lors des naissances. La longue cuisson révèle toute la richesse du bouillon beldi — un concentré de saveur." },
  { name: "Couscous du vendredi", ar: "الكسكس", desc: "Le beldi cuit avec les légumes donne un bouillon naturellement savoureux, sans bouillon en cube ni exhausteurs de goût." },
  { name: "Poulet rôti simple", ar: "دجاج محمر", desc: "Cumin, paprika, huile d'olive — rien d'autre. Le beldi rôti nature révèle une saveur que les Marocains considèrent parmi les meilleures." },
];

const CONSERVATION = [
  { title: "🌡️ Conservation", desc: "À consommer dans les 24 à 48h après l'achat. Sa chair sans conservateurs se détériore plus rapidement que le poulet industriel. Congeler immédiatement si non consommé le jour même." },
  { title: "⏱️ Temps de cuisson", desc: "Le beldi demande plus de patience — sa chair dense nécessite une cuisson longue. Pour un tajine : 1h30 à 2h à feu doux. Pour un bouillon : 2h minimum pour extraire toute la saveur." },
  { title: "💧 Dégraissage", desc: "Le beldi produit peu de graisse lors de la cuisson. Contrairement au poulet industriel qui rend beaucoup d'eau, le beldi reste ferme et concentre ses saveurs." },
];

export default function PouletBeldi() {
  useSeo({
    title: "Poulet Beldi Marocain — Guide Complet : Différences, Bienfaits et Où Commander | GreenGo Market",
    description: "Tout sur le poulet beldi marocain : différences avec le poulet industriel, bienfaits nutritionnels, comment le reconnaître et où commander un poulet beldi frais livré en 30 min à Salé et Rabat.",
  });

  useJsonLd("article-ld-poulet-beldi", {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Le Poulet Beldi Marocain — Guide Complet",
    "description": "Tout sur le poulet beldi : différences avec le poulet industriel, bienfaits, comment le reconnaître, et où commander à Salé et Rabat.",
    "author": { "@type": "Organization", "name": "GreenGo Market" },
    "publisher": { "@type": "Organization", "name": "GreenGo Market", "url": "https://www.mygreengoo.com" },
    "datePublished": "2026-07-31",
    "dateModified": "2026-07-31",
    "url": "https://www.mygreengoo.com/guide/poulet-beldi",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.mygreengoo.com/guide/poulet-beldi" },
  });

  const whatsappShare = "https://wa.me/?text=" + encodeURIComponent(
    "Le Poulet Beldi Marocain — Guide Complet\nhttps://www.mygreengoo.com/guide/poulet-beldi"
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#0c3228] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full font-medium uppercase tracking-wide">
            Guide produit · الدجاج البلدي
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3 leading-tight">
            Le Poulet Beldi Marocain
            <span className="block text-[#C9A96E] mt-1">Guide Complet</span>
          </h1>
          <p className="text-green-200 text-sm">6 min de lecture · Mis à jour juillet 2026</p>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Intro */}
        <p className="text-gray-600 text-lg leading-relaxed">
          Le poulet beldi est l'un des produits les plus recherchés sur les marchés marocains — et l'un des
          plus mal compris. Beaucoup de vendeurs affichent "beldi" sur des produits qui ne le sont pas. Ce
          guide vous explique exactement ce qu'est un vrai poulet beldi, comment le reconnaître, et pourquoi
          la différence avec le poulet industriel est fondamentale.
        </p>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">1. Qu'est-ce que le poulet beldi ?</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            "Beldi" signifie littéralement "du pays" en darija — un terme qui désigne tout ce qui est local,
            traditionnel, authentique. Un poulet beldi est élevé en plein air, en liberté, nourri
            naturellement sans hormones de croissance ni antibiotiques systématiques.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Contrairement au poulet industriel élevé en batterie — où des milliers de volailles sont
            confinées dans des hangars, gavées d'aliments enrichis pour atteindre leur poids en 35 à 42
            jours — le poulet beldi grandit à son propre rythme pendant 90 à 120 jours.
          </p>
        </section>

        {/* Section 2 — Comparison table */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-5">2. Beldi vs industriel — comparatif</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0c3228] text-white">
                    <th className="px-4 py-3 text-left font-medium">Critère</th>
                    <th className="px-4 py-3 text-center font-bold text-[#C9A96E]">🐔 Beldi</th>
                    <th className="px-4 py-3 text-center font-medium opacity-80">🏭 Industriel</th>
                  </tr>
                </thead>
                <tbody>
                  {DIFFERENCES.map((row, i) => (
                    <tr key={row.aspect} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 font-medium text-gray-700">{row.aspect}</td>
                      <td className="px-4 py-3 text-center text-green-700 font-semibold">{row.beldi}</td>
                      <td className="px-4 py-3 text-center text-gray-400">{row.industriel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3 — How to recognise */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-5">3. Comment reconnaître un vrai beldi ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECOGNITION_SIGNS.map((block) => (
              <div key={block.good} className={`rounded-xl border p-5 ${block.color}`}>
                <p className="font-semibold text-sm mb-3">{block.icon} {block.good}</p>
                <ul className="space-y-1.5">
                  {block.signs.map((s) => (
                    <li key={s} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 — Nutrition */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">4. Valeur nutritionnelle</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Le poulet beldi n'est pas seulement meilleur au goût — il est objectivement plus nutritif.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NUTRITION.map((b) => (
              <div key={b.title} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3">
                <span className="text-2xl flex-shrink-0">{b.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-[#0c3228] mb-1">{b.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — Recipes */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-5">5. Le poulet beldi en cuisine marocaine</h2>
          <div className="space-y-3">
            {RECIPES.map((r) => (
              <div key={r.name} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[#0c3228] text-sm">{r.name}</p>
                    <span className="text-xs text-[#C9A96E]" dir="rtl">{r.ar}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 — Conservation */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">6. Conservation et préparation</h2>
          <div className="space-y-3">
            {CONSERVATION.map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-[#f0f7f0] border border-green-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0c3228] min-w-fit">{item.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-[#0c3228] rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-2">7. Commander le poulet beldi à Salé et Rabat</h2>
            <p className="text-green-200 text-sm leading-relaxed mb-4">
              GreenGo Market sélectionne ses poulets beldi auprès de producteurs locaux de confiance. Nos
              poulets sont abattus et préparés le matin même de la livraison — fraîcheur maximale garantie.
              Livraison en 30 minutes à Salé, Rabat et Témara, 7j/7 de 8h à 21h.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/shop"
                className="bg-[#F97316] text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-orange-600 transition-colors">
                Commander le poulet beldi →
              </Link>
              <a href="https://wa.me/212664397031" target="_blank" rel="noopener noreferrer"
                className="bg-[#25D366] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-green-600 transition-colors">
                📱 Commander sur WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Share */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">Ce guide vous a été utile ?</p>
          <a href={whatsappShare} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-600 transition-colors">
            📱 Partager
          </a>
        </div>

      </article>
    </div>
  );
}
