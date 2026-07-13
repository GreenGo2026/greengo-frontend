// src/pages/PaniersTab.tsx — basket compositions stored in MongoDB, editable by admin
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getPaniers, updatePanier, applyProductCorrections, fixPanierLabels } from "../services/api";
import type { DBProduct, Panier } from "../services/api";

type Lang = "fr" | "ar";
type BasketItem = { label: string; qty: number; unit: string };

// Accent-insensitive, case-insensitive comparison -- "Poivron vert" and
// "poivron vert" (missing accent) must both resolve to the same catalog
// product, or the item shows as "introuvable" for no reason. NFD-decompose
// then drop the combining-diacritical-marks block (U+0300-U+036F) by code
// point, rather than a \u-escaped regex literal (fragile to re-encoding).
function normalizeLabel(s: string): string {
  const decomposed = s.toLowerCase().trim().normalize("NFD");
  let out = "";
  for (const ch of decomposed) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x0300 || code > 0x036f) out += ch;
  }
  return out;
}

export default function PaniersTab({ products, lang, font }: {
  products: DBProduct[];
  lang: Lang;
  font: string;
}) {
  const [baskets,     setBaskets]     = useState<Panier[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [draft,       setDraft]       = useState<Panier | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState("");
  const [toolRunning, setToolRunning] = useState<"corrections" | "labels" | null>(null);
  const [toolResult,  setToolResult]  = useState<string>("");

  useEffect(() => {
    getPaniers()
      .then(data => setBaskets(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openEdit(b: Panier) { setDraft(JSON.parse(JSON.stringify(b))); setSaveErr(""); }
  function cancelEdit() { setDraft(null); setSaveErr(""); }

  async function saveEdit() {
    if (!draft) return;
    setSaving(true); setSaveErr("");
    try {
      const { id, order, ...data } = draft;
      await updatePanier(id, data);
      setBaskets(bs => bs.map(b => b.id === id ? draft : b));
      setDraft(null);
    } catch {
      setSaveErr(lang === "ar" ? "فشل الحفظ — حاول مجدداً" : "Erreur de sauvegarde — réessayez.");
    } finally { setSaving(false); }
  }

  async function runCorrections() {
    setToolRunning("corrections"); setToolResult("");
    try {
      const r = await applyProductCorrections();
      setToolResult(`Corrections: ${r.changed} produit(s) corrigé(s), ${r.skipped} inchangé(s).`);
    } catch {
      setToolResult("Erreur lors des corrections produits.");
    } finally { setToolRunning(null); }
  }

  async function runFixLabels() {
    setToolRunning("labels"); setToolResult("");
    try {
      const r = await fixPanierLabels();
      const notFound = r.total_unfixed > 0 ? ` ${r.total_unfixed} label(s) introuvable(s).` : "";
      setToolResult(`Labels: ${r.total_fixed} corrigé(s).${notFound}`);
      // Reload paniers so the UI reflects updated labels
      getPaniers().then(data => setBaskets(data)).catch(() => {});
    } catch {
      setToolResult("Erreur lors de la correction des labels.");
    } finally { setToolRunning(null); }
  }

  function setItem(ii: number, field: keyof BasketItem, val: string | number) {
    setDraft(d => d ? { ...d, items: d.items.map((it, i) => i === ii ? { ...it, [field]: val } : it) } : d);
  }
  function removeItem(ii: number) {
    setDraft(d => d ? { ...d, items: d.items.filter((_, i) => i !== ii) } : d);
  }
  function addItem() {
    setDraft(d => d ? { ...d, items: [...d.items, { label: "", qty: 1, unit: "kg" }] } : d);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-[#2E8B57]">
        <Loader2 size={26} className="animate-spin" />
        <p className={"font-semibold text-sm " + font}>
          {lang === "ar" ? "جارٍ تحميل السلال..." : "Chargement des paniers…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h2 className={"text-base font-extrabold text-gray-800 " + font}>
            {lang === "ar" ? "السلال الجاهزة" : "Paniers pré-composés"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === "ar"
              ? "مخزّنة في قاعدة البيانات — التغييرات مرئية لجميع المديرين"
              : "Stockés en base de données — modifications visibles par tous les admins"}
          </p>
        </div>
        <span className="text-xs font-bold text-[#2E8B57] bg-green-50 px-3 py-1.5 rounded-full">
          {baskets.length} paniers
        </span>
      </div>

      {/* ── Admin Tools ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-1">
          Outils admin
        </span>
        <button onClick={runCorrections} disabled={toolRunning !== null}
          className="flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#2E8B57] hover:text-[#2E8B57] disabled:opacity-50 transition">
          {toolRunning === "corrections" && <Loader2 size={11} className="animate-spin" />}
          Corriger unités/catégories
        </button>
        <button onClick={runFixLabels} disabled={toolRunning !== null}
          className="flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#2E8B57] hover:text-[#2E8B57] disabled:opacity-50 transition">
          {toolRunning === "labels" && <Loader2 size={11} className="animate-spin" />}
          Corriger labels paniers
        </button>
        {toolResult && (
          <span className="text-xs font-semibold text-[#2E8B57] ml-1">{toolResult}</span>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={cancelEdit}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className={"font-extrabold text-gray-800 " + font}>
                {lang === "ar" ? "تعديل السلة" : "Modifier le panier"}
              </h3>
              <button onClick={cancelEdit}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm">
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Titre</label>
                  <input value={draft.title}
                    onChange={e => setDraft(d => d ? { ...d, title: e.target.value } : d)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57]" />
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Pers.</label>
                  <input type="number" min="1" value={draft.persons}
                    onChange={e => setDraft(d => d ? { ...d, persons: parseInt(e.target.value) || 1 } : d)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57]" />
                </div>
              </div>

              {/* Pack price — admin-set, authoritative. Customers only ever see this. */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {lang === "ar" ? "💰 سعر السلة" : "💰 Prix du pack"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">
                      {lang === "ar" ? "السعر النهائي (درهم)" : "Prix final (MAD)"}
                    </label>
                    <input type="number" step="0.5" min="0" value={draft.price ?? ""}
                      onChange={e => setDraft(d => d ? { ...d, price: e.target.value ? parseFloat(e.target.value) : null } : d)}
                      placeholder="ex: 150"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57] font-latin" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 mb-1 block">
                      {lang === "ar" ? "السعر الأصلي (اختياري)" : "Prix barré (optionnel)"}
                    </label>
                    <input type="number" step="0.5" min="0" value={draft.original_price ?? ""}
                      onChange={e => setDraft(d => d ? { ...d, original_price: e.target.value ? parseFloat(e.target.value) : null } : d)}
                      placeholder="ex: 180"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#2E8B57] font-latin" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  {lang === "ar"
                    ? "السعر النهائي هو ما يراه العميل فقط. حساب من الكتالوج أدناه للمرجع فقط."
                    : "Le client voit uniquement le prix final. Le total catalogue ci-dessous n'est qu'une référence pour vous aider à fixer ce prix."}
                  {(() => {
                    const ref = draft.items.reduce((s, it) => {
                      const norm = normalizeLabel(it.label);
                      const p = (products as any[]).find((p: any) => normalizeLabel(p.name_fr || "") === norm);
                      return s + (p ? p.price_mad * it.qty : 0);
                    }, 0);
                    return ref > 0 ? ` Référence catalogue: ${ref.toFixed(2)} MAD.` : "";
                  })()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {lang === "ar" ? "المواد (الاسم يجب أن يطابق Nom FR في الكتالوج)" : "Articles (label = Nom FR exact du catalogue)"}
                </p>
                {draft.items.map((it, ii) => (
                  <div key={ii} className="flex items-center gap-1.5">
                    <input value={it.label}
                      onChange={e => setItem(ii, "label", e.target.value)}
                      placeholder={lang === "ar" ? "اسم المنتج بالفرنسية" : "Nom FR du produit"}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs outline-none focus:border-[#2E8B57]" />
                    <input type="number" min="0.25" step="0.25" value={it.qty}
                      onChange={e => setItem(ii, "qty", parseFloat(e.target.value) || 1)}
                      className="w-14 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-right outline-none focus:border-[#2E8B57] font-latin" />
                    <select value={it.unit} onChange={e => setItem(ii, "unit", e.target.value)}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-1 py-1.5 text-xs outline-none focus:border-[#2E8B57]">
                      {["kg","piece","100g","botte","g","litre","boite"].map(u => <option key={u}>{u}</option>)}
                    </select>
                    <button onClick={() => removeItem(ii)}
                      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs">
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={addItem}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-[#2E8B57]/40 px-3 py-1.5 text-xs font-semibold text-[#2E8B57] hover:bg-[#2E8B57]/5 transition w-full justify-center">
                  {"+ " + (lang === "ar" ? "إضافة مادة" : "Ajouter un article")}
                </button>
              </div>
              {saveErr && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{saveErr}</p>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
              <button onClick={cancelEdit} disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                {lang === "ar" ? "إلغاء" : "Annuler"}
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#2E8B57,#1a6b42)" }}>
                {saving && <Loader2 size={13} className="animate-spin" />}
                {lang === "ar" ? "حفظ في قاعدة البيانات" : "Sauvegarder en base"}
              </button>
            </div>
          </div>
        </div>
      )}

      {baskets.map(basket => {
        const liveItems = basket.items.map(bi => {
          // Match by name_fr (accent- and case-insensitive)
          const normLabel = normalizeLabel(bi.label);
          const liveP = (products as any[]).find((p: any) =>
            normalizeLabel(p.name_fr || "") === normLabel
          );
          const livePrice = liveP ? liveP.price_mad : null;
          const lineTotal = livePrice !== null ? livePrice * bi.qty : null;
          return { ...bi, livePrice, lineTotal, inStock: liveP?.in_stock ?? null };
        });
        const liveTotal  = liveItems.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
        const hasOOS     = liveItems.some(i => i.inStock === false);
        const missingCount = liveItems.filter(i => i.livePrice === null).length;

        return (
          <div key={basket.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `2px solid ${basket.accent}25`, background: `${basket.accent}08` }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={"font-extrabold text-gray-800 " + font}>{basket.title}</h3>
                  <button onClick={() => openEdit(basket)} title={lang === "ar" ? "تعديل" : "Modifier"}
                    className="h-5 w-5 flex items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:text-[#2E8B57] hover:border-[#2E8B57]/40 transition text-[11px]">
                    ✎
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-latin">
                  {basket.persons} pers. &bull; {basket.items.length} produits
                  {missingCount > 0 && (
                    <span className="ml-2 text-amber-500 font-semibold">
                      ⚠ {missingCount} non trouvé{missingCount > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                {basket.price ? (
                  <>
                    {basket.original_price && basket.original_price > basket.price && (
                      <p className="text-[11px] text-gray-300 line-through font-latin">{basket.original_price.toFixed(2)} MAD</p>
                    )}
                    <p className="text-lg font-black font-latin" style={{ color: basket.accent }}>
                      {basket.price.toFixed(2)} MAD
                    </p>
                    <p className="text-[9px] text-gray-400 font-semibold">
                      {lang === "ar" ? "سعر ثابت (يراه العميل)" : "prix fixe (vu par le client)"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-amber-500 font-latin">
                    {lang === "ar" ? "⚠ لا يوجد سعر" : "⚠ Prix non défini"}
                  </p>
                )}
                {liveTotal > 0 && (
                  <p className="text-[9px] text-gray-300 font-latin mt-0.5">
                    {lang === "ar" ? "مرجع الكتالوج" : "réf. catalogue"}: {liveTotal.toFixed(2)} MAD
                  </p>
                )}
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
                      <p className="text-[10px] text-gray-400 font-latin">{item.qty} {item.unit}</p>
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
                      <span className="text-[10px] text-amber-500 font-semibold font-latin">
                        Produit introuvable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasOOS && (
              <div className="px-5 py-2 bg-amber-50 border-t border-amber-100">
                <p className="text-[10px] font-bold text-amber-600">
                  {lang === "ar" ? "تحذير: منتج(ات) غير متوفرة في هذه السلة" : "Attention: produit(s) en rupture dans ce panier"}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
