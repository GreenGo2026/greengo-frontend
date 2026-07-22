// src/components/admin/AuditHistory.tsx
import { useEffect, useState } from "react";
import { apiClient } from "../../services/api";

interface AuditChange {
  old: any;
  new: any;
}

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, AuditChange>;
  admin_id: string;
  ip: string;
  endpoint: string;
  timestamp: string;
}

interface Props {
  entityType: string;
  entityId: string;
}

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  create: { label: "Créé", color: "bg-green-100 text-green-700" },
  update: { label: "Modifié", color: "bg-blue-100 text-blue-700" },
  delete: { label: "Supprimé", color: "bg-red-100 text-red-700" },
};

const FIELD_LABELS: Record<string, string> = {
  price_mad: "Prix (MAD)",
  unit: "Unité",
  category: "Catégorie",
  name_fr: "Nom FR",
  name_ar: "Nom AR",
  in_stock: "En stock",
  visible: "Visible",
  on_sale: "En promo",
  discount_pct: "Réduction %",
  description_fr: "Description",
  variants: "Variantes",
  stock_qty: "Quantité stock",
  image_url: "Image",
  status: "Statut",
  total_price: "Total",
  delivery_fee: "Frais livraison",
  title: "Titre",
  price: "Prix pack",
  items: "Produits",
  meta_line: "Meta line",
  persons: "Personnes",
};

function formatValue(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Oui" : "Non";
  if (Array.isArray(val)) return `[${val.length} éléments]`;
  if (typeof val === "object") return JSON.stringify(val).slice(0, 80);
  return String(val);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditHistory({ entityType, entityId }: Props) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    apiClient
      .get(`/audit-log/${entityType}/${entityId}?limit=50`)
      .then((res) => {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Chargement de l'historique...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Aucune modification enregistrée.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          📋 Historique des modifications
        </h3>
        <span className="text-xs text-gray-400">
          {total} entrée{total > 1 ? "s" : ""} · 90 jours
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {logs.map((log) => {
          const badge = ACTION_BADGES[log.action] || ACTION_BADGES.update;
          const changeKeys = Object.keys(log.changes || {});

          return (
            <div key={log.id} className="relative pl-10 pb-6">
              <div
                className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                  log.action === "create"
                    ? "bg-green-500"
                    : log.action === "delete"
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
                style={{ top: "6px" }}
              />

              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
                  <span className="text-xs text-gray-300 ml-auto">
                    {log.admin_id}
                    {log.ip !== "unknown" ? ` · ${log.ip}` : ""}
                  </span>
                </div>

                {changeKeys.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="text-left py-1 pr-2 font-medium">Champ</th>
                        <th className="text-left py-1 pr-2 font-medium">Avant</th>
                        <th className="text-left py-1 font-medium">Après</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changeKeys.map((field) => (
                        <tr key={field} className="border-b border-gray-50">
                          <td className="py-1.5 pr-2 font-medium text-gray-700">
                            {FIELD_LABELS[field] || field}
                          </td>
                          <td className="py-1.5 pr-2 text-red-500 line-through">
                            {formatValue(log.changes[field].old)}
                          </td>
                          <td className="py-1.5 text-green-600 font-semibold">
                            {formatValue(log.changes[field].new)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {changeKeys.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    Action sans détail de changement.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
