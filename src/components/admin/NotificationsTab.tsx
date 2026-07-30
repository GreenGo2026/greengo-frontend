// src/components/admin/NotificationsTab.tsx
import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../../services/api";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sent:    { label: "Envoyé",   color: "bg-green-100 text-green-700" },
  failed:  { label: "Échoué",   color: "bg-red-100 text-red-700" },
  pending: { label: "En cours", color: "bg-yellow-100 text-yellow-700" },
};

interface Notification {
  id: string;
  recipient_phone: string;
  message: string;
  notification_type: string;
  order_ref?: string;
  status: string;
  error?: string;
  attempts: number;
  created_at: string;
}

interface GreenAPIStatus {
  status: string;
  color: string;
  message: string;
  recent_failures_1h: number;
}

export default function NotificationsTab() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [waStatus, setWaStatus] = useState<GreenAPIStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifsRes, waRes] = await Promise.all([
        apiClient.get("/notifications", {
          params: { limit: 100, hours: 48, ...(statusFilter ? { status: statusFilter } : {}) },
        }),
        apiClient.get("/notifications/greenapi-status"),
      ]);
      setNotifs(notifsRes.data.notifications || []);
      setStats(notifsRes.data.stats || {});
      setWaStatus(waRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRetry(notifId: string) {
    setRetrying(notifId);
    try {
      await apiClient.post(`/notifications/${notifId}/retry`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Retry failed");
    } finally {
      setRetrying(null);
    }
  }

  const waColorMap: Record<string, string> = {
    green:  "bg-green-100 text-green-700 border-green-200",
    red:    "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    gray:   "bg-gray-100 text-gray-600 border-gray-200",
  };
  const waColor = waColorMap[waStatus?.color || "gray"] || waColorMap.gray;

  return (
    <div className="space-y-4">
      {waStatus && (
        <div className={`rounded-xl border p-4 flex items-center justify-between ${waColor}`}>
          <div>
            <p className="font-semibold text-sm">📱 WhatsApp — Green-API</p>
            <p className="text-xs mt-0.5">{waStatus.message}</p>
          </div>
          <div className="text-right">
            {waStatus.recent_failures_1h > 0 && (
              <p className="text-xs font-medium">⚠️ {waStatus.recent_failures_1h} échec(s) dernière heure</p>
            )}
            <button onClick={fetchData} className="text-xs underline mt-1 opacity-70 hover:opacity-100">
              Actualiser
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {(["sent", "failed", "pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
            className={`rounded-xl p-4 text-center bg-white border-2 transition-all ${
              statusFilter === s ? "border-[#0c3228]" : "border-gray-100"
            }`}
          >
            <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-1 ${STATUS_CONFIG[s].color}`}>
              {STATUS_CONFIG[s].label}
            </p>
            <p className="text-2xl font-bold text-[#0c3228]">{stats[s] || 0}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chargement…</div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Aucune notification sur 48h.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifs.map((n) => {
              const cfg = STATUS_CONFIG[n.status] || STATUS_CONFIG.pending;
              return (
                <div key={n.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400 truncate">{n.recipient_phone}</span>
                        {n.order_ref && <span className="text-xs text-gray-300">#{n.order_ref}</span>}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                      {n.error && <p className="text-xs text-red-400 mt-1">⚠️ {n.error}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {n.attempts > 0 && (
                        <p className="text-xs text-gray-300">
                          {n.attempts} tentative{n.attempts > 1 ? "s" : ""}
                        </p>
                      )}
                      {n.status === "failed" && (
                        <button
                          onClick={() => handleRetry(n.id)}
                          disabled={retrying === n.id}
                          className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 mt-1 block"
                        >
                          {retrying === n.id ? "…" : "↺ Retry"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
