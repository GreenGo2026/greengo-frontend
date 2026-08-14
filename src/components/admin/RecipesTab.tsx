// src/components/admin/RecipesTab.tsx
import { useState, useEffect } from "react";
import { apiClient } from "../../services/api";
import { Plus, Pencil, Eye, EyeOff, Trash2, ArrowLeft } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RecipeSummary {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  emoji: string;
  visible: boolean;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  ingredients_count: number;
}

interface Ingredient {
  name_fr: string;
  quantity: number;
  unit: string;
  optional: boolean;
  note_fr: string;
  not_in_catalog: boolean;
}

interface RecipeFull extends RecipeSummary {
  description_fr: string;
  ingredients: Ingredient[];
}

const EMPTY_INGREDIENT: Ingredient = {
  name_fr: "",
  quantity: 1,
  unit: "pièce",
  optional: false,
  note_fr: "",
  not_in_catalog: false,
};

const EMPTY_RECIPE: Partial<RecipeFull> = {
  name_fr: "",
  name_ar: "",
  description_fr: "",
  emoji: "🍽️",
  servings: 4,
  prep_time_min: 20,
  cook_time_min: 45,
  visible: true,
  ingredients: [{ ...EMPTY_INGREDIENT }],
};

// ── Main component ───────────────────────────────────────────────────────────
export default function RecipesTab() {
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [editRecipe, setEditRecipe] = useState<RecipeFull | null>(null);
  const [form, setForm] = useState<Partial<RecipeFull>>({ ...EMPTY_RECIPE, ingredients: [{ ...EMPTY_INGREDIENT }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/recipes/admin/list");
      setRecipes(res.data.recipes || []);
    } catch {
      setError("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipes(); }, []);

  const openEdit = async (id: string) => {
    try {
      const res = await apiClient.get(`/recipes/admin/${id}`);
      const r = res.data;
      setEditRecipe(r);
      setForm({ ...r, ingredients: r.ingredients?.length ? r.ingredients : [{ ...EMPTY_INGREDIENT }] });
      setView("edit");
      setError("");
    } catch {
      setError("Erreur de chargement");
    }
  };

  const openCreate = () => {
    setEditRecipe(null);
    setForm({ ...EMPTY_RECIPE, ingredients: [{ ...EMPTY_INGREDIENT }] });
    setView("create");
    setError("");
  };

  const handleSave = async () => {
    if (!form.name_fr?.trim()) {
      setError("Le nom FR est requis");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (view === "edit" && editRecipe?.id) {
        await apiClient.patch(`/recipes/admin/${editRecipe.id}`, form);
      } else {
        await apiClient.post("/recipes/admin", form);
      }
      await fetchRecipes();
      setView("list");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await apiClient.patch(`/recipes/admin/${id}/toggle-visible`);
      setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, visible: !r.visible } : r)));
    } catch {
      setError("Erreur");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer la recette "${name}" ?`)) return;
    try {
      await apiClient.delete(`/recipes/admin/${id}`);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Erreur de suppression");
    }
  };

  const handleSeed = async () => {
    try {
      await apiClient.post("/recipes/seed");
      fetchRecipes();
    } catch {
      setError("Erreur lors du seed");
    }
  };

  const setIngredient = (i: number, field: keyof Ingredient, value: any) => {
    setForm((f) => {
      const ings = [...(f.ingredients || [])];
      ings[i] = { ...ings[i], [field]: value };
      return { ...f, ingredients: ings };
    });
  };

  const addIngredient = () => {
    setForm((f) => ({ ...f, ingredients: [...(f.ingredients || []), { ...EMPTY_INGREDIENT }] }));
  };

  const removeIngredient = (i: number) => {
    setForm((f) => ({ ...f, ingredients: (f.ingredients || []).filter((_, idx) => idx !== i) }));
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#0c3228] focus:outline-none";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  if (view === "list") return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[#0c3228]">Recettes ({recipes.length})</h2>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-[#0c3228] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-900 transition-colors">
          <Plus size={16} />
          Nouvelle recette
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Chargement...</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-sm mb-4">Aucune recette. Créez la première ou seedez les 4 recettes initiales.</p>
          <button onClick={handleSeed} className="text-sm text-[#F97316] underline">
            Seeder les 4 recettes initiales
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Recette</th>
                <th className="px-4 py-3 text-center">Ingrédients</th>
                <th className="px-4 py-3 text-center">Temps</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{r.emoji}</span>
                      <div>
                        <p className="font-medium text-gray-800">{r.name_fr}</p>
                        <p className="text-xs text-gray-400" dir="rtl">{r.name_ar}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.ingredients_count}</td>
                  <td className="px-4 py-3 text-center text-gray-600 text-xs">{r.prep_time_min + r.cook_time_min} min</td>
                  <td className="px-4 py-3 text-center">
                    <span className={"text-xs px-2 py-1 rounded-full font-medium " + (r.visible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                      {r.visible ? "Visible" : "Masqué"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(r.id)} className="p-1.5 text-gray-400 hover:text-[#0c3228] transition-colors" title="Modifier">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleToggle(r.id)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title={r.visible ? "Masquer" : "Afficher"}>
                        {r.visible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => handleDelete(r.id, r.name_fr)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── FORM VIEW (create or edit) ───────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setView("list")} className="text-gray-400 hover:text-[#0c3228] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-[#0c3228]">
          {view === "create" ? "Nouvelle recette" : `Modifier : ${editRecipe?.name_fr}`}
        </h2>
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-600">Informations générales</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Emoji / Icône</label>
            <input className={inputCls} value={form.emoji || ""} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Nombre de personnes</label>
            <input type="number" className={inputCls} value={form.servings || 4}
              onChange={(e) => setForm((f) => ({ ...f, servings: parseInt(e.target.value) || 1 }))} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Nom (FR) *</label>
          <input className={inputCls} value={form.name_fr || ""} onChange={(e) => setForm((f) => ({ ...f, name_fr: e.target.value }))} />
        </div>

        <div>
          <label className={labelCls}>Nom (AR)</label>
          <input className={inputCls} dir="rtl" value={form.name_ar || ""} onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))} />
        </div>

        <div>
          <label className={labelCls}>Description (FR)</label>
          <textarea className={inputCls + " h-24"} value={form.description_fr || ""} onChange={(e) => setForm((f) => ({ ...f, description_fr: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Préparation (min)</label>
            <input type="number" className={inputCls} value={form.prep_time_min || 0}
              onChange={(e) => setForm((f) => ({ ...f, prep_time_min: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className={labelCls}>Cuisson (min)</label>
            <input type="number" className={inputCls} value={form.cook_time_min || 0}
              onChange={(e) => setForm((f) => ({ ...f, cook_time_min: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={!!form.visible} onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))} className="rounded accent-[#0c3228]" />
          Recette visible sur le site
        </label>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600">Ingrédients ({form.ingredients?.length || 0})</h3>
          <button onClick={addIngredient} className="flex items-center gap-1 text-xs text-[#0c3228] font-medium hover:underline">
            <Plus size={14} />
            Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {(form.ingredients || []).map((ing, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Ingrédient {i + 1}</span>
                <button onClick={() => removeIngredient(i)} className="text-xs text-red-400 hover:text-red-600">
                  Retirer
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <label className={labelCls}>Nom (FR)</label>
                  <input className={inputCls} value={ing.name_fr} placeholder="ex: Tomates" onChange={(e) => setIngredient(i, "name_fr", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Quantité</label>
                  <input type="number" step="0.5" className={inputCls} value={ing.quantity}
                    onChange={(e) => setIngredient(i, "quantity", parseFloat(e.target.value) || 1)} />
                </div>
                <div>
                  <label className={labelCls}>Unité</label>
                  <select className={inputCls} value={ing.unit} onChange={(e) => setIngredient(i, "unit", e.target.value)}>
                    <option>pièce</option>
                    <option>g</option>
                    <option>kg</option>
                    <option>L</option>
                    <option>ml</option>
                    <option>botte</option>
                    <option>sachet</option>
                  </select>
                </div>
              </div>

              <input className={inputCls} value={ing.note_fr || ""} placeholder="Note (optionnel) — ex: Citron beldi de préférence"
                onChange={(e) => setIngredient(i, "note_fr", e.target.value)} />

              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={ing.optional} onChange={(e) => setIngredient(i, "optional", e.target.checked)} className="accent-[#0c3228]" />
                  Optionnel
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={ing.not_in_catalog} onChange={(e) => setIngredient(i, "not_in_catalog", e.target.checked)} className="accent-orange-500" />
                  Non disponible en livraison
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setView("list")} className="px-5 py-2.5 text-sm text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
          Annuler
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 text-sm font-bold bg-[#0c3228] text-white rounded-xl hover:bg-green-900 disabled:opacity-50 transition-colors">
          {saving ? "Enregistrement..." : view === "create" ? "Créer la recette" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
