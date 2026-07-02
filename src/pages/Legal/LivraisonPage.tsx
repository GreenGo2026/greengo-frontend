// src/pages/Legal/LivraisonPage.tsx
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";

const GREEN  = "#2E8B57";
const GOLD   = "#C9A96E";
const DARK   = "#0c3228";
const ORANGE = "#F97316";

const ZONES = [
  {
    city: "Salé", ar: "سلا",
    areas: "Laayayda, Hay Salam, Tabriquet, Bettana, Hay Karima",
    time: "30 min", bg: GREEN,
  },
  {
    city: "Rabat", ar: "الرباط",
    areas: "Agdal, Hassan, Les Orangers, Hay Riad, Diour Jamaa",
    time: "30 min", bg: GREEN,
  },
  {
    city: "Témara", ar: "تمارة",
    areas: "Centre-ville, Ouled Mtaa",
    time: "< 1h", bg: ORANGE,
  },
];

const STEPS = [
  {
    n: "1", icon: "🛒",
    fr: { title: "Ajoutez vos produits",      body: "Parcourez notre catalogue et ajoutez vos produits frais au panier en quelques clics." },
    ar: { title: "أضف منتجاتك", body: "تصفح كتالوجنا وأضف منتجاتك الطازجة إلى السلة بضغطات قليلة." },
  },
  {
    n: "2", icon: "📝",
    fr: { title: "Confirmez votre commande",   body: "Remplissez le formulaire avec votre adresse et choisissez votre mode de paiement (espèces ou carte)." },
    ar: { title: "أكد طلبك",               body: "أدخل عنوانك واختر طريقة الدفع (نقد أو بطاقة)." },
  },
  {
    n: "3", icon: "💬",
    fr: { title: "Confirmation WhatsApp",      body: "Notre équipe confirme votre commande sur WhatsApp dans les 30 minutes et vous donne l'heure de livraison." },
    ar: { title: "تأكيد عبر واتساب", body: "يؤكد فريقنا طلبك عبر واتساب خلال 30 دقيقة ويحدد وقت التوصيل." },
  },
  {
    n: "4", icon: "⚡",
    fr: { title: "Livraison à domicile",       body: "Votre commande arrive fraîche à votre porte en 30 minutes à Salé et Rabat." },
    ar: { title: "توصيل إلى بابك",  body: "يصل طلبك طازجاً إلى بابك في 30 دقيقة في سلا والرباط." },
  },
];

const PRICING = [
  { fr: "Zone Salé (Laayayda)",         ar: "منطقة سلا (Laayayda)", priceFr: "Gratuit",       priceAr: "مجاني", free: true  },
  { fr: "Salé — autres quartiers", ar: "سلا — أحياء أخرى",    priceFr: "Nous contacter", priceAr: "اسأل عبر واتساب", free: false },
  { fr: "Rabat",                         ar: "الرباط",                          priceFr: "Nous contacter", priceAr: "اسأل عبر واتساب", free: false },
  { fr: "Témara",                        ar: "تمارة",                                priceFr: "Nous contacter", priceAr: "اسأل عبر واتساب", free: false },
];

export default function LivraisonPage() {
  const { language, isRTL } = useLanguage();
  const ar   = language === "ar";
  const font = ar ? "font-arabic" : "font-latin";
  const dir  = isRTL ? "rtl" : "ltr";

  return (
    <div className={font} dir={dir} style={{ background: "#FAF7F2", minHeight: "100vh" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: `linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,${GREEN} 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}
          >
            {ar ? "سلا و الرباط" : "Salé & Rabat"}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem,5vw,3rem)",
              fontWeight: 700, color: "#fff", fontStyle: "italic", lineHeight: 1.1,
            }}
          >
            {ar ? "التوصيل إلى بابك" : "Livraison à votre porte"}
          </h1>
          <p className="text-white/60 mt-3 text-base max-w-lg mx-auto">
            {ar
              ? "توصيل سريع في سلا والرباط في 30 دقيقة — طازج كل يوم من الساعة 8 إلى 20"
              : "Produits frais livrés en 30 minutes — 7j/7 de 8h à 20h"}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto">
            {[
              { v: "30 min", l: ar ? "توصيل"  : "Livraison"     },
              { v: "7j/7",   l: ar ? "كل يوم" : "Disponible"    },
              { v: "100%",   l: ar ? "طازج"        : "Frais garanti" },
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

        {/* ── Zones de livraison ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📍</span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic",
              }}
            >
              {ar ? "مناطق التوصيل" : "Zones de livraison"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ZONES.map((z, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-base">{ar ? z.ar : z.city}</h3>
                    <p className={`text-xs text-gray-400 ${ar ? "font-latin" : "font-arabic"}`}>
                      {ar ? z.city : z.ar}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-black text-white"
                    style={{ background: z.bg }}
                  >
                    {z.time}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{z.areas}</p>
              </div>
            ))}
          </div>

          <div
            className="mt-4 rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "#fff8e6", border: `1px solid ${GOLD}40` }}
          >
            <span className="text-lg shrink-0">⚠️</span>
            <p className="text-sm text-amber-800">
              {ar
                ? "نوصل حالياً فقط إلى سلا والرباط وتمارة. إذا كنت خارج هذه المناطق، تواصل معنا عبر واتساب قبل الطلب."
                : "Nous livrons actuellement à Salé, Rabat et Témara uniquement. Si vous êtes hors zone, contactez-nous sur WhatsApp avant de commander."}
            </p>
          </div>
        </section>

        {/* ── Comment ça marche ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🚚</span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic",
              }}
            >
              {ar ? "كيف تعمل الخدمة" : "Comment ça marche ?"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((s, i) => {
              const t = ar ? s.ar : s.fr;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl font-black text-white"
                    style={{ background: `linear-gradient(135deg,${DARK},${GREEN})`, minWidth: 40 }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-800 text-sm mb-1">{t.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Frais de livraison ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">💰</span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem", fontWeight: 700, color: DARK, fontStyle: "italic",
              }}
            >
              {ar ? "تكلفة التوصيل" : "Frais de livraison"}
            </h2>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {PRICING.map((row, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-gray-50" : ""}`}
              >
                <span className="text-sm text-gray-700 font-semibold">{ar ? row.ar : row.fr}</span>
                {row.free ? (
                  <span className="text-xs font-bold rounded-lg px-3 py-1.5 bg-green-100 text-green-700">
                    {ar ? row.priceAr : row.priceFr}
                  </span>
                ) : (
                  <a
                    href="https://wa.me/212664500789"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                    style={{ background: "#f0fdf4", color: GREEN, border: "1px solid #bbf7d0" }}
                  >
                    {ar ? row.priceAr : row.priceFr}
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {ar
              ? "أسعار التوصيل تختلف حسب المنطقة وحجم الطلب. تواصل معنا للتفاصيل."
              : "Les frais varient selon votre adresse et le montant de la commande. Contactez-nous pour un devis précis."}
          </p>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section
          className="rounded-3xl p-8 text-center text-white"
          style={{ background: `linear-gradient(135deg,#0d3b36,${GREEN})` }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.6rem", fontWeight: 700, fontStyle: "italic", marginBottom: "0.5rem",
            }}
          >
            {ar ? "جاهز للطلب؟" : "Prêt à commander ?"}
          </h2>
          <p className="text-white/60 text-sm mb-6">
            {ar
              ? "أضف منتجاتك واحصل على توصيل سريع"
              : "Ajoutez vos produits et recevez-les frais à domicile"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/shop"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold transition-all hover:scale-105"
              style={{ background: GOLD, color: "#fff" }}
            >
              {ar ? "تسوق الآن" : "Voir le catalogue"}
            </Link>
            <a
              href="https://wa.me/212664500789"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl px-6 py-3 text-sm font-extrabold border border-white/30 hover:bg-white/10 transition-all"
            >
              {ar ? "تواصل عبر واتساب" : "Contacter sur WhatsApp"}
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
