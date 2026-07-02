// src/pages/PaniersTab.tsx — admin view of basket compositions with inline editing
import { useState } from "react";
import type { DBProduct } from "../services/api";

type Lang = "fr" | "ar";
type BasketItem = { sku: string; label: string; qty: number; unit: string };
type Basket = { id: string; title: string; persons: number; accent: string; items: BasketItem[] };

const BASKETS = [
  { id:"famille", title:"Panier Famille", persons:4, accent:"#2E8B57",
    items:[
      {sku:"VEG-TOMATE-001",   label:"Tomate ronde",   qty:2, unit:"kg"},
      {sku:"VEG-PATATE-001",   label:"Pomme de terre", qty:2, unit:"kg"},
      {sku:"VEG-CAROTTE-001",  label:"Carotte",        qty:1, unit:"kg"},
      {sku:"VEG-OIGNON-001",   label:"Oignon rouge",   qty:1, unit:"kg"},
      {sku:"VEG-COURGETTE-001",label:"Courgette",      qty:1, unit:"kg"},
      {sku:"VND-POULET-001",   label:"Poulet entier",  qty:1, unit:"piece"},
      {sku:"OEF-BELDI-001",    label:"Oeufs beldi",    qty:1, unit:"boite"},
    ]},
  { id:"couple", title:"Panier Duo", persons:2, accent:"#C9A96E",
    items:[
      {sku:"VEG-TOMATE-001",  label:"Tomate ronde",   qty:1, unit:"kg"},
      {sku:"VEG-PATATE-001",  label:"Pomme de terre", qty:1, unit:"kg"},
      {sku:"VEG-CAROTTE-001", label:"Carotte",        qty:1, unit:"kg"},
      {sku:"OEF-BELDI-001",   label:"Oeufs beldi",    qty:1, unit:"boite"},
    ]},
  { id:"legumes", title:"Panier Legumes", persons:4, accent:"#16a34a",
    items:[
      {sku:"VEG-PATATE-001",    label:"Pomme de terre", qty:2, unit:"kg"},
      {sku:"VEG-CAROTTE-001",   label:"Carotte",        qty:1, unit:"kg"},
      {sku:"VEG-OIGNON-001",    label:"Oignon rouge",   qty:1, unit:"kg"},
      {sku:"VEG-COURGETTE-001", label:"Courgette",      qty:1, unit:"kg"},
      {sku:"VEG-POIVRON-001",   label:"Poivron vert",   qty:1, unit:"kg"},
      {sku:"VEG-BROCOLI-001",   label:"Brocoli",        qty:1, unit:"kg"},
    ]},
  { id:"tajine", title:"Panier Tajine", persons:4, accent:"#f97316",
    items:[
      {sku:"VND-POULET-001",   label:"Poulet entier",  qty:1, unit:"piece"},
      {sku:"VEG-PATATE-001",   label:"Pomme de terre", qty:1, unit:"kg"},
      {sku:"VEG-CAROTTE-001",  label:"Carotte",        qty:1, unit:"kg"},
      {sku:"VEG-OIGNON-001",   label:"Oignon rouge",   qty:1, unit:"kg"},
      {sku:"EPC-CUMIN-001",    label:"Cumin moulu",    qty:1, unit:"100g"},
      {sku:"EPC-RASELHANT-001",label:"Ras el hanout",  qty:1, unit:"100g"},
    ]},
  { id:"fruits", title:"Panier Fruits", persons:4, accent:"#a855f7",
    items:[
      {sku:"FRT-ORANGE-001", label:"Orange", qty:2, unit:"kg"},
      {sku:"FRT-BANANE-001", label:"Banane", qty:1, unit:"kg"},
      {sku:"FRT-POMME-001",  label:"Pomme",  qty:1, unit:"kg"},
    ]},
];

export default function PaniersTab({ products, lang, font }: {
  products: DBProduct[];
  lang: Lang;
  font: string;
}) {
  const [baskets, setBaskets] = useState<Basket[]>(() => {
    try { const s = localStorage.getItem("ggo_baskets"); return s ? JSON.parse(s) : BASKETS; }
    catch { return BASKETS; }
  });
  const [draft, setDraft] = useState<Basket | null>(null);

  function openEdit(b: Basket) { setDraft(JSON.parse(JSON.stringify(b))); }
  function cancelEdit() { setDraft(null); }
  function saveEdit() {
    if (!draft) return;
    const updated = baskets.map(b => b.id === draft.id ? draft : b);
    setBaskets(updated);
    try { localStorage.setItem("ggo_baskets", JSON.stringify(updated)); } catch {}
    setDraft(null);
  }
  function setItem(ii: number, field: keyof BasketItem, val: string | number) {
    setDraft(d => d ? { ...d, items: d.items.map((it, i) => i === ii ? { ...it, [field]: val } : it) } : d);
  }
  function removeItem(ii: number) { setDraft(d => d ? { ...d, items: d.items.filter((_, i) => i !== ii) } : d); }
  function addItem() { setDraft(d => d ? { ...d, items: [...d.items, { sku: "", label: "", qty: 1, unit: "kg" }] } : d); }
  function resetBaskets() { setBaskets(BASKETS); try { localStorage.removeItem("ggo_baskets"); } catch {} }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h2 className={"text-base font-extrabold text-gray-800 " + font}>
            {lang === "ar" ? "السلال الجاهزة" : "Paniers pre-composes"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === "ar" ? "الأسعار مباشرة من الكتالوج" : "Prix en direct depuis le catalogue."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetBaskets} title={lang === "ar" ? "إعادة تعيين" : "Réinitialiser"}
            className="text-[10px] font-semibold text-gray-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">
            {lang === "ar" ? "إعادة تعيين" : "Réinitialiser"}
          </button>
          <span className="text-xs font-bold text-[#2E8B57] bg-green-50 px-3 py-1.5 rounded-full">
            {baskets.length} paniers
          </span>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={cancelEdit}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className={"font-extrabold text-gray-800 " + font}>{lang === "ar" ? "تعديل السلة" : "Modifier le panier"}</h3>
              <button onClick={cancelEdit} className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm">✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Titre</label>
                  <input value={draft.title} onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57]" />
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Pers.</label>
                  <input type="number" min="1" value={draft.persons}
                    onChange={e => setDraft(d => d ? { ...d, persons: parseInt(e.target.value) || 1 } : d)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57]" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Articles</p>
                {draft.items.map((it, ii) => (
                  <div key={ii} className="flex items-center gap-1.5">
                    <input value={it.sku} onChange={e => setItem(ii, "sku", e.target.value)} placeholder="SKU"
                      className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-[#2E8B57] font-latin" />
                    <input value={it.label} onChange={e => setItem(ii, "label", e.target.value)} placeholder="Label"
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-[#2E8B57]" />
                    <input type="number" min="0.5" step="0.5" value={it.qty}
                      onChange={e => setItem(ii, "qty", parseFloat(e.target.value) || 1)}
                      className="w-12 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-right outline-none focus:border-[#2E8B57] font-latin" />
                    <select value={it.unit} onChange={e => setItem(ii, "unit", e.target.value)}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-1 py-1.5 text-xs outline-none focus:border-[#2E8B57]">
                      {["kg","piece","100g","botte","g","litre","boite"].map(u => <option key={u}>{u}</option>)}
                    </select>
                    <button onClick={() => removeItem(ii)}
                      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs">✕</button>
                  </div>
                ))}
                <button onClick={addItem}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-[#2E8B57]/40 px-3 py-1.5 text-xs font-semibold text-[#2E8B57] hover:bg-[#2E8B57]/5 transition w-full justify-center">
                  {"+ " + (lang === "ar" ? "إضافة مادة" : "Ajouter un article")}
                </button>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button onClick={cancelEdit}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                {lang === "ar" ? "إلغاء" : "Annuler"}
              </button>
              <button onClick={saveEdit}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white"
                style={{ background: "linear-gradient(135deg,#2E8B57,#1a6b42)" }}>
                {lang === "ar" ? "حفظ" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {baskets.map(basket => {
        const liveItems = basket.items.map(bi => {
          const liveP     = (products as any[]).find((p: any) => p.sku === bi.sku);
          const livePrice = liveP ? liveP.price_mad : null;
          const lineTotal = livePrice !== null ? livePrice * bi.qty : null;
          return { ...bi, livePrice, lineTotal, inStock: liveP?.in_stock ?? null };
        });
        const liveTotal  = liveItems.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
        const saving     = Math.round(liveTotal * 0.08);
        const finalPrice = liveTotal - saving;
        const hasOOS     = liveItems.some(i => i.inStock === false);

        return (
          <div key={basket.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `2px solid ${basket.accent}25`, background: `${basket.accent}08` }}>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={"font-extrabold text-gray-800 " + font}>{basket.title}</h3>
                  <button onClick={() => openEdit(basket)} title={lang === "ar" ? "تعديل" : "Modifier"}
                    className="h-5 w-5 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-[#2E8B57] hover:border-[#2E8B57]/40 transition text-[11px]">
                    ✎
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-latin">
                  {basket.persons} pers. &bull; {basket.items.length} produits
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-300 line-through font-latin">{liveTotal.toFixed(2)} MAD</p>
                <p className="text-lg font-black font-latin" style={{ color: basket.accent }}>
                  {finalPrice.toFixed(2)} MAD
                </p>
                <p className="text-[9px] text-green-600 font-semibold">
                  -8% &bull; eco {saving.toFixed(0)} MAD
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {liveItems.map((item, ii) => (
                <div key={ii}
                  className={"flex items-center justify-between px-5 py-2 " + (item.inStock === false ? "opacity-40" : "")}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[10px] text-gray-300 font-latin w-4 shrink-0">{ii + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 font-latin">{item.label}</p>
                      <p className="text-[10px] text-gray-400 font-latin">
                        {item.sku} &bull; {item.qty} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.inStock === false && (
                      <span className="text-[9px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full">
                        Rupture
                      </span>
                    )}
                    {item.livePrice !== null ? (
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-700 font-latin">
                          {item.livePrice.toFixed(2)} MAD/{item.unit}
                        </p>
                        <p className="text-[10px] text-gray-400 font-latin">
                          {item.lineTotal?.toFixed(2)} MAD total
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 font-latin">SKU introuvable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* OOS warning */}
            {hasOOS && (
              <div className="px-5 py-2 bg-amber-50 border-t border-amber-100">
                <p className="text-[10px] font-bold text-amber-600">
                  Attention: produit(s) en rupture dans ce panier
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}