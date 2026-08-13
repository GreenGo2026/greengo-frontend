// src/pages/RecipesPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSeo } from "../hooks/useSeo";
import { apiClient } from "../services/api";

interface RecipeSummary {
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  emoji: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  estimated_price_mad: number | null;
  ingredients_available?: number;
  ingredients_total?: number;
}

export default function RecipesPage() {
  useSeo({
    title: "Recettes Marocaines — Ingrédients livrés en 30 min | GreenGo Market",
    description: "Couscous, Tajine, Rfissa, Salade marocaine — commandez tous les ingrédients frais en 1 clic. Livraison en 30 min à Salé, Rabat et Témara.",
  });

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/recipes")
      .then((res) => setRecipes(res.data.recipes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#0c3228] text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs bg-green-800 text-green-200 px-3 py-1 rounded-full font-medium uppercase tracking-wide">
            Recettes · وصفات
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-3">
            Recettes Marocaines
            <span className="block text-[#C9A96E] mt-1">Ingrédients livrés en 30 min</span>
          </h1>
          <p className="text-green-200 text-sm">
            Choisissez votre recette et ajoutez tous les ingrédients au panier en 1 clic
          </p>
        </div>
      </div>

      {/* Recipe grid */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement des recettes...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.slug}
                to={`/recettes/${recipe.slug}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="bg-[#0c3228]/5 py-8 text-center text-6xl group-hover:scale-110 transition-transform duration-200">
                  {recipe.emoji}
                </div>
                <div className="p-5">
                  <h2 className="font-bold text-[#0c3228] text-lg">{recipe.name_fr}</h2>
                  <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{recipe.name_ar}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{recipe.description_fr}</p>

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>👥 {recipe.servings} pers.</span>
                    <span>⏱️ {recipe.prep_time_min + recipe.cook_time_min} min</span>
                    {recipe.estimated_price_mad != null && (
                      <span className="ml-auto font-bold text-[#0c3228] text-sm">
                        ~{recipe.estimated_price_mad} MAD
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {recipe.ingredients_available ?? "—"} ingrédients disponibles
                    </span>
                    <span className="text-xs text-[#F97316] font-medium">Voir la recette →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
