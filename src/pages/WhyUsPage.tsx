// src/pages/WhyUsPage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSeo } from "../hooks/useSeo";

type L = "fr" | "ar" | "en";

function pick(l: L, fr: string, ar: string, en: string): string {
  return l === "ar" ? ar : l === "fr" ? fr : en;
}

const REASONS = [
  {
    icon: "🕐",
    title_fr: "La vitesse", title_ar: "السرعة", title_en: "Speed",
    body_fr: "30 minutes. Pas 2 heures. Pas demain. Maintenant.\n\nNous livrons à Salé et Rabat en 30 minutes chrono, tous les jours de 8h à 21h. Quand vous avez besoin de quelque chose pour le déjeuner à 12h, vous l'avez avant midi et demi.",
    body_ar: "30 دقيقة — مش ساعتين، مش غدا. دابا.\n\nكنوصلو في سلا والرباط في 30 دقيقة بالضبط، كل يوم من 8 الصباح حتى 9 الليل. كتحتاج شي للغدا الساعة 12؟ غادي يكون عندك قبل 12:30.",
    body_en: "30 minutes. Not 2 hours. Not tomorrow. Now.\n\nWe deliver to Salé and Rabat in 30 minutes flat, every day from 8am to 9pm. Need something for lunch at noon? You'll have it before 12:30.",
  },
  {
    icon: "🌿",
    title_fr: "La fraîcheur", title_ar: "الطازجية", title_en: "Freshness",
    body_fr: "Nos produits arrivent frais du matin, pas d'un entrepôt froid.\n\nNous nous approvisionnons quotidiennement auprès de producteurs locaux marocains. Pas de chaîne de froid industrielle, pas de produits qui traînent en rayon depuis 5 jours. Ce que vous recevez le matin a quitté le producteur le matin.",
    body_ar: "منتجاتنا طازجة من الصباح — مش من مستودع بارد.\n\nكنتزودو كل يوم من المنتجين المحليين المغاربة. بلا تبريد صناعي، بلا منتجات قاعدة في الرف 5 أيام. اللي كيوصلك الصباح خرج من عند المنتج الصباح.",
    body_en: "Our products arrive fresh from the morning, not from a cold warehouse.\n\nWe source daily from local Moroccan producers. No industrial cold chain, no products sitting on a shelf for 5 days. What you receive in the morning left the producer that same morning.",
  },
  {
    icon: "🍯",
    title_fr: "L'authenticité", title_ar: "الأصالة", title_en: "Authenticity",
    body_fr: "Des produits que vous ne trouvez pas en supermarché.\n\nMiel artisanal de thym, d'euphorbe et de fleurs. Amlou du Souss en 9 variantes. Olives beldi. Poulet de ferme. Fromages frais. Épices vraies. Nous avons construit un catalogue de 196 produits autour de ce que le Maroc fait de mieux — pas autour de ce qui se vend facilement.",
    body_ar: "منتجات ما كتلقاهاش في السوبرماركت.\n\nعسل طبيعي من الزعتر والدغموس والزهور. أملو سوسي في 9 أنواع. زيتون بلدي. جاج الفرمة. فرماج طازج. توابل حقيقية. بنينا كتالوج من 196 منتج حول أحسن ما عندو المغرب — مش حول ما يتباع بسهولة.",
    body_en: "Products you won't find in a supermarket.\n\nArtisanal thyme, euphorbia and flower honey. Souss amlou in 9 varieties. Beldi olives. Farm chicken. Fresh cheeses. Real spices. We built a catalog of 196 products around the best of what Morocco has to offer — not around what sells easily.",
  },
  {
    icon: "💰",
    title_fr: "La transparence", title_ar: "الوضوح", title_en: "Transparency",
    body_fr: "Des prix fixes, affichés clairement, sans surprise à la livraison.\n\nSalé : 20 MAD · Rabat : 30 MAD · Témara : 40 MAD. Laayayda : gratuit. Vous voyez le total avant de confirmer. Pas de frais cachés, pas de minimum de commande imposé, pas de surprise au moment de payer.",
    body_ar: "أثمنة واضحة، بلا مفاجآت عند التوصيل.\n\nسلا: 20 درهم · الرباط: 30 درهم · تمارة: 40 درهم. لعيايدة: مجاني. كتشوف المجموع قبل ما تأكد. بلا رسوم مخفية، بلا حد أدنى للطلب، بلا مفاجآت عند الدفع.",
    body_en: "Fixed prices, clearly shown, no surprise at delivery.\n\nSalé: 20 MAD · Rabat: 30 MAD · Témara: 40 MAD. Laayayda: free. You see the total before confirming. No hidden fees, no imposed minimum order, no surprise when paying.",
  },
  {
    icon: "📱",
    title_fr: "La simplicité", title_ar: "البساطة", title_en: "Simplicity",
    body_fr: "Commandez en 30 secondes sur WhatsApp ou sur notre site.\n\nPas besoin de créer un compte. Pas besoin de mémoriser un mot de passe. Envoyez votre liste sur WhatsApp et nous nous occupons du reste. Ou parcourez nos 196 produits sur mygreengoo.com et ajoutez ce que vous voulez au panier.",
    body_ar: "اطلب في 30 ثانية على واتساب أو موقعنا.\n\nما محتاجش تعمل حساب. ما محتاجش تتذكر كلمة سر. ابعث قائمتك على واتساب وحنا نتكفلو بالباقي. أو تصفح 196 منتج على mygreengoo.com وزيد اللي بغيتي للسلة.",
    body_en: "Order in 30 seconds on WhatsApp or our website.\n\nNo need to create an account. No password to remember. Send us your list on WhatsApp and we take care of the rest. Or browse our 196 products at mygreengoo.com and add whatever you want to the cart.",
  },
  {
    icon: "✅",
    title_fr: "La garantie", title_ar: "الضمان", title_en: "The guarantee",
    body_fr: "Si un produit ne vous convient pas, on vous rembourse. Sans discussion.\n\nNous livrons avec confiance parce que nous sélectionnons avec soin. Mais si quelque chose ne correspond pas à vos attentes — qualité, fraîcheur, quantité — contactez-nous sur WhatsApp et nous résolvons le problème immédiatement.",
    body_ar: "إلا ما عجبكش أي منتج، كنردو ليك الفلوس. بلا نقاش.\n\nكنوصلو بثقة لأننا كنختارو بعناية. ولكن إلا ما لقيتيش اللي بغيتي — جودة، طازجية، كمية — تواصل معنا على واتساب وغادي نحلو المشكلة فورا.",
    body_en: "If a product doesn't suit you, we refund you. No questions asked.\n\nWe deliver with confidence because we select with care. But if something doesn't match your expectations — quality, freshness, quantity — contact us on WhatsApp and we'll fix it immediately.",
  },
];

const STATS = [
  { value: "66+", label_fr: "Commandes livrées", label_ar: "طلبية موصلة", label_en: "Orders delivered" },
  { value: "196", label_fr: "Produits au catalogue", label_ar: "منتج في الكتالوج", label_en: "Products in catalog" },
  { value: "3", label_fr: "Villes livrées", label_ar: "مدن نخدمها", label_en: "Cities served" },
  { value: "7j/7", label_fr: "8h – 21h", label_ar: "من 8 ص إلى 9 م", label_en: "8am – 9pm" },
];

const COMPARE_ROWS = [
  { criteria_fr: "Délai de livraison", criteria_ar: "وقت التوصيل", criteria_en: "Delivery time", greengo: "⚡ 30 min", supermarche: "🚗 Déplacement", marche: "🚗 Déplacement" },
  { criteria_fr: "Fraîcheur", criteria_ar: "الطازجية", criteria_en: "Freshness", greengo: "🌿 Du jour", supermarche: "⚠️ Variable", marche: "✅ Bonne" },
  { criteria_fr: "Produits locaux", criteria_ar: "منتجات محلية", criteria_en: "Local products", greengo: "✅ 196 produits", supermarche: "❌ Limité", marche: "✅ Saisonnier" },
  { criteria_fr: "Disponibilité", criteria_ar: "التوفر", criteria_en: "Availability", greengo: "7j/7 · 8h–21h", supermarche: "Horaires fixes", marche: "Matin seulement" },
  { criteria_fr: "Prix transparent", criteria_ar: "سعر واضح", criteria_en: "Transparent pricing", greengo: "✅", supermarche: "✅ Étiqueté", marche: "⚠️ À négocier" },
  { criteria_fr: "Commande WhatsApp", criteria_ar: "طلب عبر واتساب", criteria_en: "WhatsApp ordering", greengo: "✅", supermarche: "❌", marche: "❌" },
  { criteria_fr: "Livraison à domicile", criteria_ar: "توصيل لباب الدار", criteria_en: "Home delivery", greengo: "✅", supermarche: "❌", marche: "❌" },
];

export default function WhyUsPage() {
  const { language, dir, isRTL } = useLanguage();
  const l = language as L;
  const font = l === "ar" ? "font-arabic" : "font-latin";

  useSeo({
    title: pick(l,
      "Pourquoi choisir GreenGo Market ? | Salé & Rabat",
      "لماذا تختار جرين غو ماركت؟ | سلا والرباط",
      "Why choose GreenGo Market? | Salé & Rabat"),
    description: pick(l,
      "6 raisons de choisir GreenGo Market à Salé et Rabat. Livraison 30 min, produits frais locaux, prix transparents, qualité garantie.",
      "6 أسباب تجعل جرين غو ماركت الخيار الأفضل للتسوق في سلا والرباط. توصيل 30 دقيقة، منتجات طازجة، أثمنة شفافة.",
      "6 reasons to choose GreenGo Market in Salé and Rabat. 30-min delivery, fresh local products, transparent prices, guaranteed quality."),
  });

  return (
    <div className={"min-h-screen bg-gray-50 " + font}>

      {/* ── HERO ── */}
      <div className="bg-[#0c3228] text-white py-20 px-4 text-center" dir={dir}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            {pick(l, "Pourquoi choisir GreenGo Market ?", "لماذا تختار جرين غو؟", "Why choose GreenGo Market?")}
          </h1>
          <p className="text-green-200 text-lg leading-relaxed">
            {pick(l,
              "Pas parce que c'est pratique. Parce que vous méritez mieux.",
              "مش غير لأنو مريح. بل لأنك تستاهل أحسن.",
              "Not because it's convenient. Because you deserve better.")}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

        {/* ── 6 REASONS ── */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {REASONS.map((reason, i) => (
              <div key={i} dir={dir} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="text-4xl mb-4">{reason.icon}</div>
                <h2 className={"text-lg font-bold text-[#0c3228] mb-1 " + (isRTL ? "text-right" : "text-left")}>
                  {pick(l, reason.title_fr, reason.title_ar, reason.title_en)}
                </h2>
                <div className="space-y-2">
                  {pick(l, reason.body_fr, reason.body_ar, reason.body_en).split("\n\n").map((para, j) => (
                    <p key={j} className={"text-sm text-gray-600 leading-relaxed " + (isRTL ? "text-right" : "text-left")}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(stat => (
              <div key={stat.value} className="bg-[#0c3228] rounded-2xl p-6 text-center text-white">
                <p className="text-3xl font-extrabold text-[#C9A96E] mb-1">{stat.value}</p>
                <p className="text-xs text-green-200 leading-tight">
                  {pick(l, stat.label_fr, stat.label_ar, stat.label_en)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── COMPARATIF ── */}
        <section>
          <h2 className="text-2xl font-bold text-[#0c3228] mb-6 text-center">
            {pick(l, "GreenGo vs les alternatives", "جرين غو مقارنة مع البدائل", "GreenGo vs the alternatives")}
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0c3228] text-white">
                    <th className={"px-4 py-3 font-medium " + (isRTL ? "text-right" : "text-left")}>
                      {pick(l, "Critère", "المعيار", "Criteria")}
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-[#C9A96E]">GreenGo 🌿</th>
                    <th className="px-4 py-3 text-center font-medium opacity-80">
                      {pick(l, "Supermarché", "سوبرماركت", "Supermarket")}
                    </th>
                    <th className="px-4 py-3 text-center font-medium opacity-80">
                      {pick(l, "Marché traditionnel", "السوق التقليدي", "Traditional market")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td dir={dir} className={"px-4 py-3 font-medium text-gray-700 " + (isRTL ? "text-right" : "text-left")}>
                        {pick(l, row.criteria_fr, row.criteria_ar, row.criteria_en)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-[#0c3228]">{row.greengo}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.supermarche}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.marche}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section>
          <div className="bg-[#0c3228] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">
              {pick(l, "Vous avez maintenant toutes les raisons.", "عندك دابا جميع الأسباب.", "You now have every reason.")}
            </h2>
            <p className="text-green-200 mb-8 text-lg">
              {pick(l, "Il ne manque plus qu'une commande.", "ما بقاش غير الطلبية.", "All that's left is to order.")}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/shop"
                className="bg-[#F97316] text-white font-bold px-8 py-3 rounded-full hover:bg-orange-600 transition-colors">
                {pick(l, "Voir le catalogue →", "شوف الكتالوج ←", "View the catalog →")}
              </Link>
              <a href="https://wa.me/212664397031" target="_blank" rel="noopener noreferrer"
                className="bg-[#25D366] text-white font-semibold px-8 py-3 rounded-full hover:bg-green-600 transition-colors">
                📱 {pick(l, "Commander sur WhatsApp", "اطلب على واتساب", "Order on WhatsApp")}
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
