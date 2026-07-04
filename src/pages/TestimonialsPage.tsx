// src/pages/TestimonialsPage.tsx
import { Link } from "react-router-dom";
import TestimonialsSection, { type Testimonial } from "../components/TestimonialsSection";
import { useSeo } from "../hooks/useSeo";

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
    name: "Amina",
    neighborhood: "Tabriquet, Salé",
    text: "شكرا وصل داكشي مزيان، أملو غزال تبارك الله الوليدات عجبهم.",
    rating: 5,
    product: "Pack petit-déjeuner Amlou + Miel"
  },
  {
    id: 3,
    name: "Mehdi",
    neighborhood: "Agdal, Rabat",
    text: "Dajaj n9i bzaf o mghsoul mzyan. Service top bon courage.",
    rating: 5,
    product: "Poulet Beldi + Épices"
  },
  {
    id: 4,
    name: "Khadija",
    neighborhood: "Hay Salam, Salé",
    text: "Merci bzaaf kounte mzrouba w 3t9touni, raw3a.",
    rating: 5,
    product: "Panier fruits de saison"
  },
  {
    id: 5,
    name: "Tarik",
    neighborhood: "Hassan, Rabat",
    text: "الزيتون والزيت ديالكم ديال البلاد نيت. الله يعطيكم الصحة.",
    rating: 5,
    product: "Olives + Huile d'olive extra vierge"
  }
];

export default function TestimonialsPage() {
  useSeo({
    title: "Avis clients — GreenGo Market | Salé & Rabat",
    description: "Ce que disent nos vrais clients à Salé et Rabat. 5 avis vérifiés sur la livraison, la fraîcheur et le service GreenGo Market.",
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="bg-[#0c3228] text-white py-14 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">💬 Avis de nos clients</h1>
        <p className="text-green-200 text-lg max-w-xl mx-auto">
          Ce que disent nos vrais clients à Salé et Rabat
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="flex gap-0.5">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-yellow-400 text-xl">{s}</span>
            ))}
          </div>
          <span className="text-green-200 text-sm">{TESTIMONIALS.length} avis vérifiés</span>
        </div>
      </div>

      {/* Testimonials grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <TestimonialsSection testimonials={TESTIMONIALS} />
      </div>

      {/* CTA at bottom */}
      <div className="bg-[#0c3228] py-10 px-4 text-center text-white mt-8">
        <p className="text-xl font-semibold mb-4">Rejoignez nos clients satisfaits 🌿</p>
        <Link to="/shop"
          className="bg-[#F97316] text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition-colors inline-block">
          Commander maintenant →
        </Link>
      </div>

    </div>
  );
}
