// src/pages/TrackOrderPage.tsx
import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

type L = "fr" | "ar" | "en";

interface TrackingData {
  order_id:           string;
  status:             string;
  driver_name:        string | null;
  driver_phone:       string | null;
  estimated_delivery: string | null;
  created_at:         string;
}

const T = {
  title:     { fr: "Suivi de commande",           ar: "تتبع الطلبية",              en: "Order Tracking"              },
  subtitle:  { fr: "Entrez votre numéro de commande pour suivre en temps réel.", ar: "أدخل رقم طلبيتك لمتابعتها.", en: "Enter your order number to track in real time." },
  input_ph:  { fr: "N° de commande reçu par WhatsApp", ar: "رقم الطلبية من واتساب", en: "Order number from WhatsApp"  },
  track_btn: { fr: "Suivre ma commande",           ar: "تتبع طلبيتي",               en: "Track my order"              },
  not_found: { fr: "Commande introuvable. Vérifiez le numéro et réessayez.", ar: "طلبية غير موجودة. تحقق من الرقم.", en: "Order not found. Check the number and try again." },
  loading:   { fr: "Recherche en cours...",        ar: "جارٍ البحث...",             en: "Searching..."                },
  order_num: { fr: "Commande",                     ar: "طلبية",                     en: "Order"                       },
  driver:    { fr: "Votre livreur",                ar: "سائق التوصيل",              en: "Your driver"                 },
  call:      { fr: "Appeler",                      ar: "اتصل",                      en: "Call"                        },
  no_driver: { fr: "Un livreur vous sera assigné bientôt.", ar: "سيتم تعيين سائق قريباً.", en: "A driver will be assigned soon." },
  help:      { fr: "Besoin d'aide ?",              ar: "هل تحتاج مساعدة؟",          en: "Need help?"                  },
  help_sub:  { fr: "Contactez-nous sur WhatsApp pour toute question.", ar: "تواصل معنا عبر واتساب لأي استفسار.", en: "Contact us on WhatsApp for any question." },
  wa_btn:    { fr: "Contacter le support",         ar: "تواصل مع الدعم",            en: "Contact support"             },
};

const STEPS: { key: string; label: Record<L, string>; emoji: string }[] = [
  { key: "pending",          emoji: "⏳", label: { fr: "Reçue",          ar: "مستلمة",      en: "Received"   } },
  { key: "preparing",        emoji: "📦", label: { fr: "En préparation", ar: "قيد التحضير", en: "Preparing"  } },
  { key: "out_for_delivery", emoji: "🛵", label: { fr: "En livraison",   ar: "في الطريق",   en: "On the way" } },
  { key: "delivered",        emoji: "✅", label: { fr: "Livré",          ar: "تم التوصيل",  en: "Delivered"  } },
];

const RANK: Record<string, number> = {
  pending: 0, preparing: 1, out_for_delivery: 2, delivered: 3, completed: 3, cancelled: -1,
};

function StatusTimeline({ status, lang }: { status: string; lang: string }) {
  const l = lang as L;
  const rank = RANK[status] ?? 0;

  if (status === "cancelled") {
    return (
      <div className="rounded-2xl bg-red-900/20 border border-red-700/40 p-5 text-center">
        <span className="text-4xl block mb-2">❌</span>
        <p className="text-red-400 font-bold text-base">
          {l === "ar" ? "تم إلغاء الطلبية" : l === "fr" ? "Commande annulée" : "Order cancelled"}
        </p>
        <p className="text-white/40 text-xs mt-1">
          {l === "ar" ? "تواصل معنا عبر واتساب." : l === "fr" ? "Contactez-nous sur WhatsApp." : "Contact us on WhatsApp."}
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 mx-8" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-green-500 to-green-400 mx-8 transition-all duration-700"
          style={{ width: rank === 0 ? "0%" : rank === 1 ? "33%" : rank === 2 ? "66%" : "100%" }}
        />
        {STEPS.map((step) => {
          const done   = RANK[step.key] < rank;
          const active = step.key === status || (status === "completed" && step.key === "delivered");
          return (
            <div key={step.key} className="relative flex flex-col items-center gap-2 z-10">
              <div className={
                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 " +
                (done   ? "bg-green-600 shadow-lg shadow-green-600/40" :
                 active ? "bg-green-500 shadow-xl shadow-green-500/50 ring-4 ring-green-500/20 animate-pulse" :
                          "bg-white/[0.08] border border-white/15")
              }>
                {done ? "✓" : step.emoji}
              </div>
              <span className={
                "text-[10px] font-bold text-center max-w-[60px] leading-tight " +
                (done ? "text-green-400" : active ? "text-white" : "text-white/30")
              }>
                {step.label[l]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  const { language, isRTL } = useLanguage();
  const l = language as L;
  const { orderId: paramId } = useParams<{ orderId?: string }>();
  const [searchParams]       = useSearchParams();

  const [orderId, setOrderId] = useState(paramId || searchParams.get("id") || "");
  const [order,   setOrder]   = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

  async function fetchOrder(id: string) {
    if (!id.trim()) return;
    setLoading(true); setError(""); setOrder(null);
    try {
      const r = await fetch(`${API_BASE}/api/v1/orders/${id.trim()}/tracking`);
      if (!r.ok) throw new Error("not found");
      const data: TrackingData = await r.json();
      setOrder(data);
    } catch {
      setError(T.not_found[l]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (paramId) fetchOrder(paramId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchOrder(orderId);
  }

  const shortId = order
    ? order.order_id.slice(-6).toUpperCase()
    : orderId.slice(-6).toUpperCase();

  return (
    <div
      className={language === "ar" ? "font-arabic" : "font-latin"}
      dir={isRTL ? "rtl" : "ltr"}
      style={{ minHeight: "100vh", background: "linear-gradient(160deg,#031409 0%,#061a12 40%,#0a2318 100%)" }}
    >
      <main className="px-4 py-12 max-w-2xl mx-auto">

        {/* Hero */}
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-900/20 border border-amber-700/30 rounded-full px-4 py-1.5 mb-5">
            <span>🛵</span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-amber-300">GreenGo Market</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
            {T.title[l]}
          </h1>
          <div className="h-0.5 w-20 mx-auto my-4 bg-gradient-to-r from-amber-500 to-green-600" />
          <p className="text-white/45 text-sm max-w-sm mx-auto leading-relaxed">{T.subtitle[l]}</p>
        </section>

        {/* Search */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <input
            type="text"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder={T.input_ph[l]}
            dir="ltr"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/15 font-latin"
          />
          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="px-5 py-3 bg-gradient-to-r from-green-700 to-green-900 border border-green-600/50 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            {loading ? "..." : T.track_btn[l]}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-2 border-green-700/30 border-t-green-500 rounded-full animate-spin mb-3" />
            <p className="text-white/40 text-sm">{T.loading[l]}</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl bg-red-900/15 border border-red-700/30 p-5 text-center mb-6">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-red-400 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {order && !loading && (
          <section className="space-y-4">

            {/* Order ref */}
            <div className="bg-white/[0.04] border border-amber-800/20 rounded-2xl p-5">
              <p className="text-white/40 text-xs mb-1">{T.order_num[l]}</p>
              <p className="text-white font-black text-lg font-latin">#{shortId}</p>
            </div>

            {/* Status timeline */}
            <div className="bg-white/[0.04] border border-green-800/20 rounded-2xl p-5">
              <StatusTimeline status={order.status} lang={language} />
            </div>

            {/* Driver info */}
            <div className="bg-white/[0.04] border border-amber-800/20 rounded-2xl p-5">
              {order.driver_name ? (
                <>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-3">{T.driver[l]}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-green-900/40 border border-green-700/30 flex items-center justify-center text-xl flex-shrink-0">
                      🚗
                    </div>
                    <div>
                      <p className="text-white font-bold">{order.driver_name}</p>
                      {order.driver_phone && (
                        <a
                          href={`tel:${order.driver_phone}`}
                          className="text-green-400 text-sm font-semibold hover:underline font-latin"
                        >
                          {T.call[l]} : {order.driver_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-white/40">
                  <span className="text-2xl">🕐</span>
                  <p className="text-sm">{T.no_driver[l]}</p>
                </div>
              )}
            </div>

          </section>
        )}

        {/* Help CTA */}
        <section className="mt-10 text-center">
          <div className="bg-gradient-to-br from-white/5 to-green-900/10 border border-amber-700/20 rounded-3xl p-6">
            <span className="text-3xl block mb-2">💬</span>
            <h2 className="text-white font-black text-base mb-1">{T.help[l]}</h2>
            <p className="text-white/40 text-xs mb-4">{T.help_sub[l]}</p>
            <a
              href={"https://wa.me/212664500789?text=" + encodeURIComponent("Bonjour, ma commande #" + shortId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-700 to-green-900 border border-green-600/50 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              💬 {T.wa_btn[l]}
            </a>
          </div>
        </section>

      </main>

      {/* Breadcrumb pill */}
      <nav
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2 rounded-full text-xs border border-amber-800/20"
        style={{ background: "rgba(6,26,18,0.88)", backdropFilter: "blur(12px)" }}
      >
        <Link to="/" className="text-green-400 font-semibold">GreenGo</Link>
        <span className="text-white/25">/</span>
        <span className="text-amber-400 font-semibold">{T.title[l]}</span>
      </nav>
    </div>
  );
}
