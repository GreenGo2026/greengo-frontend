// src/pages/RecipeDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSeo, useJsonLd } from "../hooks/useSeo";
import { apiClient } from "../services/api";
import { useCartStore } from "../store/cartStore";

interface Ingredient {
  name_fr: string;
  quantity: number;
  unit: string;
  optional: boolean;
  note_fr: string | null;
  not_in_catalog: boolean;
  product: {
    id: string;
    name_fr: string | null;
    name_ar: string;
    price_mad: number;
    unit: string;
    image_url: string | null;
    in_stock: boolean;
  } | null;
}

interface Recipe {
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  emoji: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  ingredients: Ingredient[];
  estimated_price_mad: number;
  ingredients_available: number;
  ingredients_total: number;
}

export default function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);

  useEffect(() => {
    if (!slug) return;
    apiClient.get(`/recipes/${slug}`)
      .then((res) => setRecipe(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useSeo({
    title: recipe ? `${recipe.name_fr} — Recette & Ingrédients | GreenGo Market` : "Recette | GreenGo Market",
    description: recipe ? `${recipe.description_fr} Tous les ingrédients livrés en 30 min à Salé et Rabat.` : "",
  });

  // Rich snippet — Schema.org Recipe
  useJsonLd("recipe-ld", recipe ? {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.name_fr,
    "description": recipe.description_fr,
    "author": { "@type": "Organization", "name": "GreenGo Market", "url": "https://www.mygreengoo.com" },
    "recipeYield": `${recipe.servings} personnes`,
    "prepTime": `PT${recipe.prep_time_min}M`,
    "cookTime": `PT${recipe.cook_time_min}M`,
    "totalTime": `PT${recipe.prep_time_min + recipe.cook_time_min}M`,
    "recipeIngredient": recipe.ingredients.map((ing) => `${ing.quantity} ${ing.unit} ${ing.name_fr}`),
    "recipeInstructions": [{
      "@type": "HowToStep",
      "text": "Commandez tous les ingrédients sur mygreengoo.com et recevez-les en 30 min.",
    }],
    "image": "https://www.mygreengoo.com/og-image.jpg",
    "publisher": { "@type": "Organization", "name": "GreenGo Market", "url": "https://www.mygreengoo.com" },
  } : {}) ;

  function handleAddAll() {
    if (!recipe) return;

    let count = 0;
    recipe.ingredients.forEach((ing) => {
      if (!ing.product || !ing.product.in_stock) return;

      // addToCart expects the app's Product shape (name/price_per_unit/unit/
      // available/variant_label) -- not the recipe API's richer ingredient
      // shape, so this is built explicitly rather than passed through.
      addToCart({
        name:           ing.product.name_ar || ing.product.name_fr || "",
        price_per_unit: ing.product.price_mad,
        unit:           ing.product.unit || "piece",
        available:      true,
        variant_label:  null,
      }, 1);
      count++;
    });

    if (count > 0) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Recette introuvable.</p>
          <Link to="/recettes" className="text-[#F97316] underline">← Toutes les recettes</Link>
        </div>
      </div>
    );
  }

  const availableIngredients = recipe.ingredients.filter((i) => i.product && i.product.in_stock);
  const unavailableIngredients = recipe.ingredients.filter((i) => !i.product || i.not_in_catalog);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#0c3228] text-white py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Link to="/recettes" className="text-green-200/60 text-xs hover:text-green-200 transition-colors mb-4 inline-block">
            ← Toutes les recettes
          </Link>
          <div className="text-7xl mb-4">{recipe.emoji}</div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{recipe.name_fr}</h1>
          <p className="text-green-200/80 text-sm" dir="rtl">{recipe.name_ar}</p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-green-200/70">
            <span>👥 {recipe.servings} personnes</span>
            <span>⏱️ Prépa : {recipe.prep_time_min} min</span>
            {recipe.cook_time_min > 0 && <span>🔥 Cuisson : {recipe.cook_time_min} min</span>}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <p className="text-gray-600 leading-relaxed">{recipe.description_fr}</p>

        {/* Add all CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-[#0c3228]">Ingrédients disponibles</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {availableIngredients.length}/{recipe.ingredients_total} en stock · Livrés en 30 min
              </p>
            </div>
            {recipe.estimated_price_mad > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Estimation</p>
                <p className="font-bold text-lg text-[#0c3228]">~{recipe.estimated_price_mad} MAD</p>
              </div>
            )}
          </div>

          {/* Ingredient list */}
          <div className="space-y-2 mb-5">
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className={"flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 " + (ing.not_in_catalog || !ing.product ? "opacity-50" : "")}>
                {ing.product?.image_url ? (
                  <img src={ing.product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {ing.quantity} {ing.unit} {ing.name_fr}
                    {ing.optional && <span className="text-gray-400 text-xs ml-1">(optionnel)</span>}
                  </p>
                  {ing.note_fr && <p className="text-xs text-gray-400">{ing.note_fr}</p>}
                </div>

                <div className="shrink-0 text-right">
                  {ing.product && !ing.not_in_catalog ? (
                    <p className="text-sm font-medium text-[#0c3228]">{ing.product.price_mad} MAD</p>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Non livré</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add all button */}
          <button
            onClick={handleAddAll}
            disabled={availableIngredients.length === 0 || added}
            className={
              "w-full py-4 rounded-xl font-bold text-sm transition-all " +
              (added
                ? "bg-green-500 text-white"
                : availableIngredients.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#0c3228] text-white hover:bg-green-900")
            }
          >
            {added
              ? `✓ ${availableIngredients.length} ingrédients ajoutés !`
              : `🛒 Ajouter ${availableIngredients.length} ingrédients au panier`}
          </button>

          {unavailableIngredients.length > 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              {unavailableIngredients.length} ingrédient{unavailableIngredients.length > 1 ? "s" : ""} à compléter en épicerie locale
            </p>
          )}
        </div>

        {/* WhatsApp share */}
        <a
          href={"https://wa.me/?text=" + encodeURIComponent(
            `🍽️ Recette : ${recipe.name_fr}\n\n${recipe.description_fr}\n\nCommandez les ingrédients frais chez GreenGo :\nhttps://www.mygreengoo.com/recettes/${recipe.slug}`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-green-600 transition-colors"
        >
          📱 Partager cette recette
        </a>

        <div className="text-center">
          <Link to="/recettes" className="text-sm text-gray-400 hover:text-[#0c3228] transition-colors">
            ← Voir toutes les recettes
          </Link>
        </div>

      </div>
    </div>
  );
}
