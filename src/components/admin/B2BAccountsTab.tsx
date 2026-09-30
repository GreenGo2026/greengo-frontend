// src/components/admin/B2BAccountsTab.tsx
// Extracted from CustomersTab.tsx's "Comptes B2B" section into its own
// dedicated admin tab -- one source of truth, self-contained like every
// other admin tab (no props from AdminPage).
import { useEffect, useState } from "react";
import { apiClient } from "../../services/api";

interface B2BAccount {
  phone:            string;
  business_name:    string;
  ice_number:       string;
  payment_terms:    "cod" | "net7" | "net30";
  credit_limit_mad: number;
  outstanding_mad:  number;
  overdue_count:    number;
  orders_30d:       number;
  volume_30d_mad:   number;
}

export default function B2BAccountsTab() {
  const [accounts, setAccounts] = useState<B2BAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    phone: "", business_name: "", ice_number: "",
    payment_terms: "net7" as "cod" | "net7" | "net30",
    credit_limit_mad: "500",
  });
  const [saving, setSaving] = useState(false);

  function load(): void {
    setLoading(true);
    apiClient.get("/admin/b2b/accounts")
      .then((res) => setAccounts(res.data || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function promote(): Promise<void> {
    setSaving(true);
    setError("");
    try {
      await apiClient.patch(`/customers/${encodeURIComponent(form.phone.trim())}/promote-b2b`, {
        business_name:    form.business_name.trim(),
        ice_number:       form.ice_number.trim(),
        payment_terms:    form.payment_terms,
        credit_limit_mad: parseFloat(form.credit_limit_mad) || 0,
      });
      setForm({ phone: "", business_name: "", ice_number: "", payment_terms: "net7", credit_limit_mad: "500" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erreur lors de la promotion.");
    } finally {
      setSaving(false);
    }
  }

  async function revoke(phone: string): Promise<void> {
    try {
      await apiClient.patch(`/customers/${encodeURIComponent(phone)}/revoke-b2b`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Erreur lors de la révocation.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-[#0c3228]">🏢 Comptes B2B</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs font-semibold text-[#2E8B57] hover:text-[#1F6B40]"
          >
            {showForm ? "Annuler" : "+ Promouvoir un client"}
          </button>
        </div>

        {showForm && (
          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 border-b border-gray-100">
            <input placeholder="Téléphone (+212...)" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Nom de l'entreprise" value={form.business_name}
              onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="ICE (optionnel)" value={form.ice_number}
              onChange={(e) => setForm((f) => ({ ...f, ice_number: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <select value={form.payment_terms}
              onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value as any }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="cod">COD</option>
              <option value="net7">NET-7</option>
              <option value="net30">NET-30</option>
            </select>
            <input type="number" placeholder="Plafond de crédit (MAD)" value={form.credit_limit_mad}
              onChange={(e) => setForm((f) => ({ ...f, credit_limit_mad: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            {error && <p className="col-span-2 text-xs font-semibold text-red-500">{error}</p>}
            <button onClick={promote} disabled={saving || !form.phone.trim() || !form.business_name.trim()}
              className="col-span-2 rounded-lg bg-[#2E8B57] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
              {saving ? "Enregistrement…" : "Promouvoir"}
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Entreprise</th>
                <th className="px-4 py-3 text-left">Termes</th>
                <th className="px-4 py-3 text-right">Plafond</th>
                <th className="px-4 py-3 text-right">Impayé</th>
                <th className="px-4 py-3 text-right">En retard</th>
                <th className="px-4 py-3 text-right">30j (cmd / MAD)</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chargement…</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun compte B2B.</td></tr>
              ) : accounts.map((a) => (
                <tr key={a.phone} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{a.business_name || "—"}</p>
                    <p className="text-xs text-gray-400 font-mono">{a.phone}</p>
                  </td>
                  <td className="px-4 py-3 uppercase text-xs font-bold text-gray-600">{a.payment_terms}</td>
                  <td className="px-4 py-3 text-right">{a.credit_limit_mad.toFixed(2)} MAD</td>
                  <td className={"px-4 py-3 text-right font-semibold " + (a.outstanding_mad > 0 ? "text-orange-600" : "text-gray-400")}>
                    {a.outstanding_mad.toFixed(2)} MAD
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.overdue_count > 0
                      ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">{a.overdue_count}</span>
                      : <span className="text-gray-300">0</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">
                    {a.orders_30d} / {a.volume_30d_mad.toFixed(0)} MAD
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => revoke(a.phone)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700">
                      Révoquer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
