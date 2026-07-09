// src/pages/AboutPage.tsx
import { Leaf, ShieldCheck, Heart, Zap, Award, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSeo } from "../hooks/useSeo";

export default function AboutPage() {
  const { dir, language, isRTL } = useLanguage();
  useSeo({
    title: "À propos — GreenGo Market | Épicerie locale Salé & Rabat",
    description: "GreenGo Market, votre épicerie fraîche et locale à Salé et Rabat. Produits marocains authentiques livrés en 30 minutes.",
  });
  const font = language === "ar" ? "font-arabic" : "font-latin";
  const ar = language === "ar";
  const fr = language === "fr";

  const T = {
    heroTag:     ar ? "قصتنا"                : fr ? "Notre histoire"              : "Our story",
    heroTitle:   ar ? "طازج من المزرعة لبابك" : fr ? "De la ferme à votre porte"   : "From the farm to your door",
    heroSub:     ar ? "GreenGo — بقالك الإلكتروني الأول فسلا. خضرة وفواكه طازجة مختارة بعناية كل يوم، نوصلها لباب دارك بسرعة وأمان." : fr ? "GreenGo — votre épicerie en ligne à Salé. Fruits et légumes frais sélectionnés chaque jour, livrés rapidement et en toute sécurité." : "GreenGo — Salé's first online grocery. Carefully selected fresh fruits and vegetables delivered fast and safely to your door every day.",
    shopNow:     ar ? "تسوق الآن"            : fr ? "Faire mes courses"            : "Shop now",
    contactUs:   ar ? "تواصل معنا"           : fr ? "Nous contacter"               : "Contact us",
    storyTitle:  ar ? "كيفاش بدات GreenGo؟"  : fr ? "Comment tout a commencé"  : "How it all started",
    storyP1:     ar ? "وُلدت GreenGo Market من قناعة بسيطة: سكان سلا والرباط يستحقون أفضل من سوق مزدحم أو متجر كبير بارد. بدأنا بفكرة، وسيارة صغيرة، ووعد — نوصل منتجات طازجة ومحلية وذات جودة، مباشرة لباب دارك، في 30 دقيقة." : fr ? "GreenGo Market est né d'une conviction simple : les habitants de Salé et Rabat méritent mieux qu'un marché encombré ou une grande surface froide. Nous avons commencé avec une idée, une camionnette et une promesse — livrer des produits frais, locaux et de qualité, directement chez vous, en 30 minutes." : "GreenGo Market was born from a simple conviction: the people of Salé and Rabat deserve better than a crowded market or a cold supermarket. We started with an idea, a small van, and a promise — to deliver fresh, local, quality products straight to your door in 30 minutes.",
    storyP2:     ar ? "اليوم، عائلات في سلا والرباط وتمارة تثق فينا لقضاء حوائجها الطازجة. منتجاتنا تأتي مباشرة من منتجين محليين مغاربة — بدون وسطاء غير ضروريين، وبدون سلسلة تبريد مخترقة." : fr ? "Aujourd'hui, des familles à Salé, Rabat et Témara nous font confiance pour leurs courses fraîches. Nos produits viennent directement des producteurs locaux marocains — sans intermédiaires inutiles, sans chaîne de froid compromise." : "Today, families across Salé, Rabat and Témara trust us for their fresh grocery needs. Our products come directly from local Moroccan producers — no unnecessary middlemen, no broken cold chain.",
    madeWith:    ar ? "صنعناه بحب للمغرب ❤️" : fr ? "Fait avec amour pour le Maroc ❤️" : "Made with love for Morocco ❤️",
    statsTitle:  ar ? "GreenGo بالأرقام"     : fr ? "GreenGo en chiffres"          : "GreenGo by the numbers",
    valuesTitle: ar ? "لماذا تختار جرين غو؟"  : fr ? "Pourquoi choisir GreenGo ?"    : "Why choose GreenGo?",
    ctaTitle:    ar ? "جاهز تطلب؟"           : fr ? "Prêt à commander ?"           : "Ready to order?",
    ctaSub:      ar ? "انضم إلى العائلات التي تثق بنا في سلا والرباط وتمارة." : fr ? "Rejoignez les familles qui nous font confiance à Salé, Rabat et Témara." : "Join the families who trust us in Salé, Rabat and Témara.",
    zonesTitle:  ar ? "مناطق التوصيل"        : fr ? "Nos zones de livraison"        : "Our delivery zones",
  };

  const stats = [
    { value: "66+",   label: ar ? "طلبية تم توصيلها" : fr ? "Commandes livrées"   : "Orders delivered", color: "#2E8B57" },
    { value: "196",   label: ar ? "منتج في الكتالوج" : fr ? "Produits au catalogue" : "Products in catalog", color: "#FF9800" },
    { value: "3",     label: ar ? "مدن نخدمها"       : fr ? "Villes livrées"      : "Cities served",   color: "#C0614A" },
    { value: "7j/7",  label: ar ? "8ص – 9م"          : fr ? "8h – 21h"            : "8am – 9pm",       color: "#4DB882" },
  ];

  const values = [
    { icon: Zap,           color: "#FF9800", bg: "#fff8e1", ring: "#ffe082", title: ar ? "توصيل في 30 دقيقة" : fr ? "Livraison en 30 minutes" : "30-minute delivery", body: ar ? "أسرع توصيل في المنطقة. ليس بعد ساعتين، ولا غداً — الآن." : fr ? "La promesse la plus rapide de la région. Pas en 2h, pas demain. Maintenant." : "The fastest promise in the region. Not in 2h, not tomorrow. Now." },
    { icon: Leaf,          color: "#2E8B57", bg: "#edfbf3", ring: "#a3ebca", title: ar ? "100% محلي"         : fr ? "100% local"              : "100% local",          body: ar ? "خضرنا وفواكهنا وجاجنا ومنتجاتنا الطبيعية تأتي مباشرة من مزارعين مغاربة موثوقين." : fr ? "Nos fruits, légumes, volailles et produits naturels viennent de producteurs marocains de confiance." : "Our fruit, vegetables, poultry and natural products come from trusted Moroccan producers." },
    { icon: Award,         color: "#C9A96E", bg: "#fdf8ef", ring: "#f2ddb4", title: ar ? "منتجات أصيلة"     : fr ? "Produits authentiques"    : "Authentic products",  body: ar ? "عسل طبيعي، أملو سوسي، زيتون بلدي، جاج الفرمة. منتجات لا تجدها في أي سوبرماركت." : fr ? "Miel artisanal, amlou du Souss, olives beldi, poulet de ferme. Des produits que vous ne trouvez pas en supermarché." : "Artisanal honey, Souss amlou, beldi olives, farm chicken. Products you won't find in a supermarket." },
    { icon: MessageCircle, color: "#4DB882", bg: "#edfbf3", ring: "#6DDBA8", title: ar ? "واتساب أولاً"     : fr ? "WhatsApp-first"           : "WhatsApp-first",      body: ar ? "اطلب في 30 ثانية على واتساب أو موقعنا. بسيط، سريع، إنساني." : fr ? "Commandez en 30 secondes sur WhatsApp ou sur notre site. Simple, rapide, humain." : "Order in 30 seconds on WhatsApp or our site. Simple, fast, human." },
    { icon: ShieldCheck,   color: "#C0614A", bg: "#fdf3f0", ring: "#f8c6b8", title: ar ? "جودة مضمونة"     : fr ? "Qualité garantie"        : "Guaranteed quality",  body: ar ? "إذا لم يعجبك أي منتج، نستردّه ونردّ لك المبلغ. رضاك هو أولويتنا." : fr ? "Si un produit ne vous convient pas, on vous rembourse. Sans discussion." : "If a product doesn't suit you, we refund you. No questions asked." },
  ];

  const zones = [
    { city: ar ? "سلا"    : fr ? "Salé"   : "Salé",   note: fr ? "30 min" : "30 min" },
    { city: ar ? "الرباط" : fr ? "Rabat"  : "Rabat",  note: fr ? "30 min" : "30 min" },
    { city: ar ? "تمارة"  : fr ? "Témara" : "Témara", note: fr ? "< 1h"   : "< 1h"   },
  ];

  return (
    <div className={"min-h-screen " + font} style={{ background: "#FAF7F2" }}>

      <section className="hero-gradient zellige-bg-light relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div dir={dir} className={"grid gap-10 md:grid-cols-2 md:items-center"}>
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={"mb-4 flex items-center gap-2 " + (isRTL ? "justify-end" : "justify-start")}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF9800]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF9800]">{T.heroTag}</span>
              </div>
              <h1 className="text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl">{T.heroTitle}</h1>
              <p className="mt-4 text-base leading-relaxed text-white/65 md:text-lg">{T.heroSub}</p>
              <div className={"mt-8 flex flex-wrap gap-3 " + (isRTL ? "justify-end" : "justify-start")}>
                <Link to="/shop" className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-[#2E8B57] shadow-md transition-all hover:shadow-lg active:scale-95">{T.shopNow}</Link>
                <Link to="/contact" className="rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95">{T.contactUs}</Link>
              </div>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm ring-1 ring-white/15 transition-transform hover:-translate-y-1">
                  <span className="text-4xl font-extrabold text-white">{s.value}</span>
                  <span className="mt-2 text-xs font-semibold text-white/60">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-14" style={{ background: "linear-gradient(to top, #FAF7F2, transparent)" }} />
      </section>

      <div className="grid grid-cols-2 gap-4 px-4 py-8 mx-auto max-w-5xl md:hidden">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
            <span className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="mt-1 text-xs font-semibold text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div dir={dir} className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="relative order-2 md:order-none">
              <div className="zellige-bg-dark absolute inset-0 rounded-3xl opacity-30" />
              <div className="relative overflow-hidden rounded-3xl shadow-xl" style={{ background: "linear-gradient(135deg, #0d3b36 0%, #1a5c4a 60%, #2E8B57 100%)", minHeight: "320px" }}>
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
                  <Leaf size={64} className="text-white/20" strokeWidth={0.8} />
                  <div className="h-px w-16 bg-white/20" />
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    {["🥕 Carottes", "🍅 Tomates", "🥬 Légumes", "🍊 Fruits"].map((item) => (
                      <div key={item} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 backdrop-blur-sm">{item}</div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF9800]" />
                    <span className="text-xs font-bold text-[#FF9800] uppercase tracking-widest">Fresh Daily</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <h2 className="text-2xl font-extrabold text-gray-800 md:text-3xl">{T.storyTitle}</h2>
              <div className="mt-2 h-1 w-12 rounded-full" style={{ background: "linear-gradient(90deg, #2E8B57, #FF9800)", marginLeft: isRTL ? "auto" : "0" }} />
              <p className="mt-5 text-base leading-relaxed text-gray-600">{T.storyP1}</p>
              <p className="mt-3 text-base leading-relaxed text-gray-600">{T.storyP2}</p>
              <div className={"mt-6 flex items-center gap-2 " + (isRTL ? "justify-end" : "justify-start")}>
                <Heart size={16} className="text-[#C0614A]" />
                <span className="text-sm font-bold text-[#C0614A]">{T.madeWith}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20" style={{ background: "linear-gradient(135deg, #f0faf4 0%, #FAF7F2 50%, #fff8e1 100%)" }}>
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold text-gray-800 md:text-3xl">{T.valuesTitle}</h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full" style={{ background: "linear-gradient(90deg, #2E8B57, #FF9800)" }} />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} dir={dir} className={"group flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg " + (isRTL ? "flex-row-reverse text-right" : "text-left")}>
                  <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: v.bg, boxShadow: "0 0 0 2px " + v.ring }}>
                    <Icon size={20} style={{ color: v.color }} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-800">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{v.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-extrabold text-gray-800 md:text-3xl">📍 {T.zonesTitle}</h2>
          <div className="mx-auto mt-3 mb-8 h-1 w-12 rounded-full" style={{ background: "linear-gradient(90deg, #2E8B57, #FF9800)" }} />
          <div className="flex flex-wrap justify-center gap-4">
            {zones.map((z) => (
              <div key={z.city} className="rounded-2xl bg-white px-8 py-4 shadow-sm ring-1 ring-black/5">
                <p className="font-extrabold text-gray-800">{z.city}</p>
                <p className="mt-1 text-xs font-bold" style={{ color: "#FF9800" }}>⚡ {z.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero-gradient zellige-bg-light relative overflow-hidden py-16 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-xl px-4">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
            <Leaf size={32} className="text-white/60" strokeWidth={1.5} />
          </div>
          <h2 className={"text-2xl font-extrabold text-white md:text-3xl " + font}>{T.ctaTitle}</h2>
          <p className={"mt-3 text-base text-white/65 " + font}>{T.ctaSub}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-extrabold text-[#2E8B57] shadow-lg transition-all hover:shadow-xl active:scale-95">
              <Leaf size={15} />
              {T.shopNow}
            </Link>
            <a href="https://wa.me/212664397031" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:shadow-xl active:scale-95">
              📱 {ar ? "اطلب على واتساب" : fr ? "Commander sur WhatsApp" : "Order on WhatsApp"}
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}