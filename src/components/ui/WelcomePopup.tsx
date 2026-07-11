import { useEffect, useState } from "react";
import { subscribeNewsletter } from "../../services/api";

const WA_URL =
  "https://wa.me/212664397031?text=Bonjour%20GreenGo%20Market%2C%20je%20voudrais%20commander%20%3A%0A";

const BENEFITS = ["Arrivages frais du jour", "Produits de saison disponibles", "Offres exclusives membres"];

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("welcome_shown")) return;
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem("welcome_shown", "1");
    setVisible(false);
  }

  async function handleSubscribe() {
    if (!email || !email.includes("@")) return;
    setLoading(true);
    try {
      await subscribeNewsletter(email, "welcome_popup");
      setSubscribed(true);
      setTimeout(() => dismiss(), 2000);
    } catch {
      // Network hiccup shouldn't block the user from feeling welcomed.
      setSubscribed(true);
      setTimeout(() => dismiss(), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: "wpFadeIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes wpFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wpSlideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "1.25rem",
          maxWidth: 420,
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          animation: "wpSlideUp 0.35s ease",
        }}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c3228] text-3xl shadow-lg">
            🌿
          </div>

          {/* Headline */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-extrabold leading-tight text-[#0c3228]">
              Le marché arrive chez vous.
            </h2>
            <p className="mt-1 text-base font-medium text-[#C9A96E]">Avant tout le monde.</p>
          </div>

          {/* Gold divider */}
          <div className="mx-auto mb-4 h-0.5 w-12 bg-[#C9A96E]" />

          {/* Pitch */}
          <p className="mb-5 text-center text-sm leading-relaxed text-gray-500">
            Les meilleurs produits de Salé et Rabat — annoncés en avant-première aux membres GreenGo.
          </p>

          {/* Benefits */}
          <div className="mb-6 space-y-2.5">
            {BENEFITS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  ✓
                </span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          {subscribed ? (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-700">
              ✅ Bienvenue dans la communauté GreenGo !
            </div>
          ) : (
            <>
              {/* Email form */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0c3228] focus:outline-none focus:ring-1 focus:ring-[#0c3228]"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={loading || !email}
                  className="whitespace-nowrap rounded-xl bg-[#0c3228] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-900 disabled:opacity-50"
                >
                  {loading ? "..." : "Rejoindre →"}
                </button>
              </div>

              {/* WhatsApp CTA — secondary */}
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="mb-3 block w-full rounded-xl bg-[#25D366] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-green-600"
              >
                📱 Commander sur WhatsApp
              </a>
            </>
          )}

          {/* Skip */}
          <button
            onClick={dismiss}
            className="w-full py-1 text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            Continuer sans s'abonner
          </button>
        </div>
      </div>
    </div>
  );
}
