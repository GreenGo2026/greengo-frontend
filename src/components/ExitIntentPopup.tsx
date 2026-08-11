// src/components/ExitIntentPopup.tsx
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "greengo_exit_popup";
const DISCOUNT = 10;
const API = (import.meta.env.VITE_API_URL || "").replace(/[/]+$/, "");

// A "known" visitor already has a cached returning-customer profile from a
// previous checkout (CartPage.tsx's "gg_customer_<phone>" cache) or has
// opened /mon-compte before ("gg_dashboard_phone") -- neither is a perfect
// signal, but both mean this browser has seen this site as a real customer
// before, which is reason enough to skip the first-order welcome offer.
function hasKnownCustomerCache(): boolean {
  if (localStorage.getItem("gg_dashboard_phone")) return true;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("gg_customer_")) return true;
  }
  return false;
}

export default function ExitIntentPopup() {
  const [isNewVisitor] = useState(() => !hasKnownCustomerCache());
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const alreadyShown = () => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (!d) return false;
      return Date.now() - JSON.parse(d).shownAt < 24 * 60 * 60 * 1000;
    } catch { return false; }
  };

  const show = useCallback(() => {
    if (!isNewVisitor || alreadyShown()) return;
    setVisible(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shownAt: Date.now() }));
  }, [isNewVisitor]);

  useEffect(() => {
    if (!isNewVisitor || alreadyShown()) return;

    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) show();
    };
    document.addEventListener("mouseleave", onLeave);

    const timer = window.innerWidth < 1024 ? window.setTimeout(show, 45000) : null;

    return () => {
      document.removeEventListener("mouseleave", onLeave);
      if (timer) window.clearTimeout(timer);
    };
  }, [show, isNewVisitor]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email invalide");
      return;
    }
    // Store the discount for CartPage to pick up:
    localStorage.setItem("greengo_welcome_discount", JSON.stringify({ amount: DISCOUNT, email, createdAt: Date.now() }));
    // Fire-and-forget newsletter signup -- best effort, never blocks the offer:
    fetch(API + "/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "exit_intent" }),
    }).catch(() => { /* ignore -- discount already stored regardless */ });
    setSubmitted(true);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#0c3228] px-6 py-5 relative">
          <button onClick={() => setVisible(false)} aria-label="Fermer" className="absolute top-3 right-3 text-white/60 hover:text-white">
            <X size={18} />
          </button>
          <p className="text-[#C9A96E] text-xs uppercase tracking-wider mb-1">Offre de bienvenue</p>
          <h2 className="text-white text-xl font-bold">
            -{DISCOUNT} MAD
            <span className="text-white/70 text-base font-normal ml-2">sur votre 1ère commande</span>
          </h2>
          <p className="text-green-200 text-xs mt-1">🌿 Livré en 30 min · 7j/7</p>
        </div>
        <div className="px-6 py-5">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-gray-600">Votre email pour recevoir la réduction :</p>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#0c3228] focus:outline-none"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button type="submit" className="w-full bg-[#F97316] text-white font-bold py-3 rounded-xl text-sm hover:bg-orange-600 transition-colors">
                Obtenir ma réduction →
              </button>
              <p className="text-xs text-gray-400 text-center">1ère commande uniquement · Pas de spam</p>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-4xl mb-3">🎉</p>
              <h3 className="font-bold text-[#0c3228] text-lg mb-1">-{DISCOUNT} MAD appliqués !</h3>
              <p className="text-sm text-gray-500 mb-4">Réduction visible dans votre panier.</p>
              <a href="/shop" className="inline-block bg-[#0c3228] text-white font-bold px-6 py-2.5 rounded-xl text-sm">
                Commander maintenant →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
