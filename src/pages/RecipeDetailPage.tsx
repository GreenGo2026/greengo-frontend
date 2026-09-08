// src/pages/RecipeDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSeo, useJsonLd } from "../hooks/useSeo";
import { apiClient } from "../services/api";
import { useCartStore, getUnitStep } from "../store/cartStore";

interface Ingredient {
  name_fr: string;
  quantity: number;
  unit: string;
  optional: boolean;
  note_fr: string | null;
  not_in_catalog: boolean;
  unmatched?: boolean;
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

// Recipe quantities are absolute ("500 g carottes"); the cart adds in
// getUnitStep increments and the product unit may differ from the recipe
// unit. Convert to the product's unit, then round to the nearest valid step
// (never below one step).
function recipeQtyToCartStep(quantity: number, recipeUnit: string, productUnit: string): number {
  const r = (recipeUnit || "").toLowerCase().trim();
  const p = (productUnit || "").toLowerCase().trim();
  let qty = quantity;
  if (r === "g" && (p === "kg" || p === "kilo")) qty = quantity / 1000;
  if ((r === "kg" || r === "kilo") && p === "g") qty = quantity * 1000;
  const step = getUnitStep(productUnit);
  const rounded = Math.round(qty / step) * step;
  return rounded > 0 ? Math.round(rounded * 1000) / 1000 : step;
}

// Three distinct states the warn-then-add modal must show separately:
//   available   — matched to a catalog product that is in stock
//   unavailable — matched, but the product is temporarily out of stock
//   notCarried  — no catalog match (unmatched) or deliberately excluded
function partitionIngredients(ingredients: Ingredient[]) {
  const available: Ingredient[] = [];
  const unavailable: Ingredient[] = [];
  const notCarried: Ingredient[] = [];
  for (const ing of ingredients) {
    if (ing.product && ing.product.in_stock) available.push(ing);
    else if (ing.product && !ing.product.in_stock) unavailable.push(ing);
    else notCarried.push(ing);
  }
  return { available, unavailable, notCarried };
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
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const addToCart = useCartStore((s) => s.addToCart);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

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

  function addAvailableToCart(available: Ingredient[]) {
    available.forEach((ing) => {
      if (!ing.product) return;
      // addToCart expects the app's Product shape (name/price_per_unit/unit/
      // available/variant_label) -- not the recipe API's richer ingredient
      // shape, so this is built explicitly rather than passed through.
      const step = recipeQtyToCartStep(ing.quantity, ing.unit, ing.product.unit || "piece");
      addToCart({
        name:           ing.product.name_ar || ing.product.name_fr || "",
        price_per_unit: ing.product.price_mad,
        unit:           ing.product.unit || "piece",
        available:      true,
        variant_label:  null,
      }, step);
    });
    if (available.length > 0) {
      showToast(`${available.length} ingrédient${available.length > 1 ? "s" : ""} ajouté${available.length > 1 ? "s" : ""} à votre panier ✅`);
    }
  }

  function handleAddAll() {
    if (!recipe) return;
    const { available, unavailable, notCarried } = partitionIngredients(recipe.ingredients);

    if (unavailable.length === 0 && notCarried.length === 0) {
      addAvailableToCart(available);
    } else {
      setModalOpen(true);
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

  const { available: availableIngredients, unavailable: unavailableIngredients, notCarried: notCarriedIngredients } =
    partitionIngredients(recipe.ingredients);
  const missingCount = unavailableIngredients.length + notCarriedIngredients.length;

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
            disabled={availableIngredients.length === 0}
            className={
              "w-full py-4 rounded-xl font-bold text-sm transition-all " +
              (availableIngredients.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#0c3228] text-white hover:bg-green-900")
            }
          >
            🛒 Ajouter tous les ingrédients
          </button>

          {missingCount > 0 && (
            <p className="text-xs text-gray-400 text-center mt-2">
              {missingCount} ingrédient{missingCount > 1 ? "s" : ""} non disponible{missingCount > 1 ? "s" : ""} chez GreenGo
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

      {/* Warn-then-add modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-[#0c3228] text-lg mb-1">
              Certains ingrédients ne sont pas disponibles
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Vous pouvez ajouter les ingrédients disponibles maintenant et compléter le reste vous-même.
            </p>

            {availableIngredients.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-green-700 mb-2">
                  ✅ Disponibles ({availableIngredients.length})
                </p>
                <ul className="space-y-1">
                  {availableIngredients.map((ing, i) => (
                    <li key={i} className="flex justify-between text-sm text-gray-700">
                      <span>{ing.quantity} {ing.unit} {ing.name_fr}</span>
                      <span className="text-gray-400">{ing.product?.price_mad} MAD</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(unavailableIngredients.length > 0 || notCarriedIngredients.length > 0) && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 mb-2">
                  ⬜ Non disponibles ({unavailableIngredients.length + notCarriedIngredients.length})
                </p>
                <ul className="space-y-1">
                  {unavailableIngredients.map((ing, i) => (
                    <li key={"u" + i} className="flex justify-between text-sm text-gray-500">
                      <span>{ing.quantity} {ing.unit} {ing.name_fr}</span>
                      <span className="text-gray-400">Rupture de stock</span>
                    </li>
                  ))}
                  {notCarriedIngredients.map((ing, i) => (
                    <li key={"n" + i} className="flex justify-between text-sm text-gray-500">
                      <span>{ing.quantity} {ing.unit} {ing.name_fr}</span>
                      <span className="text-gray-400">{ing.not_in_catalog ? "Épicerie locale" : "Non livré"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { addAvailableToCart(availableIngredients); setModalOpen(false); }}
                disabled={availableIngredients.length === 0}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#0c3228] text-white hover:bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
              >
                Ajouter les disponibles ({availableIngredients.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0c3228] text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
