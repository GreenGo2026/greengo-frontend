import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const WA_URL =
  "https://wa.me/212664397031?text=Bonjour%20GreenGo%20Market%2C%20je%20voudrais%20commander%20%3A%0A";

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false);

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
        {/* Header band */}
        <div style={{
          background: "linear-gradient(135deg,#1a5c35 0%,#2E8B57 100%)",
          padding: "1.5rem 1.5rem 1.25rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌿</div>
          <h2 style={{
            margin: 0, color: "#fff",
            fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em",
          }}>
            Bienvenue chez GreenGo Market
          </h2>
          <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.82)", fontSize: "0.9rem" }}>
            Fruits &amp; légumes frais livrés à domicile
          </p>
          <p dir="rtl" style={{ margin: "0.3rem 0 0", color: "rgba(255,255,255,0.65)", fontSize: "0.82rem" }}>
            مرحباً بك في جرين غو ماركت 🌿
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem" }}>
          {/* Offer box */}
          <div style={{
            background: "#f0f7f0",
            borderRadius: "0.9rem",
            padding: "1rem 1.1rem",
            marginBottom: "1.25rem",
            textAlign: "center",
          }}>
            <p style={{ margin: 0, color: "#0c3228", fontSize: "1.05rem", fontWeight: 700 }}>
              ⚡ Livraison en 30 min
            </p>
            <p style={{ margin: "0.4rem 0 0", color: "#4b5563", fontSize: "0.85rem", lineHeight: 1.5 }}>
              Fruits • Légumes • Volailles • Miel
              <br />
              Salé &amp; Rabat — 7j/7 de 8h à 21h
            </p>
          </div>

          {/* Catalogue CTA */}
          <Link
            to="/shop"
            onClick={dismiss}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              background: "#0c3228", color: "#fff",
              padding: "0.85rem 1.5rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 700, fontSize: "1rem",
              marginBottom: "0.75rem",
              transition: "filter 0.15s",
            }}
          >
            Voir le catalogue →
          </Link>

          {/* WhatsApp CTA */}
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
              background: "#25D366", color: "#fff",
              padding: "0.85rem 1.5rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 700, fontSize: "1rem",
              boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
              marginBottom: "0.75rem",
              transition: "filter 0.15s",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.476 2.027 7.782L.057 31.01
                a1 1 0 001.225 1.225l7.228-1.97A15.94 15.94 0 0016 32c8.837 0 16-7.163
                16-16S24.837 0 16 0zm8.31 22.897c-.352.99-1.74 1.813-2.847
                2.051-.759.162-1.75.292-5.087-1.093-4.267-1.739-7.013-6.056-7.228-6.336
                -.208-.28-1.756-2.338-1.756-4.46 0-2.122 1.112-3.163
                1.506-3.596.395-.432.861-.54 1.147-.54.287 0 .574.003.826.015.264.013.619
                -.1.968.74.36.861.87 2.647.946 2.84.077.194.128.42.025.677-.102.257-.154.416
                -.306.64-.154.224-.323.5-.46.67-.154.19-.314.394-.135.773.18.38.8 1.318
                1.715 2.135 1.178 1.05 2.172 1.375 2.55 1.53.378.153.598.128.818-.077.22
                -.205.94-1.093 1.19-1.468.25-.374.5-.312.84-.187.34.124 2.16 1.018 2.53
                1.202.37.184.616.275.706.43.09.154.09.893-.262 1.883z"/>
            </svg>
            Commander sur WhatsApp
          </a>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            style={{
              width: "100%", padding: "0.7rem",
              background: "transparent",
              border: "1.5px solid #d1d5db",
              borderRadius: "0.75rem",
              color: "#6b7280", fontSize: "0.9rem", fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Continuer sur le site
          </button>
        </div>
      </div>
    </div>
  );
}
