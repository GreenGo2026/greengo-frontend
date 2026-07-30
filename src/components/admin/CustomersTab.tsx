// src/components/admin/CustomersTab.tsx
import { useEffect, useState } from "react";
import { apiClient } from "../../services/api";

const SEGMENT_CONFIG: Record<string, { label: string; color: string }> = {
  vip:     { label: "VIP",      color: "bg-yellow-100 text-yellow-800" },
  regular: { label: "Régulier", color: "bg-blue-100 text-blue-800" },
  new:     { label: "Nouveau",  color: "bg-green-100 text-green-800" },
};

interface Customer {
  id: string;
  phone: string;
  name: string;
  zone: string;
  total_orders: number;
  total_spent: number;
  last_order: string;
  loyalty_points: number;
  segment: string;
}

export default function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [segments, setSegments] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [segFilter, setSegFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = { limit: "100" };
    if (search) params.search = search;
    if (segFilter) params.segment = segFilter;
    apiClient
      .get("/customers", { params })
      .then((res) => {
        if (cancelled) return;
        setCustomers(res.data.customers || []);
        setTotal(res.data.total || 0);
        setSegments(res.data.segments || {});
      })
      .catch(() => { if (!cancelled) setCustomers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, segFilter]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(SEGMENT_CONFIG).map(([seg, cfg]) => (
          <button
            key={seg}
            onClick={() => setSegFilter(segFilter === seg ? "" : seg)}
            className={`rounded-xl p-4 text-center border-2 transition-all bg-white ${
              segFilter === seg ? "border-[#0c3228]" : "border-gray-100"
            }`}
          >
            <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-1 ${cfg.color}`}>
              {cfg.label}
            </p>
            <p className="text-2xl font-bold text-[#0c3228]">{segments[seg] || 0}</p>
          </button>
        ))}
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par nom ou téléphone…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#0c3228] focus:outline-none"
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Zone</th>
                <th className="px-4 py-3 text-right">Commandes</th>
                <th className="px-4 py-3 text-right">Total dépensé</th>
                <th className="px-4 py-3 text-right">Points</th>
                <th className="px-4 py-3 text-left">Segment</th>
                <th className="px-4 py-3 text-left">Dernière cmd</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chargement…</td></tr>
              ) : customers.map((c) => {
                const segCfg = SEGMENT_CONFIG[c.segment] || SEGMENT_CONFIG.new;
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.name || "—"}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{c.zone || "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{c.total_orders}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#0c3228]">{c.total_spent.toFixed(2)} MAD</td>
                    <td className="px-4 py-3 text-right text-[#C9A96E] font-medium">{c.loyalty_points} pts</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${segCfg.color}`}>{segCfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.last_order ? new Date(c.last_order).toLocaleDateString("fr-MA") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && customers.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">Aucun client trouvé.</div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">{total} client{total > 1 ? "s" : ""} au total</p>
    </div>
  );
}
