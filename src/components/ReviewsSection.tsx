// src/components/ReviewsSection.tsx
import { useEffect, useState } from "react";
import { getReviews, type Review } from "../services/api";

interface Props {
  productName?: string;
  category?:    string;
}

export default function ReviewsSection({ productName, category }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang]       = useState<"ar" | "fr">("fr");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReviews({ product: productName, category })
      .then((data) => { if (!cancelled) setReviews(data); })
      .catch(() => { /* silently hide the section on failure */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productName, category]);

  if (loading || reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="mt-10 border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#0c3228]">💬 Avis clients</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`text-sm ${i <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-200"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {avgRating.toFixed(1)} / 5 ({reviews.length} avis)
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setLang("ar")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              lang === "ar" ? "bg-[#0c3228] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            AR
          </button>
          <button
            onClick={() => setLang("fr")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              lang === "fr" ? "bg-[#0c3228] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            FR
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`text-sm ${i <= review.rating ? "text-yellow-400" : "text-gray-200"}`}>
                  ★
                </span>
              ))}
            </div>

            <p className="text-gray-700 text-sm leading-relaxed italic" dir={lang === "ar" ? "rtl" : "ltr"}>
              "{lang === "ar" ? review.text : (review.text_fr || review.text)}"
            </p>

            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-[#0c3228] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {review.customer_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0c3228]">{review.customer_name}</p>
                <p className="text-xs text-gray-400">📍 {review.neighborhood}</p>
              </div>
              {review.verified && (
                <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  ✅ Vérifié
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
