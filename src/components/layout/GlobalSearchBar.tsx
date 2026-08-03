// src/components/layout/GlobalSearchBar.tsx
// Header search with typo-tolerant, Arabic/French bilingual autocomplete.
// On /shop, syncs with the ?q= param (HomePage reacts to it). On other
// pages, submitting navigates to /shop?q=query.
import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { scoreProduct } from "../../utils/normalize";
import { useLanguage } from "../../contexts/LanguageContext";
import type { DBProduct } from "../../services/api";

const _API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
function resolveImg(url: string | null | undefined): string {
  if (!url || url.trim() === "") return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return _API + url;
  return _API + "/" + url;
}

interface Props {
  products?: DBProduct[];
}

export default function GlobalSearchBar({ products = [] }: Props) {
  const { language, isRTL } = useLanguage();
  const font = language === "ar" ? "font-arabic" : "font-latin";

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DBProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with URL ?q= on /shop
  useEffect(() => {
    if (location.pathname === "/shop") {
      setQuery(searchParams.get("q") || "");
    }
  }, [location.pathname, searchParams]);

  // Compute suggestions with debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!products.length) return;

      const scored = products
        .filter((p) => p.in_stock !== false)
        .map((p) => ({ p, score: scoreProduct(p, query.trim()) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(({ p }) => p);

      setSuggestions(scored);
      setOpen(scored.length > 0);
      setActiveIdx(-1);
    }, 150);

    return () => clearTimeout(timer);
  }, [query, products]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = useCallback(
    (q = query) => {
      const trimmed = q.trim();
      setOpen(false);
      if (!trimmed) return;

      if (location.pathname === "/shop") {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("q", trimmed);
            return next;
          },
          { replace: false }
        );
      } else {
        navigate(`/shop?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [query, location.pathname, setSearchParams, navigate]
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        const product = suggestions[activeIdx];
        setQuery(product.name_fr || "");
        setOpen(false);
        navigate(`/produit/${product.id}`);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    if (location.pathname === "/shop") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("q");
          return next;
        },
        { replace: true }
      );
    }
    inputRef.current?.focus();
  };

  const placeholder =
    language === "ar" ? "ابحث عن خضروات، فواكه، لحوم…" :
    language === "fr" ? "Rechercher légumes, fruits, viande…" :
    "Search vegetables, fruits, meat…";

  const noResultsLabel =
    language === "ar" ? `لا نتائج لـ "${query}"` :
    language === "fr" ? `Aucun résultat pour "${query}"` :
    `No results for "${query}"`;

  const tryOtherLangLabel =
    language === "ar" ? "جرّب بالفرنسية" :
    language === "fr" ? "Essayez en arabe ou en français" :
    "Try in French or Arabic";

  const seeAllLabel =
    language === "ar" ? `عرض كل النتائج لـ "${query}" ←` :
    language === "fr" ? `Voir tous les résultats pour "${query}" →` :
    `See all results for "${query}" →`;

  return (
    <div ref={containerRef} className={"relative w-full max-w-xl " + font}>
      <div
        className={"flex items-center bg-white rounded-xl border border-gray-200 focus-within:border-[#0c3228] focus-within:ring-1 focus-within:ring-[#0c3228] transition-all overflow-hidden " + (isRTL ? "flex-row-reverse" : "")}
      >
        <button
          onClick={() => handleSubmit()}
          aria-label={language === "ar" ? "بحث" : language === "fr" ? "Rechercher" : "Search"}
          className="px-3 text-gray-400 hover:text-[#0c3228] transition-colors flex-shrink-0"
        >
          <Search size={18} />
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          dir={isRTL ? "rtl" : "ltr"}
          placeholder={placeholder}
          className={"flex-1 py-2.5 text-sm bg-transparent outline-none placeholder-gray-400 " + font}
          aria-label={language === "ar" ? "ابحث عن منتج" : language === "fr" ? "Rechercher un produit" : "Search a product"}
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {query && (
          <button onClick={clearSearch} className="px-3 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={16} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
          {suggestions.map((product, i) => (
            <button
              key={product.id}
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(product.name_fr || "");
                setOpen(false);
                navigate(`/produit/${product.id}`);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={"w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors " + (isRTL ? "flex-row-reverse text-right" : "") + " " + (activeIdx === i ? "bg-gray-50" : "hover:bg-gray-50")}
            >
              {resolveImg(product.image_url) ? (
                <img src={resolveImg(product.image_url)} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0c3228] truncate">{product.name_fr}</p>
                {product.name_ar && (
                  <p className="text-xs text-gray-400 truncate" dir="rtl">{product.name_ar}</p>
                )}
              </div>
              <p className="text-sm font-bold text-[#0c3228] flex-shrink-0">
                {product.price_mad.toFixed(2)} MAD
              </p>
            </button>
          ))}

          <button
            onMouseDown={(e) => { e.preventDefault(); handleSubmit(); }}
            className="w-full text-center py-2.5 text-xs text-[#F97316] font-medium border-t border-gray-100 hover:bg-orange-50 transition-colors"
          >
            {seeAllLabel}
          </button>
        </div>
      )}

      {open && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-gray-500">{noResultsLabel}</p>
          <p className="text-xs text-gray-400 mt-1">{tryOtherLangLabel}</p>
        </div>
      )}
    </div>
  );
}
