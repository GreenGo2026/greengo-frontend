// src/components/TestimonialsSection.tsx
import React from "react";

export interface Testimonial {
  id: number | string;
  name: string;
  neighborhood: string;
  text: string;
  rating: number;
  product?: string;
}

interface Props {
  testimonials: Testimonial[];
}

const TestimonialsSection: React.FC<Props> = ({ testimonials }) => {
  if (testimonials.length === 0) return null;

  return (
    <section className="py-10 px-4 bg-[#f8fdf8] rounded-2xl">
      <div className="max-w-5xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#0c3228]">
            Ce que disent nos clients 💬
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {testimonials.length} avis vérifiés — clients à Salé & Rabat
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed italic">
                "{t.text}"
              </p>

              {/* Product tag if present */}
              {t.product && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full w-fit">
                  🛒 {t.product}
                </span>
              )}

              {/* Author */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-50">
                <div className="w-8 h-8 rounded-full bg-[#0c3228] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0c3228]">{t.name}</p>
                  <p className="text-xs text-gray-400">📍 {t.neighborhood}</p>
                </div>
                <span className="ml-auto text-xs text-gray-300">✅ Vérifié</span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Avis collectés auprès de clients réels à Salé et Rabat
          </p>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
