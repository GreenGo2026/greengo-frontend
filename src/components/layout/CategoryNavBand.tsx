// src/components/layout/CategoryNavBand.tsx
// Amazon-style horizontal category strip shown under the header on the
// home and shop pages. Reuses NICHE_CATS from HomePage so the two stay
// in sync — no separate category list to maintain.
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { NICHE_CATS, catLabel } from "../../pages/HomePage";

export default function CategoryNavBand() {
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";

  const showBand = location.pathname === "/" || location.pathname.startsWith("/shop");
  if (!showBand) return null;

  const activeKey = new URLSearchParams(location.search).get("cat") || "all";

  return (
    <nav className={"bg-[#0a2a1e] border-b border-white/10 " + font}>
      <div className="max-w-7xl mx-auto px-4">
        <div className={"flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 " + (isRTL ? "flex-row-reverse" : "")}>
          {NICHE_CATS.map((cat) => {
            const isActive = activeKey === cat.key;
            const to = cat.key === "all" ? "/shop" : `/shop?cat=${encodeURIComponent(cat.key)}`;
            return (
              <Link
                key={cat.key}
                to={to}
                className={
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 " +
                  (isActive ? "bg-[#F97316] text-white" : "text-green-200/80 hover:text-white hover:bg-white/10")
                }
              >
                <span>{cat.emoji}</span>
                <span>{catLabel(cat, language)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
