// src/pages/Profile/UserDashboard.tsx
// Phone-based identity — ready for OTP upgrade later
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Package, ChevronRight, Clock, Truck, CheckCircle2,
  XCircle, Phone, Star, MessageCircle, ShoppingCart,
  RefreshCw, Loader2, LogOut, Edit3, Check,
} from "lucide-react";

type L = "fr" | "ar" | "en";
const API = (import.meta.env.VITE_API_URL || "").replace(/[/]+$/, "");
const CACHE_KEY = "gg_dashboard_phone";

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizePhone(p: string): string {
  const d = p.trim().replace(/[\s\-]/g, "");
  if (d.startsWith("+212")) return d;
  if (d.startsWith("212")) return "+" + d;
  if (d.startsWith("0") && d.length === 10) return "+212" + d.slice(1);
  return d;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

type OrderStatus = "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<string, { label_fr: string; label_ar: string; icon: any; bg: string; text: string; border: string }> = {
  pending:          { label_fr: "En attente",     label_ar: "قيد الانتظار",  icon: Clock,        bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200"  },
  confirmed:        { label_fr: "Confirmée",       label_ar: "مؤكد",          icon: CheckCircle2, bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
  preparing:        { label_fr: "En préparation",  label_ar: "قيد التحضير",   icon: Truck,        bg: "bg-purple-50",  text: "text-purple-700", border: "border-purple-200" },
  out_for_delivery: { label_fr: "En livraison",    label_ar: "في الطريق",     icon: Truck,        bg: "bg-indigo-50",  text: "text-indigo-700", border: "border-indigo-200" },
  delivered:        { label_fr: "Livré",           label_ar: "تم التسليم",    icon: CheckCircle2, bg: "bg-green-50",   text: "text-[#2E8B57]",  border: "border-green-200"  },
  cancelled:        { label_fr: "Annulée",         label_ar: "ملغاة",          icon: XCircle,      bg: "bg-red-50",     text: "text-red-600",    border: "border-red-200"    },
};

function getStatus(raw: string) {
  const key = raw?.toLowerCase().replace(/\s+/g, "_");
  return STATUS_CONFIG[key] ?? STATUS_CONFIG["pending"];
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, lang }: { status: string; lang: string }) {
  const cfg  = getStatus(status);
  const Icon = cfg.icon;
  const label = lang === "ar" ? cfg.label_ar : cfg.label_fr;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon size={10} className="shrink-0" />
      {label}
    </span>
  );
}

// ── Points progress bar ───────────────────────────────────────────────────────
function LoyaltyCard({ points, lang }: { points: number; lang: string }) {
  const l        = lang as L;
  const nextTier = points < 100 ? 100 : points < 250 ? 250 : points < 500 ? 500 : 1000;
  const progress = Math.min((points / nextTier) * 100, 100);
  const reward   = nextTier === 100 ? (l === "fr" ? "Livraison offerte" : "توصيل مجاني")
                 : nextTier === 250 ? (l === "fr" ? "-10% sur votre commande" : "خصم 10%")
                 : nextTier === 500 ? (l === "fr" ? "Panier cadeau" : "سلة هدية")
                 : (l === "fr" ? "Statut VIP" : "عضو مميز");
  return (
    <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg,#fdf8ef,#f9efda)", border: "1px solid rgba(201,169,110,0.25)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-[#C9A96E] fill-[#C9A96E]" />
          <span className="text-sm font-extrabold text-[#0c3228]">
            {l === "fr" ? "Points fidélité" : l === "ar" ? "نقاط الولاء" : "Loyalty points"}
          </span>
        </div>
        <span className="text-2xl font-black text-[#C9A96E] font-latin">{points}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-amber-100 mb-2 overflow-hidden">
        <div className="h-full rounded-full bg-[#C9A96E] transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[11px] text-gray-500">
        {l === "fr"
          ? `${nextTier - points} points pour : ${reward}`
          : l === "ar"
          ? `${nextTier - points} نقطة للحصول على: ${reward}`
          : `${nextTier - points} pts to: ${reward}`}
      </p>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ order, lang }: { order: any; lang: string }) {
  const l       = lang as L;
  const shortId = String(order._id || order.id || "").slice(-6).toUpperCase();
  const date    = formatDate(order.created_at || order.date || "");
  const total   = Number(order.total_price || order.total || 0);
  const items   = (order.items || []) as any[];

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-[#2E8B57] font-latin">#{shortId}</p>
          <p className="text-[11px] text-gray-400 font-latin mt-0.5">{date}</p>
        </div>
        <StatusBadge status={order.status || "pending"} lang={lang} />
      </div>
      {items.length > 0 && (
        <div className="space-y-1 mb-3">
          {items.slice(0, 3).map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs text-gray-600">
              <span className={l === "ar" ? "font-arabic" : "font-latin"}>
                {item.name || item.item_name || ""}
                {item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </span>
              <span className="font-latin text-gray-400">
                {((item.price_per_unit || 0) * (item.quantity || 1)).toFixed(2)} MAD
              </span>
            </div>
          ))}
          {items.length > 3 && (
            <p className="text-[10px] text-gray-400">
              +{items.length - 3} {l === "fr" ? "autres articles" : "عناصر أخرى"}
            </p>
          )}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-sm font-black text-[#2E8B57] font-latin">{total.toFixed(2)} MAD</span>
        <div className="flex items-center gap-2">
          <Link to={`/track/${order._id || order.id}`}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#2E8B57] bg-green-50 hover:bg-green-100 transition-colors">
            <Truck size={11} />
            {l === "fr" ? "Suivre" : l === "ar" ? "تتبع" : "Track"}
          </Link>
          <a href={"https://wa.me/212664500789?text=" + encodeURIComponent(
            l === "fr" ? `Bonjour, je voudrais récommander comme la commande #${shortId}` : `مرحبا، أريد إعادة طلب مثل الطلب #${shortId}`
          )} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors">
            <RefreshCw size={11} />
            {l === "fr" ? "Récommander" : l === "ar" ? "إعادة طلب" : "Reorder"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Phone entry screen ────────────────────────────────────────────────────────
function PhoneEntry({ onSubmit, lang }: { onSubmit: (p: string) => void; lang: string }) {
  const l = lang as L;
  const [val, setVal] = useState("");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0d3b36,#2E8B57)" }}>
        <Phone size={32} className="text-white" />
      </div>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, color: "#0c3228", fontStyle: "italic" }}>
          {l === "fr" ? "Votre espace client" : l === "ar" ? "حسابك الشخصي" : "Your account"}
        </h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
          {l === "fr"
            ? "Entrez votre numéro de téléphone pour accéder à vos commandes et points de fidélité."
            : l === "ar"
            ? "أدخل رقم هاتفك للوصول إلى طلباتك ونقاط ولائك."
            : "Enter your phone number to access your orders and loyalty points."}
        </p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        <input type="tel" value={val} onChange={e => setVal(e.target.value)}
          placeholder={l === "fr" ? "06 XX XX XX XX" : "06 XX XX XX XX"}
          className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3.5 text-center text-lg font-bold font-latin text-gray-800 outline-none focus:border-[#2E8B57] focus:ring-2 focus:ring-[#2E8B57]/15 transition-all"
          dir="ltr" onKeyDown={e => e.key === "Enter" && val.trim().length >= 9 && onSubmit(val)} />
        <button onClick={() => onSubmit(val)} disabled={val.trim().length < 9}
          className="w-full rounded-2xl py-3.5 text-sm font-extrabold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#2E8B57,#1a5c4a)", boxShadow: "0 4px 16px rgba(46,139,87,0.25)" }}>
          {l === "fr" ? "Accéder à mon compte" : l === "ar" ? "الوصول إلى حسابي" : "Access my account"}
        </button>
        <p className="text-[10px] text-gray-400">
          {l === "fr"
            ? "Votre numéro est utilisé uniquement pour retrouver vos commandes."
            : "رقمك يُستخدم فقط للعثور على طلباتك."}
        </p>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { language, isRTL } = useLanguage();
  const l    = language as L;
  const font = l === "ar" ? "font-arabic" : "font-latin";

  const [phone,     setPhone]     = useState(() => localStorage.getItem(CACHE_KEY) || "");
  const [profile,   setProfile]   = useState<any>(null);
  const [orders,    setOrders]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [editName,  setEditName]  = useState(false);
  const [nameVal,   setNameVal]   = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");

  const loadData = useCallback(async (ph: string) => {
    const normalized = normalizePhone(ph);
    setLoading(true);
    setError("");
    try {
      // Load customer profile
      const pr = await fetch(`${API}/api/v1/customers/${encodeURIComponent(normalized)}`);
      if (pr.ok) {
        const data = await pr.json();
        setProfile(data);
        setNameVal(data.name || "");
      }
      // Load orders by phone
      const or = await fetch(`${API}/api/v1/orders?phone=${encodeURIComponent(normalized)}&limit=20`);
      if (or.ok) {
        const data = await or.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      setError(l === "fr" ? "Impossible de charger vos données." : "تعذر تحميل بياناتك.");
    } finally {
      setLoading(false);
    }
  }, [l]);

  useEffect(() => {
    if (phone) loadData(phone);
  }, []);

  function handlePhoneSubmit(ph: string) {
    const normalized = normalizePhone(ph);
    localStorage.setItem(CACHE_KEY, normalized);
    setPhone(normalized);
    loadData(normalized);
  }

  function handleLogout() {
    localStorage.removeItem(CACHE_KEY);
    setPhone("");
    setProfile(null);
    setOrders([]);
  }

  if (!phone) return (
    <div className={font} dir={isRTL ? "rtl" : "ltr"} style={{ background: "#FAF7F2", minHeight: "100vh" }}>
      <PhoneEntry onSubmit={handlePhoneSubmit} lang={language} />
    </div>
  );

  const points      = profile?.total_points ?? 0;
  const totalOrders = orders.length;
  const totalSpent  = orders.reduce((s: number, o: any) => s + Number(o.total_price || 0), 0);
  const shortPhone  = phone.replace("+212", "0");

  return (
    <div className={font} dir={isRTL ? "rtl" : "ltr"} style={{ background: "#FAF7F2", minHeight: "100vh" }}>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Identity strip ── */}
        <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,#0d3b36 0%,#1a5c4a 60%,#2E8B57 100%)" }}>
          <div className={`flex items-start justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-xl font-black">
                {(profile?.name || shortPhone)[0]?.toUpperCase() || "?"}
              </div>
              <div>
                {editName ? (
                  <div className="flex items-center gap-2">
                    <input value={nameVal} onChange={e => setNameVal(e.target.value)}
                      className="rounded-lg px-2 py-1 text-sm font-bold text-gray-800 outline-none w-36"
                      autoFocus />
                    <button onClick={() => { setProfile((p: any) => ({ ...p, name: nameVal })); setEditName(false); }}
                      className="text-white/70 hover:text-white">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-white text-base leading-tight">
                      {profile?.name || (l === "fr" ? "Mon compte" : "حسابي")}
                    </p>
                    <button onClick={() => setEditName(true)} className="text-white/40 hover:text-white/70">
                      <Edit3 size={12} />
                    </button>
                  </div>
                )}
                <p className="text-white/50 text-xs font-latin mt-0.5">{shortPhone}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white/70 transition-colors" title="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: l === "fr" ? "Commandes" : "الطلبات", value: totalOrders },
              { label: l === "fr" ? "Dépensé" : "المصروف",  value: totalSpent.toFixed(0) + " MAD" },
              { label: l === "fr" ? "Points" : "النقاط",    value: points },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/10 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-white font-latin leading-none">{s.value}</p>
                <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShoppingCart, label: l === "fr" ? "Commander" : "اطلب الآن",   href: "/shop",  color: "#2E8B57" },
            { icon: MessageCircle,label: l === "fr" ? "Support" : "الدعم",          href: "https://wa.me/212664500789", color: "#25D366", external: true },
            { icon: Package,      label: l === "fr" ? "Mes commandes" : "طلباتي",  href: "#orders", color: "#C9A96E" },
          ].map((a, i) => {
            const Icon = a.icon;
            const inner = (
              <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: a.color + "15" }}>
                  <Icon size={18} style={{ color: a.color }} />
                </div>
                <p className="text-xs font-bold text-gray-700 text-center leading-tight">{a.label}</p>
              </div>
            );
            return (a as any).external
              ? <a key={i} href={a.href} target="_blank" rel="noopener noreferrer">{inner}</a>
              : <Link key={i} to={a.href}>{inner}</Link>;
          })}
        </div>

        {/* ── Loyalty points ── */}
        <LoyaltyCard points={points} lang={language} />

        {/* ── Tabs ── */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm">
          {(["orders", "profile"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${activeTab === tab ? "bg-[#2E8B57] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "orders"
                ? (l === "fr" ? `Commandes${totalOrders > 0 ? ` (${totalOrders})` : ""}` : `الطلبات${totalOrders > 0 ? ` (${totalOrders})` : ""}`)
                : (l === "fr" ? "Mon profil" : "ملفي الشخصي")}
            </button>
          ))}
        </div>

        {/* ── Orders tab ── */}
        {activeTab === "orders" && (
          <div id="orders" className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <Loader2 size={20} className="animate-spin text-[#2E8B57]" />
                <p className="text-gray-400 text-sm">{l === "fr" ? "Chargement..." : "جاري التحميل..."}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-gray-500 text-sm">{error}</p>
                <button onClick={() => loadData(phone)} className="text-xs font-bold text-[#2E8B57] underline">
                  {l === "fr" ? "Réessayer" : "إعادة المحاولة"}
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-14 text-center">
                <span className="text-5xl">📦</span>
                <p className="text-gray-500 text-sm font-semibold">
                  {l === "fr" ? "Aucune commande trouvée" : "لا توجد طلبات"}
                </p>
                <Link to="/shop"
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-[#2E8B57] hover:bg-[#1F6B40] transition-colors">
                  {l === "fr" ? "Passer une commande" : "اطلب الآن"}
                </Link>
              </div>
            ) : (
              orders.map((o: any) => <OrderCard key={o._id || o.id} order={o} lang={language} />)
            )}
          </div>
        )}

        {/* ── Profile tab ── */}
        {activeTab === "profile" && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "#0c3228", fontStyle: "italic" }}>
              {l === "fr" ? "Informations personnelles" : "المعلومات الشخصية"}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">{l === "fr" ? "Téléphone" : "الهاتف"}</p>
                  <p className="text-sm font-bold text-gray-800 font-latin">{shortPhone}</p>
                </div>
              </div>
              {profile?.last_address && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <ChevronRight size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400">{l === "fr" ? "Dernière adresse" : "آخر عنوان"}</p>
                    <p className="text-sm font-semibold text-gray-700">{profile.last_address}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {l === "fr"
                  ? "Votre compte est identifié par votre numéro de téléphone. Une vérification renforcée (OTP) sera disponible prochainement."
                  : "يتم التعرف على حسابك برقم هاتفك. سيتوفر التحقق المعزز (OTP) قريباً."}
              </p>
            </div>
            <button onClick={handleLogout}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100">
              {l === "fr" ? "Changer de numéro" : "تغيير الرقم"}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
