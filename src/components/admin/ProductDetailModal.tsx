// src/components/admin/ProductDetailModal.tsx
import { useMemo, useState, useEffect } from "react";
import {
  X, Save, AlertTriangle, Eye, Package, DollarSign,
  Image as ImageIcon, Search, History,
} from "lucide-react";
import AuditHistory from "./AuditHistory";
import { updateProductById, type DBProduct, type DBProductUpdate, type ProductVariant } from "../../services/api";
import { CATEGORIES, UNITS } from "../../pages/ProductsTab";
import { categoryLabel } from "../../utils/categoryLabels";

interface Props {
  product: DBProduct;
  onClose: () => void;
  onSaved: (updated: DBProduct) => void;
}

const TABS = [
  { key: "general",  label: "Général",     icon: Package },
  { key: "pricing",  label: "Prix",        icon: DollarSign },
  { key: "media",    label: "Média",       icon: ImageIcon },
  { key: "seo",      label: "SEO",         icon: Search },
  { key: "history",  label: "Historique",  icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Fields that round-trip directly between DBProduct and DBProductUpdate --
// used both to build the "what changed" diff and the save payload.
const TRACKED_FIELDS: (keyof DBProduct & keyof DBProductUpdate)[] = [
  "name_fr", "name_ar", "category", "unit", "price_mad", "in_stock",
  "visible", "on_sale", "discount_pct", "stock_qty", "image_url",
  "description_fr", "step",
];

export default function ProductDetailModal({ product, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<TabKey>("general");
  const [draft, setDraft] = useState<DBProduct>(() => ({
    ...product,
    variants: (product.variants || []).map((v) => ({ ...v })),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const changedFields = useMemo(() => {
    const changed: string[] = [];
    for (const k of TRACKED_FIELDS) {
      if (draft[k] !== product[k]) changed.push(k);
    }
    const dv = JSON.stringify(draft.variants || []);
    const pv = JSON.stringify(product.variants || []);
    if (dv !== pv) changed.push("variants");
    return changed;
  }, [draft, product]);

  // L99 divergence warning -- same check as the inline editor in ProductsTab.
  const variantBase = (draft.variants || []).find((v) => v.weight_g === 1000 || v.label === "1kg");
  const priceDiverges = !!variantBase && Math.abs(Number(variantBase.price_mad) - Number(draft.price_mad)) > 0.01;

  function set<K extends keyof DBProduct>(field: K, value: DBProduct[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function setVariant(i: number, field: keyof ProductVariant, value: any) {
    setDraft((d) => {
      const vs = [...(d.variants || [])];
      vs[i] = { ...vs[i], [field]: value };
      return { ...d, variants: vs };
    });
  }

  async function handleSave() {
    if (changedFields.length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: DBProductUpdate = {};
      for (const f of changedFields) {
        if (f === "variants") {
          payload.variants = draft.variants || [];
        } else {
          (payload as any)[f] = (draft as any)[f];
        }
      }
      const updated = await updateProductById(product.id, payload);
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#0c3228] focus:outline-none focus:ring-1 focus:ring-[#0c3228]";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="font-bold text-[#0c3228] truncate">{draft.name_fr || "Produit"}</h2>
            <p className="text-xs text-gray-400">
              {changedFields.length > 0 ? `${changedFields.length} champ(s) modifié(s)` : "Aucune modification"}
            </p>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-700 disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        {/* L99 divergence banner */}
        {priceDiverges && variantBase && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle size={14} />
            Le prix de base ({draft.price_mad} MAD) diverge de la variante 1kg ({variantBase.price_mad} MAD).
            Modifiez les variantes manuellement — aucun recalcul automatique.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key ? "border-[#0c3228] text-[#0c3228]" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body: form + preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-[1fr_320px]">

          {/* FORM PANEL */}
          <div className="p-6 space-y-4">

            {tab === "general" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nom (FR)</label>
                    <input className={inputCls} value={draft.name_fr || ""} onChange={(e) => set("name_fr", e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Nom (AR)</label>
                    <input className={inputCls} dir="rtl" value={draft.name_ar || ""} onChange={(e) => set("name_ar", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Catégorie</label>
                    <select className={inputCls} value={draft.category || ""} onChange={(e) => set("category", e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Unité</label>
                    <select className={inputCls} value={draft.unit || "piece"} onChange={(e) => set("unit", e.target.value)}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!draft.in_stock} onChange={(e) => set("in_stock", e.target.checked)} className="rounded accent-[#0c3228]" />
                    En stock
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!draft.visible} onChange={(e) => set("visible", e.target.checked)} className="rounded accent-[#0c3228]" />
                    Visible
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!draft.on_sale} onChange={(e) => set("on_sale", e.target.checked)} className="rounded accent-[#0c3228]" />
                    En promotion
                  </label>
                </div>
              </>
            )}

            {tab === "pricing" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Prix de base (MAD)</label>
                    <input type="number" step="0.5" className={inputCls} value={draft.price_mad ?? ""}
                      onChange={(e) => set("price_mad", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={labelCls}>Réduction (%)</label>
                    <input type="number" min="0" max="100" className={inputCls} value={draft.discount_pct ?? 0}
                      onChange={(e) => set("discount_pct", parseInt(e.target.value, 10) || 0)} />
                  </div>
                  <div>
                    <label className={labelCls}>Stock (informatif)</label>
                    <input type="number" className={inputCls} value={draft.stock_qty ?? ""} placeholder="—"
                      onChange={(e) => set("stock_qty", e.target.value ? parseInt(e.target.value, 10) : null)} />
                  </div>
                </div>

                {(draft.variants || []).length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Variantes</p>
                    <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 mb-3">
                      ⚠️ Modifier le prix de base ne met PAS à jour ces variantes. Chaque prix est indépendant (L99).
                    </p>
                    <div className="space-y-2">
                      {(draft.variants || []).map((v, i) => (
                        <div key={v.label || i} className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500 w-12 shrink-0 font-medium">{v.label}</span>
                          <input type="number" step="0.5" className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:border-[#0c3228] focus:outline-none"
                            value={v.price_mad ?? ""} onChange={(e) => setVariant(i, "price_mad", parseFloat(e.target.value) || 0)} />
                          <span className="text-xs text-gray-400">MAD</span>
                          <input type="number" className="w-20 border border-gray-200 rounded px-2 py-1 text-xs text-right focus:border-[#0c3228] focus:outline-none"
                            placeholder="stock" value={v.stock_qty ?? ""}
                            onChange={(e) => setVariant(i, "stock_qty", e.target.value ? parseInt(e.target.value, 10) : null)} />
                          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={v.in_stock !== false} onChange={(e) => setVariant(i, "in_stock", e.target.checked)} className="accent-[#0c3228]" />
                            dispo
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "media" && (
              <>
                <div>
                  <label className={labelCls}>URL de l'image (Cloudinary)</label>
                  <input className={inputCls} value={draft.image_url || ""} placeholder="https://res.cloudinary.com/..."
                    onChange={(e) => set("image_url", e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">Colle l'URL Cloudinary. L'upload direct n'est pas encore branché.</p>
                </div>
                {draft.image_url && (
                  <div className="border border-gray-100 rounded-xl p-3">
                    <img src={draft.image_url} alt="" className="w-full h-48 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }} />
                  </div>
                )}
              </>
            )}

            {tab === "seo" && (
              <div>
                <label className={labelCls}>Description (FR) — SEO</label>
                <textarea className={inputCls + " h-64 resize-y"} value={draft.description_fr || ""}
                  onChange={(e) => set("description_fr", e.target.value)} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{(draft.description_fr || "").trim().split(/\s+/).filter(Boolean).length} mots</span>
                  <span>Objectif SEO : 150–200 mots</span>
                </div>
              </div>
            )}

            {tab === "history" && <AuditHistory entityType="product" entityId={product.id} />}
          </div>

          {/* LIVE PREVIEW PANEL */}
          {tab !== "history" && (
            <div className="border-l border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1">
                <Eye size={13} /> Aperçu client
              </p>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {draft.image_url ? (
                  <img src={draft.image_url} alt="" className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">Pas d'image</div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm text-[#0c3228]">{draft.name_fr || "—"}</p>
                  <p className="text-xs text-gray-400" dir="rtl">{draft.name_ar || ""}</p>
                  <p className="text-lg font-bold text-[#0c3228] mt-2">
                    {Number(draft.price_mad || 0).toFixed(2)} MAD
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      / {draft.unit === "kg" ? "kg" : draft.unit === "litre" ? "L" : "pièce"}
                    </span>
                  </p>
                  {(draft.variants || []).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {(draft.variants || []).map((v) => (
                        <span key={v.label} className="text-xs border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">{v.label}</span>
                      ))}
                    </div>
                  )}
                  {!draft.in_stock && <p className="text-xs text-red-500 mt-2">Rupture de stock</p>}
                  {!draft.visible && <p className="text-xs text-gray-400 mt-1">👁️ Masqué du catalogue</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between gap-3">
          {error
            ? <p className="text-xs text-red-500">{error}</p>
            : <p className="text-xs text-gray-400">Les modifications sont tracées (audit log).</p>}
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving || changedFields.length === 0}
              className="px-5 py-2 text-sm font-bold bg-[#0c3228] text-white rounded-lg hover:bg-green-900 disabled:opacity-40 flex items-center gap-2">
              <Save size={14} />
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
