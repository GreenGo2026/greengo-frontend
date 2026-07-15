// src/pages/guide/MielArtisanal.tsx
import { Link } from "react-router-dom";
import { useSeo, useJsonLd } from "../../hooks/useSeo";

const VARIETIES = [
  {
    name: "Miel de thym",
    ar: "عسل الزعتر",
    color: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    desc: "Le plus recherché et le plus réputé des miels marocains. Récolté dans les zones montagneuses où le thym sauvage pousse en abondance — Rif, Moyen-Atlas, régions de Chefchaouen et Khénifra. Sa couleur est ambrée dorée, son arôme puissant et légèrement épicé, son goût intense et persistant. Reconnu pour ses propriétés antimicrobiennes et son action bénéfique sur les voies respiratoires.",
  },
  {
    name: "Miel d'euphorbe",
    ar: "عسل الدغموس",
    color: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-800",
    desc: "Produit dans les zones semi-arides du Maroc où pousse l'euphorbe (تيفارغ), arbuste très présent dans les régions de Taroudant, Tiznit et le Souss-Massa. Ce miel est crémeux, de couleur claire à beige, avec un goût doux et légèrement boisé. Très apprécié localement pour ses propriétés digestives — l'un des trésors cachés de l'apiculture marocaine.",
  },
  {
    name: "Miel de fleurs",
    ar: "عسل الزهور",
    color: "bg-pink-50 border-pink-200",
    badge: "bg-pink-100 text-pink-800",
    desc: "Le miel multifloraux par excellence, récolté au printemps dans les zones florales variées. Sa composition change selon la saison et la région : lavande, romarin, agrumes, caroubier et fleurs sauvages. Plus doux et moins intense que le miel de thym, idéal pour ceux qui découvrent les miels artisanaux.",
  },
  {
    name: "Miel de jujubier",
    ar: "عسل السدر",
    color: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800",
    desc: "Produit à partir des fleurs du jujubier (سدر), arbre sacré dans la tradition arabo-berbère. Ce miel est épais, de couleur sombre, avec un arôme riche et complexe et un goût légèrement caramélisé. Parmi les miels les plus rares et les plus coûteux du Maroc, très recherché pour ses propriétés régénérantes.",
  },
  {
    name: "Miel d'oranger",
    ar: "عسل البرتقال",
    color: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-800",
    desc: "Récolté dans les grandes zones agrumicoles marocaines — Souss, Gharb, Haouz. Couleur claire, arôme floral délicat, goût doux avec une note caractéristique de fleur d'oranger. Très populaire dans les régions de production.",
  },
];

const CONSUMPTION = [
  { title: "🍽️ Petit-déjeuner traditionnel", desc: "Le miel avec de l'amlou sur du pain traditionnel ou du msemen — protéines, glucides complexes et antioxydants réunis dans un seul repas." },
  { title: "🍵 En tisane", desc: "Dissoudre une cuillère à café dans une tisane à moins de 60°C. Jamais dans de l'eau bouillante — la chaleur détruit les enzymes." },
  { title: "🫕 En cuisine salée", desc: "Le miel de thym ou d'euphorbe se marie remarquablement avec les tajines de poulet, les salades de carottes épicées et les fromages." },
  { title: "🥄 Nature", desc: "Une cuillère à café le matin à jeun est l'usage le plus direct pour bénéficier de toutes ses propriétés." },
];

export default function MielArtisanal() {
  useSeo({
    title: "Miel Artisanal Marocain — Guide Complet des Variétés | GreenGo Market",
    description: "Découvrez les variétés de miel artisanal marocain : thym, euphorbe, fleurs, jujubier. Origines, bienfaits, comment choisir un vrai miel naturel et où le commander à Salé et Rabat en 30 minutes.",
  });

  useJsonLd("article-ld-miel-artisanal", {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Le Miel Artisanal Marocain — Guide Complet",
    "description": "Guide des variétés de miel marocain : thym, euphorbe, fleurs, jujubier. Bienfaits, comment choisir et où commander à Salé et Rabat.",
    "author": { "@type": "Organization", "name": "GreenGo Market" },
    "publisher": { "@type": "Organization", "name": "GreenGo Market", "url": "https://www.mygreengoo.com" },
    "datePublished": "2026-07-15",
    "dateModified": "2026-07-15",
    "url": "https://www.mygreengoo.com/guide/miel-artisanal-maroc",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.mygreengoo.com/guide/miel-artisanal-maroc" },
  });

  const whatsappShare = "https://wa.me/?text=" + encodeURIComponent(
    "Le Miel Artisanal Marocain — Guide Complet\nhttps://www.mygreengoo.com/guide/miel-artisanal-maroc"
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#0c3228] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full font-medium uppercase tracking-wide">
            Guide produit · عسل
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3 leading-tight">
            Le Miel Artisanal Marocain
            <span className="block text-[#C9A96E] mt-1">Guide Complet des Variétés</span>
          </h1>
          <p className="text-green-200 text-sm">7 min de lecture · Mis à jour juillet 2026</p>
        </div>
      </div>

      {/* Article */}
      <article className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Intro */}
        <p className="text-gray-600 text-lg leading-relaxed">
          Le Maroc est l'un des pays les plus riches au monde en diversité de miels. Grâce à sa géographie
          unique — montagnes du Rif et du Haut-Atlas, plaines côtières, zones arides du sud — les abeilles
          marocaines butinent des flores extraordinairement variées, produisant des miels aux profils
          aromatiques incomparables.
        </p>

        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">1. Pourquoi le miel marocain est-il exceptionnel ?</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            La richesse du miel marocain tient à trois facteurs combinés : une biodiversité florale
            exceptionnelle, des pratiques apicoles souvent encore traditionnelles dans les régions rurales,
            et un climat qui favorise des floraisons intenses et concentrées.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Contrairement aux miels industriels qui sont mélangés, chauffés et filtrés pour standardiser
            leur apparence, le miel artisanal marocain est extrait à froid, sans traitement thermique,
            conservant ainsi ses enzymes, ses antioxydants et ses propriétés naturelles intactes.
          </p>
        </section>

        {/* Section 2 — Varieties */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-6">2. Les principales variétés de miel marocain</h2>
          <div className="space-y-6">
            {VARIETIES.map(v => (
              <div key={v.name} className={`rounded-xl border p-5 ${v.color}`}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-[#0c3228] text-lg">{v.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.badge}`} dir="rtl">{v.ar}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — How to choose */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">3. Comment reconnaître un vrai miel artisanal ?</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            La cristallisation est un signe de qualité, pas un défaut. Un miel naturel cristallise après
            quelques mois — c'est la preuve qu'il n'a pas été chauffé ni filtré industriellement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-semibold text-green-800 mb-2">✅ Signes d'authenticité</p>
              <ul className="space-y-1 text-sm text-green-700">
                {[
                  "Cristallisation naturelle",
                  "Légère séparation des phases",
                  "Particules de cire ou propolis",
                  "Goût complexe en bouche",
                  "Arôme puissant et persistant",
                ].map(s => <li key={s}>• {s}</li>)}
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-semibold text-red-800 mb-2">❌ Signes d'un miel industriel</p>
              <ul className="space-y-1 text-sm text-red-700">
                {[
                  "Toujours parfaitement limpide",
                  "Goût uniforme sans complexité",
                  "Prix très bas (< 30 MAD/250g)",
                  "Sans indication de la fleur",
                  "Sans indication de la région",
                ].map(s => <li key={s}>• {s}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 — Benefits */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">4. Les bienfaits reconnus du miel naturel</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Le miel naturel est bien plus qu'un édulcorant. Riche en enzymes, en polyphénols antioxydants,
            en minéraux et en acides aminés, il possède des propriétés antimicrobiennes, cicatrisantes et
            immunostimulantes.
          </p>
          <p className="text-gray-600 leading-relaxed">
            En médecine traditionnelle marocaine, le miel est utilisé mélangé à la cannelle contre les
            inflammations, avec le nigelle (حبة السوداء) pour renforcer l'immunité, et avec le gingembre
            pour soulager les maux de gorge.
          </p>
        </section>

        {/* Section 5 — How to consume */}
        <section>
          <h2 className="text-xl font-bold text-[#0c3228] mb-4">5. Comment consommer le miel marocain ?</h2>
          <div className="space-y-3">
            {CONSUMPTION.map(item => (
              <div key={item.title} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0c3228] min-w-fit">{item.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 — CTA GreenGo */}
        <section>
          <div className="bg-[#0c3228] rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-2">6. Commander le miel artisanal à Salé et Rabat</h2>
            <p className="text-green-200 text-sm leading-relaxed mb-4">
              GreenGo Market propose une sélection de miels artisanaux marocains soigneusement choisis
              auprès de producteurs locaux : miel de thym, miel d'euphorbe, miel de fleurs et miel de
              jujubier, disponibles en 250g, 500g et 1kg. Livraison en 30 minutes à Salé, Rabat et Témara,
              7j/7 de 8h à 21h.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/shop"
                className="bg-[#F97316] text-white font-bold px-5 py-2.5 rounded-full text-sm hover:bg-orange-600 transition-colors">
                Voir nos miels →
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
