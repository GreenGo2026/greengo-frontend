// src/pages/AddProductPage.tsx
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import { createProduct, apiClient, type CreateProductPayload, uploadProductImage } from "../services/api";
import { categoryLabel } from "../utils/categoryLabels";

const CATEGORIES = ["Fruits","Légumes","Vegetables","Volailles","White Meats","Eggs","Fromage","Olives","Huile et miel","Produits naturels","Épices","Natural Juices","Mixed Packs","Autres"] as const;
const UNITS       = ["kg","piece","100g","botte","g","litre"] as const;

type Status = "idle" | "saving" | "success" | "error";

interface Fields {
  name_fr:       string;
  name_ar:       string;
  category:      string;
  price_mad:     string;
  unit:          string;
  in_stock:      boolean;
  description_fr:string;
  on_sale:       boolean;
  discount_pct:  string;
  image_url:     string;
  visible:       boolean;
  stock_qty:     string;
}

const EMPTY: Fields = {
  name_fr:"", name_ar:"", category:"Légumes", price_mad:"",
  unit:"kg", in_stock:true, description_fr:"",
  on_sale:false, discount_pct:"0", image_url:"", visible:true,
  stock_qty:"",
};

/* ── style helpers ─────────────────────────────────────────────────────────── */
const inp = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#2E8B57] focus:outline-none focus:ring-1 focus:ring-[#2E8B57]";
const lbl = "block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-widest";

function Toggle({ on, onChange, id }: { on: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-[#2E8B57]" : "bg-white/20"}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export default function AddProductPage() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [status, setStatus]   = useState<Status>("idle");
  const [errMsg, setErrMsg]   = useState("");
  const [genDesc, setGenDesc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrMsg("");
    try {
      const url = await uploadProductImage(file);
      set("image_url", url);
    } catch {
      setErrMsg("Upload échoué — réessayez.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function set<K extends keyof Fields>(k: K, v: Fields[K]) {
    setFields(prev => ({ ...prev, [k]: v }));
  }

  async function generateDescription() {
    if (!fields.name_fr.trim()) { setErrMsg("Entrez d'abord le nom français."); return; }
    setGenDesc(true);
    setErrMsg("");
    try {
      const r = await apiClient.post<{ description_fr?: string }>("/admin/auth/generate-description", {
        product_name: fields.name_fr.trim(),
        category: fields.category,
      });
      if (r.data.description_fr) set("description_fr", r.data.description_fr);
    } catch {
      setErrMsg("Génération échouée — réessayez.");
    } finally {
      setGenDesc(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fields.name_fr.trim()) { setErrMsg("Le nom français est requis."); return; }
    if (!fields.category)       { setErrMsg("La catégorie est requise.");   return; }
    const price = parseFloat(fields.price_mad);
    if (isNaN(price) || price < 0) { setErrMsg("Prix invalide."); return; }

    setStatus("saving");
    setErrMsg("");

    const payload: CreateProductPayload = {
      name_fr:       fields.name_fr.trim(),
      name_ar:       fields.name_ar.trim() || undefined,
      category:      fields.category,
      price_mad:     price,
      unit:          fields.unit,
      in_stock:      fields.in_stock,
      description_fr: fields.description_fr.trim() || undefined,
      on_sale:       fields.on_sale,
      discount_pct:  parseInt(fields.discount_pct, 10) || 0,
      image_url:     fields.image_url.trim() || undefined,
      visible:       fields.visible,
      stock_qty:     fields.stock_qty.trim() === "" ? undefined : parseInt(fields.stock_qty, 10),
    };

    try {
      await createProduct(payload);
      setStatus("success");
      setFields(EMPTY);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrMsg(detail || "Erreur serveur — réessayez.");
      setStatus("error");
    }
  }

  const imageReady = fields.image_url.trim().length > 0;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: "#0a2318" }}>
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/gestion"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition"
          >
            <ArrowLeft size={14} /> Retour
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Nouveau produit</h1>
            <p className="text-xs text-white/40 mt-0.5">Ajouter un produit au catalogue GreenGo</p>
          </div>
        </div>

        {/* Success banner */}
        {status === "success" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#2E8B57]/40 bg-[#2E8B57]/10 px-5 py-4">
            <CheckCircle size={20} className="text-[#2E8B57] shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Produit ajouté avec succès ✅</p>
              <Link to="/gestion" className="text-xs text-[#2E8B57] underline">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        )}

        {/* Error banner */}
        {status === "error" && errMsg && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3">
            <XCircle size={16} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{errMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Names */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Noms du produit</h2>

            <div>
              <label className={lbl} htmlFor="name_fr">Nom français <span className="text-red-400">*</span></label>
              <input
                id="name_fr"
                className={inp}
                placeholder="ex: Tomate ronde"
                value={fields.name_fr}
                onChange={e => set("name_fr", e.target.value)}
                required
              />
            </div>

            <div>
              <label className={lbl} htmlFor="name_ar">Nom arabe (optionnel)</label>
              <input
                id="name_ar"
                className={inp}
                placeholder="مثال: طماطم"
                dir="rtl"
                value={fields.name_ar}
                onChange={e => set("name_ar", e.target.value)}
              />
            </div>
          </div>

          {/* Category + Unit */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Classification</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl} htmlFor="category">Catégorie <span className="text-red-400">*</span></label>
                <select
                  id="category"
                  className={inp + " cursor-pointer"}
                  value={fields.category}
                  onChange={e => set("category", e.target.value)}
                  required
                >
                  {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#0a2318" }}>{categoryLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="unit">Unité <span className="text-red-400">*</span></label>
                <select
                  id="unit"
                  className={inp + " cursor-pointer"}
                  value={fields.unit}
                  onChange={e => set("unit", e.target.value)}
                  required
                >
                  {UNITS.map(u => <option key={u} value={u} style={{ background: "#0a2318" }}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Tarification</h2>

            <div>
              <label className={lbl} htmlFor="price_mad">Prix (MAD) <span className="text-red-400">*</span></label>
              <div className="relative">
                <input
                  id="price_mad"
                  type="number"
                  min="0"
                  step="0.5"
                  className={inp + " pr-16"}
                  placeholder="0.00"
                  value={fields.price_mad}
                  onChange={e => set("price_mad", e.target.value)}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 font-bold">MAD</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">En promotion</p>
                <p className="text-xs text-white/40">Affiche un badge de réduction</p>
              </div>
              <Toggle id="on_sale" on={fields.on_sale} onChange={v => set("on_sale", v)} />
            </div>

            {fields.on_sale && (
              <div>
                <label className={lbl} htmlFor="discount_pct">Réduction (%)</label>
                <input
                  id="discount_pct"
                  type="number"
                  min="0"
                  max="100"
                  className={inp}
                  value={fields.discount_pct}
                  onChange={e => set("discount_pct", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Stock + Visibility */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Disponibilité</h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">En stock</p>
                <p className="text-xs text-white/40">Visible comme disponible pour les clients</p>
              </div>
              <Toggle id="in_stock" on={fields.in_stock} onChange={v => set("in_stock", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Visible dans la boutique</p>
                <p className="text-xs text-white/40">Affiché sur la page produits</p>
              </div>
              <Toggle id="visible" on={fields.visible} onChange={v => set("visible", v)} />
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Description</h2>
              <button
                type="button"
                onClick={generateDescription}
                disabled={genDesc}
                className="flex items-center gap-1.5 rounded-xl border border-[#2E8B57]/40 bg-[#2E8B57]/10 px-3 py-1.5 text-xs font-semibold text-[#2E8B57] hover:bg-[#2E8B57]/20 disabled:opacity-50 transition"
              >
                {genDesc
                  ? <><Loader2 size={11} className="animate-spin" /> Génération…</>
                  : <><Sparkles size={11} /> Générer ✨</>}
              </button>
            </div>
            <div>
              <label className={lbl} htmlFor="description_fr">Description (français, optionnel)</label>
              <textarea
                id="description_fr"
                rows={4}
                className={inp + " resize-y"}
                placeholder="Description du produit pour les clients…"
                value={fields.description_fr}
                onChange={e => set("description_fr", e.target.value)}
              />
            </div>
          </div>

          {/* Image */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Image produit</h2>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Clickable preview / upload trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/5 hover:bg-white/10 transition overflow-hidden disabled:opacity-60"
              title="Cliquer pour choisir un fichier"
            >
              {uploading ? (
                <Loader2 size={28} className="text-white/40 animate-spin" />
              ) : fields.image_url ? (
                <img
                  src={fields.image_url}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <span className="text-3xl">📷</span>
              )}
            </button>

            {uploading && <p className="text-xs text-white/40">Upload en cours…</p>}

            {/* URL fallback */}
            <div>
              <label className={lbl} htmlFor="image_url">Ou coller une URL d'image</label>
              <input
                id="image_url"
                type="url"
                className={inp}
                placeholder="https://…/image.jpg"
                value={fields.image_url}
                onChange={e => set("image_url", e.target.value)}
              />
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${imageReady ? "bg-[#2E8B57]" : "bg-amber-400"}`} />
              <span className="text-xs text-white/50">
                Statut image : {imageReady ? "✅ Prête" : "🟡 En attente"}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pb-8">
            <button
              type="submit"
              disabled={status === "saving"}
              className="flex items-center gap-2 rounded-2xl bg-[#2E8B57] px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#256e45] disabled:opacity-60 transition"
            >
              {status === "saving"
                ? <><Loader2 size={15} className="animate-spin" /> Enregistrement…</>
                : "Ajouter le produit"}
            </button>
            <Link to="/gestion" className="text-sm text-white/40 hover:text-white transition">
              Annuler
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
