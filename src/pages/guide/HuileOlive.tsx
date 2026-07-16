// src/pages/guide/HuileOlive.tsx
import { Link } from "react-router-dom";
import { useSeo, useJsonLd } from "../../hooks/useSeo";

const REGIONS = [
  {
    name: "Marrakech-Safi et Haouz",
    desc: "La plus grande zone de production, avec des oliveraies centenaires autour de Marrakech, Essaouira et Chichaoua. Huile généralement douce et fruitée.",
  },
  {
    name: "Souss-Massa et région d'Agadir",
    desc: "Production importante, souvent associée à la coopérative Aït Baha, qui a modernisé l'extraction tout en préservant les méthodes traditionnelles.",
  },
  {
    name: "Fès-Meknès et Taounate",
    desc: "Région historique de production, avec des variétés locales comme la Picholine marocaine, l'olive la plus cultivée au Maroc.",
  },
  {
    name: "Taza-Al Hoceïma-Taounate",
    desc: "Production de montagne avec des huiles souvent plus intenses et amères, caractéristiques des olives récoltées en altitude.",
  },
];

const QUALITIES = [
  {
    name: "Huile d'olive extra vierge",
    badge: "bg-green-100 text-green-800",
    note: "⭐ Meilleure qualité",
    desc: "Extraite à froid lors de la première pression, sans traitement chimique. Acidité < 0,8%. Conserve tous ses arômes et polyphénols. À utiliser crue, en filet sur les salades, le pain ou les plats terminés.",
  },
  {
    name: "Huile d'olive vierge",
    badge: "bg-blue-100 text-blue-800",
    note: "✅ Bonne qualité",
    desc: "Extraction à froid également, acidité jusqu'à 2%. Légèrement moins aromatique que l'extra vierge. Appropriée pour la cuisson à feu doux.",
  },
  {
    name: "Huile d'olive raffinée",
    badge: "bg-amber-100 text-amber-800",
    note: "⚠️ Qualité industrielle",
    desc: "Obtenue par traitement chimique ou thermique. Neutre en goût, sans bénéfices nutritionnels significatifs. Souvent vendue comme \"huile pure\" — appellation trompeuse.",
  },
  {
    name: "Huile d'olive légère",
    badge: "bg-red-100 text-red-800",
    note: "❌ À éviter",
    desc: "Mélange d'huile raffinée et d'une petite quantité d'extra vierge. Ni la qualité de l'une ni l'authenticité de l'autre.",
  },
];

const BENEFITS = [
  {
    icon: "❤️",
    title: "Santé cardiovasculaire",
    desc: "Le régime méditerranéen montre une réduction significative des maladies cardiovasculaires. L'acide oléique réduit le LDL et préserve le HDL.",
  },
  {
    icon: "🔬",
    title: "Action anti-inflammatoire",
    desc: "L'oléocanthal, un polyphénol de l'huile extra vierge, possède une action comparable à l'ibuprofène selon des recherches publiées dans Nature.",
  },
  {
    icon: "🛡️",
    title: "Protection cellulaire",
    desc: "Les antioxydants (vitamine E, polyphénols) protègent les cellules contre le stress oxydatif lié au vieillissement.",
  },
  {
    icon: "🌿",
    title: "Digestion",
    desc: "Stimule la sécrétion biliaire et facilite la digestion. Consommée à jeun, utilisée traditionnellement pour réguler le transit.",
  },
];

const RECOGNITION_SIGNS = [
  {
    signal: "L'arôme",
    detail: "Une vraie huile extra vierge fraîche dégage un arôme fruité, herbacé, parfois légèrement poivré. Une huile neutre ou rance est le signe d'un raffinage ou d'un vieillissement.",
  },
  {
    signal: "Le goût",
    detail: "Fruité en attaque, légère amertume, picotement en gorge. Ce picotement est la signature des polyphénols — c'est un signe de qualité, pas un défaut.",
  },
  {
    signal: "La cristallisation",
    detail: "Placée au réfrigérateur, une vraie huile extra vierge se solidifie partiellement. Ce n'est pas une altération — c'est la preuve de sa composition naturelle.",
  },
  {
    signal: "La date de récolte",
    detail: "Une bonne huile indique l'année de récolte, pas seulement une DLC. Une huile extra vierge se consomme idéalement dans les 18 mois suivant la récolte.",
  },
];

const USAGE = [
  {
    title: "🫕 En cuisine marocaine",
    desc: "Indispensable dans les salades cuites (zaalouk, taktouka), les chermoulas, les tajines, les soupes et le pain traditionnel trempé.",
  },
  {
    title: "🌡️ Température de cuisson",
    desc: "Ne jamais chauffer l'extra vierge au-delà de 180°C — les polyphénols se dégradent. Pour les cuissons à haute température, utilisez une huile raffinée.",
  },
  {
    title: "📦 Conservation",
    desc: "À l'abri de la lumière et de la chaleur, en verre sombre. Jamais au réfrigérateur pour le stockage quotidien. Consommer dans les 3 mois après ouverture.",
  },
];

export default function HuileOlive() {
  useSeo({
    title: "Huile d'Olive Marocaine — Guide Complet : Choisir, Utiliser, Conserver | GreenGo Market",
    description: "Tout sur l'huile d'olive marocaine : différence extra vierge vs raffinée, régions productrices, bienfaits santé et comment reconnaître une vraie huile de qualité. Livrée en 30 min à Salé et Rabat.",
  });

  useJsonLd("article-ld-huile-olive", {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "L'Huile d'Olive Marocaine — Guide Complet",
    "description": "Guide complet sur l'huile d'olive marocaine : régions, qualités, bienfaits, conservation et où commander à Salé et Rabat.",
    "author": { "@type": "Organization", "name": "GreenGo Market" },
    "publisher": { "@type": "Organization", "name": "GreenGo Market", "url": "https://www.mygreengoo.com" },
    "datePublished": "2026-07-16",
    "dateModified": "2026-07-16",
    "url": "https://www.mygreengoo.com/guide/huile-olive-marocaine",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.mygreengoo.com/guide/huile-olive-marocaine" },
  });

  const whatsappShare = "https://wa.me/?text=" + encodeURIComponent(
    "Huile d'Olive Marocaine — Guide Complet\nhttps://www.mygreengoo.com/guide/huile-olive-marocaine"
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#0c3228] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full font-medium uppercase tracking-wide">
            Guide produit · زيت الزيتون
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3 leading-tight">
            L'Huile d'Olive Marocaine
            <span className="block text-[#C9A96E] mt-1">Guide Complet</span>
          </h1>
          <p className="text-green-200 text-sm">8 min de lecture · Mis à jour juillet 2026</p>
        </div>
      </div>

      <article className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Intro */}
        <p className="text-gray-600 text-lg leading-relaxed">
          Le Maroc est le 4ème producteur mondial d'olives et l'un des pays où la culture de l'olivier est
          la plus ancienne. Avec plus de 50 millions d'oliviers répartis sur l'ensemble du territoire,
          l'huile d'olive marocaine représente un patrimoine agricole et gastronomique majeur — et pourtant,
          beaucoup de consommateurs ne savent pas encore distinguer une vraie huile extra vierge artisanale
          d'une huile raffinée industrielle.
        </p>

        {/* Section 1 — Regions */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-5">1. Les régions productrices d'huile d'olive au Maroc</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La géographie marocaine offre des conditions idéales pour la culture de l'olivier : ensoleillement
            intense, sols pauvres et bien drainés, variations thermiques importantes entre le jour et la nuit.
          </p>
          <div className="space-y-3">
            {REGIONS.map(r => (
              <div key={r.name} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3">
                <span className="text-[#0c3228] font-bold text-lg flex-shrink-0">🫒</span>
                <div>
                  <p className="font-semibold text-[#0c3228] text-sm mb-1">{r.name}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 — Qualities */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-5">2. Les différentes qualités d'huile d'olive</h2>
          <div className="space-y-4">
            {QUALITIES.map(q => (
              <div key={q.name} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-bold text-[#0c3228]">{q.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.badge}`}>{q.note}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{q.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — How to recognise */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">3. Comment reconnaître une vraie huile extra vierge ?</h2>
          <div className="space-y-3">
            {RECOGNITION_SIGNS.map(item => (
              <div key={item.signal} className="bg-[#f0f7f0] border border-green-100 rounded-xl p-4 flex gap-3">
                <span className="font-bold text-[#0c3228] text-sm min-w-fit">→ {item.signal} :</span>
                <p className="text-gray-600 text-sm leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 — Benefits */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-5">4. Les bienfaits de l'huile d'olive extra vierge</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-[#0c3228] mb-2 text-sm">{b.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — Use and store */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">5. Comment utiliser et conserver l'huile d'olive</h2>
          <div className="space-y-3">
            {USAGE.map(item => (
              <div key={item.title} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0c3228] min-w-fit">{item.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 — CTA */}
        <section>
          <div className="bg-[#0c3228] rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-2">6. Commander l'huile d'olive à Salé et Rabat</h2>
            <p className="text-green-200 text-sm leading-relaxed mb-4">
              GreenGo Market propose une huile d'olive vierge sélectionnée pour sa qualité constante et sa
              fraîcheur garantie. Livrée dans les meilleures conditions de conservation, elle vous parvient
              aussi fraîche que chez le producteur. Livraison en 30 minutes à Salé, Rabat et Témara, 7j/7 de
              8h à 21h.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/shop"
                className="bg-[#F97316] text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-orange-600 transition-colors">
                Voir notre huile d'olive →
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
