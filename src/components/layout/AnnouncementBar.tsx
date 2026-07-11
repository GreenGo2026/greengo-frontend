// src/components/layout/AnnouncementBar.tsx
// Rendered inside PublicShell (App.tsx), which admin routes (/gestion*) never
// mount at all ("fully standalone, no Header/Footer, no public shell") -- so
// this never needs its own path check to stay off the admin panel.
import { useState } from "react";

const STORAGE_KEY = "gg_announcement_dismissed";

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative flex items-center justify-center gap-2 bg-[#0c3228] px-4 py-2 text-center text-xs text-white sm:text-sm">
      <p className="leading-relaxed">
        {/* Full text — desktop */}
        <span className="hidden sm:inline">
          ⚡ Livraison en 30 min — <span className="font-semibold">Salé 20 MAD</span> ·{" "}
          <span className="font-semibold">Rabat 30 MAD</span> ·{" "}
          <span className="font-semibold">Témara 40 MAD</span> ·{" "}
          <span className="text-green-300">7j/7 de 8h à 21h</span>
        </span>
        {/* Short text — mobile */}
        <span className="sm:hidden">
          ⚡ 30 min · Salé 20 · Rabat 30 · Témara 40 MAD
        </span>
      </p>

      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none text-green-300 opacity-60 transition-colors hover:text-white hover:opacity-100"
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
