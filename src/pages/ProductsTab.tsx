// src/pages/ProductsTab.tsx
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Trash2, Eye, EyeOff, Check, X, Plus, RefreshCw, AlertCircle, ClipboardList } from "lucide-react";
import {
  createProduct, deleteProduct, getProducts, updateProductById, uploadProductImage,
  type CreateProductPayload, type DBProduct,
} from "../services/api";
import { getJwt } from "../services/adminJwt";
import { categoryLabel } from "../utils/categoryLabels";
import AuditHistory from "../components/admin/AuditHistory";

type Lang = "fr" | "ar";

const CATEGORIES = ["Fruits", "Légumes", "Vegetables", "Volailles", "Viande Rouge", "White Meats", "Eggs", "Fromage", "Olives", "Huile et miel", "Produits naturels", "Épices", "Natural Juices", "Mixed Packs", "Paniers", "Autres"];
const UNITS       = ["kg", "piece", "100g", "botte", "g", "litre"];

const BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const EMPTY_FORM: CreateProductPayload = {
  name_fr: "", name_ar: "", category: "Fruits",
  price_mad: 0, unit: "kg", in_stock: true,
  visible: true, on_sale: false, discount_pct: 0,
  description_fr: "", image_url: "", stock_qty: undefined,
};

interface InlineEdit {
  id: string;
  name_fr: string; name_ar: string; category: string;
  price_mad: number; unit: string; in_stock: boolean; visible: boolean;
  // Variant prices are independent of price_mad -- the backend never
  // recalculates them once set (see should_auto_generate_variants), so
  // editing price_mad alone silently desyncs them from what the storefront
  // actually displays. Admin edits both explicitly, in one save.
  variant_prices?: Array<{ label: string; price_mad: number; weight_g?: number | null; in_stock?: boolean }>;
}

interface Props { lang: Lang; font: string; }

export default function ProductsTab({ lang, font }: Props) {
  const [products,  setProducts]  = useState<DBProduct[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [form,      setForm]      = useState<CreateProductPayload>(EMPTY_FORM);
  const [formMsg,   setFormMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [submitting,setSubmitting]= useState(false);
  const [editRow,   setEditRow]   = useState<InlineEdit | null>(null);
  const [savingId,  setSavingId]  = useState<string | null>(null);
  const [deletingId,setDeletingId]= useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const [catFilter,    setCatFilter]    = useState("all");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const formRef     = useRef<HTMLDivElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setProducts(await getProducts()); }
    catch { setError("Impossible de charger les produits."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function setF<K extends keyof CreateProductPayload>(k: K, v: CreateProductPayload[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleFileUpload(file: File, forEdit: boolean) {
    if (forEdit) setEditUploading(true); else setUploading(true);
    try {
      const url = await uploadProductImage(file);
      if (forEdit && editRow) setEditRow(r => r ? { ...r } : r); // placeholder — url set below
      if (forEdit && editRow) setEditRow(r => r ? { ...r, _imageUrl: url } as any : r);
      else setF("image_url", url);
    } catch {
      setFormMsg({ text: "Échec upload image.", ok: false });
    } finally {
      if (forEdit) setEditUploading(false); else setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name_fr.trim()) { setFormMsg({ text: "Le nom français est requis.", ok: false }); return; }
    setSubmitting(true); setFormMsg(null);
    try {
      await createProduct(form);
      setFormMsg({ text: "✅ Produit ajouté avec succès!", ok: true });
      setForm(EMPTY_FORM);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch {
      setFormMsg({ text: "Erreur lors de la création du produit.", ok: false });
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    } finally { setDeletingId(null); }
  }

  async function handleToggleVisible(p: DBProduct) {
    try {
      const updated = await updateProductById(p.id, { visible: !p.visible } as any);
      setProducts(ps => ps.map(x => x.id === p.id ? { ...x, visible: updated.visible } : x));
    } catch { alert("Erreur mise à jour visibilité."); }
  }

  function startEdit(p: DBProduct) {
    setEditRow({
      id: p.id, name_fr: p.name_fr || "", name_ar: p.name_ar, category: p.category,
      price_mad: p.price_mad, unit: p.unit, in_stock: p.in_stock, visible: p.visible,
      variant_prices: (p.variants || []).map(v => ({
        label: v.label, price_mad: v.price_mad, weight_g: v.weight_g, in_stock: v.in_stock ?? true,
      })),
    });
  }

  async function saveEdit() {
    if (!editRow) return;
    setSavingId(editRow.id);
    try {
      const updated = await updateProductById(editRow.id, {
        name_fr: editRow.name_fr, name_ar: editRow.name_ar,
        category: editRow.category, price_mad: editRow.price_mad,
        unit: editRow.unit, in_stock: editRow.in_stock,
        visible: editRow.visible,
        ...((editRow as any)._imageUrl ? { image_url: (editRow as any)._imageUrl } : {}),
        // Variant prices are only ever sent if this product has variants --
        // never auto-derived from price_mad, always exactly what the admin typed.
        ...(editRow.variant_prices?.length ? { variants: editRow.variant_prices } : {}),
      } as any);
      setProducts(ps => ps.map(p => p.id === editRow.id ? { ...p, ...updated } : p));
      setEditRow(null);
    } catch { alert("Erreur lors de la sauvegarde."); }
    finally { setSavingId(null); }
  }

  const inputCls = "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/20 w-full";
  const uniqueCats = ["all", ...Array.from(new Set(products.map(p => p.category))).sort()];

  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter(p => {
    const matchesCat = catFilter === "all" || p.category === catFilter;
    const matchesSearch = !q
      || (p.name_fr || "").toLowerCase().includes(q)
      || (p.name_ar || "").toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  function prefillAndScrollToForm() {
    setF("name_fr", searchQuery.trim());
    if (catFilter !== "all") setF("category", catFilter);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      {/* ── Add product form ── */}
      <div ref={formRef} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className={`mb-5 text-base font-extrabold text-gray-800 ${font}`}>➕ Nouveau produit</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Nom français *</label>
              <input value={form.name_fr} onChange={e => setF("name_fr", e.target.value)}
                placeholder="Nom en français" className={inputCls} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Nom arabe / darija</label>
              <input value={form.name_ar || ""} onChange={e => setF("name_ar", e.target.value)}
                placeholder="الاسم بالعربية أو الدارجة" dir="rtl" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Catégorie</label>
              <select value={form.category} onChange={e => setF("category", e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Prix (MAD) *</label>
              <input type="number" min="0" step="0.5" value={form.price_mad}
                onChange={e => setF("price_mad", parseFloat(e.target.value) || 0)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Unité</label>
              <select value={form.unit} onChange={e => setF("unit", e.target.value)} className={inputCls}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.in_stock} onChange={e => setF("in_stock", e.target.checked)} className="h-4 w-4 accent-[#2E8B57]" />
                <span className="text-sm font-semibold text-gray-700">En stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.visible} onChange={e => setF("visible", e.target.checked)} className="h-4 w-4 accent-[#2E8B57]" />
                <span className="text-sm font-semibold text-gray-700">Visible</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500">Stock restant (optionnel)</label>
              <input type="number" min="0" step="1" placeholder="Laisser vide = illimité"
                value={form.stock_qty ?? ""}
                onChange={e => setF("stock_qty", e.target.value === "" ? undefined : parseInt(e.target.value, 10) || 0)}
                className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-500">URL image</label>
            <input value={form.image_url || ""} onChange={e => setF("image_url", e.target.value)}
              placeholder="https://..." className={inputCls} />
            <div className="mt-2 flex items-center gap-3">
              <label className="cursor-pointer rounded-xl border border-dashed border-[#2E8B57]/50 bg-[#2E8B57]/5 px-4 py-2 text-xs font-semibold text-[#2E8B57] hover:bg-[#2E8B57]/10 transition">
                {uploading ? "Upload…" : "📷 Uploader une image"}
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, false); }} />
              </label>
              {form.image_url && (
                <img src={form.image_url.startsWith("/static") ? `${BASE_URL}${form.image_url}` : form.image_url}
                  alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                  onError={e => { const t = e.currentTarget; if (!t.src.includes('placeholder')) { t.src = '/assets/placeholder-product.svg'; t.onerror = null; } }} />
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-500">Description (optionnelle)</label>
            <textarea value={form.description_fr || ""} onChange={e => setF("description_fr", e.target.value)}
              rows={2} placeholder="Description courte du produit…" className={inputCls + " resize-none"} />
          </div>
          {formMsg && (
            <p className={`rounded-xl px-4 py-2 text-sm font-semibold ${formMsg.ok ? "bg-emerald-50 text-[#2E8B57]" : "bg-red-50 text-red-600"}`}>
              {formMsg.text}
            </p>
          )}
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#2E8B57,#1a6b42)" }}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {submitting ? "Ajout en cours…" : "Ajouter le produit"}
          </button>
        </form>
      </div>

      {/* ── Product list ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 space-y-2">
          {/* Search + controls row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search field */}
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom FR ou AR…"
                className="w-full rounded-lg border border-gray-200 bg-white pl-7 pr-7 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#2E8B57] placeholder:text-gray-300"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs leading-none">✕</button>
              )}
            </div>
            {/* Category filter */}
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-[#2E8B57] cursor-pointer">
              {uniqueCats.map(c => <option key={c} value={c}>{c === "all" ? "Toutes catégories" : categoryLabel(c)}</option>)}
            </select>
            {/* Refresh */}
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Actualiser
            </button>
            {/* Count */}
            <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400 shrink-0">
              {loading ? "Chargement…" : `${filteredProducts.length}/${products.length}`}
            </p>
          </div>

          {/* "Not found" banner — appears only when search has no match */}
          {q && filteredProducts.length === 0 && !loading && (
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5">
              <p className="text-xs font-semibold text-amber-700">
                Aucun produit trouvé pour <span className="font-extrabold">«{searchQuery.trim()}»</span>
              </p>
              <button
                onClick={prefillAndScrollToForm}
                className="flex items-center gap-1.5 rounded-lg bg-[#2E8B57] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#1a6b42] transition shrink-0 ml-3">
                <Plus size={11} /> Ajouter ce produit
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-5 py-4 text-red-600">
            <AlertCircle size={16} /><span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-gray-50/50">
                  <th className="px-3 py-3 text-left">Image</th>
                  <th className="px-3 py-3 text-left">Nom FR</th>
                  <th className="px-3 py-3 text-left">Nom AR</th>
                  <th className="px-3 py-3 text-left">Catégorie</th>
                  <th className="px-3 py-3 text-right">Prix</th>
                  <th className="px-3 py-3 text-center">Stock</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const isEditing = editRow?.id === p.id;
                  const imgSrc = p.image_url
                    ? (p.image_url.startsWith("/static") ? `${BASE_URL}${p.image_url}` : p.image_url)
                    : null;
                  return (
                    <Fragment key={p.id}>
                    <tr className={`border-b border-gray-100 transition-all ${isEditing ? "bg-amber-50/60" : "hover:bg-gray-50/60"}`}>
                      {/* Image */}
                      <td className="px-3 py-2">
                        {imgSrc
                          ? <img src={imgSrc} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                              onError={e => { const t = e.currentTarget; if (!t.src.includes('placeholder')) { t.src = '/assets/placeholder-product.svg'; t.onerror = null; } }} />
                          : <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-lg">🛒</div>
                        }
                      </td>
                      {/* Name FR */}
                      <td className="px-3 py-2">
                        {isEditing
                          ? <input value={editRow.name_fr} onChange={e => setEditRow(r => r ? { ...r, name_fr: e.target.value } : r)}
                              className="w-36 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs outline-none focus:border-[#2E8B57]" />
                          : <span className="font-semibold text-gray-800 text-xs">{p.name_fr || "—"}</span>
                        }
                      </td>
                      {/* Name AR */}
                      <td className="px-3 py-2">
                        {isEditing
                          ? <input value={editRow.name_ar} onChange={e => setEditRow(r => r ? { ...r, name_ar: e.target.value } : r)}
                              dir="rtl" className="w-28 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs outline-none focus:border-[#2E8B57]" />
                          : <span dir="rtl" className="font-arabic text-xs text-gray-700">{p.name_ar || "—"}</span>
                        }
                      </td>
                      {/* Category */}
                      <td className="px-3 py-2">
                        {isEditing
                          ? <select value={editRow.category} onChange={e => setEditRow(r => r ? { ...r, category: e.target.value } : r)}
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs outline-none">
                              {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                            </select>
                          : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">{p.category}</span>
                        }
                        {!!p.variants?.length && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">
                            {p.variants.length} variants
                          </span>
                        )}
                      </td>
                      {/* Price + Unit */}
                      <td className="px-3 py-2 text-right">
                        {isEditing
                          ? <div className="flex flex-col items-end gap-1">
                              <input type="number" min="0" step="0.5" value={editRow.price_mad}
                                onChange={e => setEditRow(r => r ? { ...r, price_mad: parseFloat(e.target.value) || 0 } : r)}
                                className="w-20 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-right outline-none" />
                              <select value={editRow.unit} onChange={e => setEditRow(r => r ? { ...r, unit: e.target.value } : r)}
                                className="w-20 rounded-lg border border-amber-300 bg-amber-50 px-1.5 py-1 text-xs outline-none">
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                              </select>
                              {(() => {
                                const v1kg = editRow.variant_prices?.find(v => v.weight_g === 1000);
                                if (!v1kg || Math.abs(v1kg.price_mad - editRow.price_mad) <= 0.01) return null;
                                return (
                                  <p className="text-[10px] text-amber-600 text-right leading-tight">
                                    ⚠️ variantes: {v1kg.price_mad} MAD
                                  </p>
                                );
                              })()}
                              {!!editRow.variant_prices?.length && (
                                <div className="mt-1 w-full text-left border-t border-amber-200 pt-1.5 space-y-1">
                                  <p className="text-[9px] font-semibold text-gray-500">
                                    Prix variantes <span className="font-normal text-gray-400">(manuel)</span>
                                  </p>
                                  {editRow.variant_prices.map((v, i) => (
                                    <div key={v.label} className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-gray-500 w-10 shrink-0">{v.label}</span>
                                      <input type="number" step="0.5" min="0" value={v.price_mad}
                                        onChange={e => {
                                          const updated = [...(editRow.variant_prices || [])];
                                          updated[i] = { ...v, price_mad: parseFloat(e.target.value) || 0 };
                                          setEditRow(r => r ? { ...r, variant_prices: updated } : r);
                                        }}
                                        className="w-16 rounded-lg border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-right outline-none focus:border-[#2E8B57]" />
                                      <span className="text-[10px] text-gray-400">MAD</span>
                                    </div>
                                  ))}
                                  <p className="text-[9px] text-amber-600 bg-amber-50 rounded px-1.5 py-1">
                                    ⚠️ Modifier le prix ci-dessus ne met pas à jour ces variantes.
                                  </p>
                                </div>
                              )}
                            </div>
                          : <>
                              <span className="font-bold text-gray-800 font-latin">{p.price_mad.toFixed(2)} MAD</span>
                              <span className="block text-[10px] text-gray-400 font-latin">/ {p.unit}</span>
                              {(() => {
                                const v1kg = p.variants?.find(v => v.weight_g === 1000);
                                if (!v1kg || Math.abs(v1kg.price_mad - p.price_mad) <= 0.01) return null;
                                return (
                                  <span className="block mt-0.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 leading-tight">
                                    ⚠️ variantes: {v1kg.price_mad} MAD
                                  </span>
                                );
                              })()}
                            </>
                        }
                      </td>
                      {/* Stock */}
                      <td className="px-3 py-2 text-center">
                        {isEditing
                          ? <input type="checkbox" checked={editRow.in_stock}
                              onChange={e => setEditRow(r => r ? { ...r, in_stock: e.target.checked } : r)}
                              className="h-4 w-4 accent-[#2E8B57]" />
                          : <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.in_stock ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                              {p.in_stock ? "✓" : "✗"}
                            </span>
                        }
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          {isEditing ? (
                            <>
                              {/* Image upload in edit mode */}
                              <label title="Changer image" className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition text-xs">
                                {editUploading ? <Loader2 size={11} className="animate-spin" /> : "📷"}
                                <input ref={editFileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, true); }} />
                              </label>
                              <button onClick={saveEdit} disabled={savingId === p.id} title="Sauvegarder"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-[#2E8B57] hover:bg-emerald-200 transition disabled:opacity-50">
                                {savingId === p.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />}
                              </button>
                              <button onClick={() => setEditRow(null)} title="Annuler"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(p)} title="Modifier"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => handleToggleVisible(p)} title={p.visible ? "Masquer" : "Afficher"}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${p.visible ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                                {p.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <button onClick={() => handleDelete(p.id, p.name_fr || p.name_ar)}
                                disabled={deletingId === p.id} title="Supprimer"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition disabled:opacity-50">
                                {deletingId === p.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={12} />}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setHistoryProductId(historyProductId === p.id ? null : p.id)}
                            title="Historique"
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${historyProductId === p.id ? "bg-purple-100 text-purple-600" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-purple-500"}`}>
                            <ClipboardList size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {historyProductId === p.id && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 p-4 border-b border-gray-100">
                          <AuditHistory entityType="product" entityId={p.id} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
