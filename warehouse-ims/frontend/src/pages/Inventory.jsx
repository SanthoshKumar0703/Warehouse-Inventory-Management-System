import React, { useCallback, useEffect, useState } from "react";
import { Boxes, ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import api from "../api/axios.js";
import { useRealtimeEvent } from "../hooks/useRealtimeEvent.js";

export default function Inventory() {
  const [logs, setLogs] = useState([]);
  const [movementFilter, setMovementFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    api
      .get("/inventory/logs", { params: { movement_type: movementFilter || undefined, page, per_page: 15 } })
      .then((res) => {
        setLogs(res.data.logs);
        setTotalPages(res.data.total_pages || 1);
      })
      .finally(() => setLoading(false));
  }, [movementFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => setPage(1), [movementFilter]);

  // Live-refresh the log whenever any stock movement happens anywhere in the app.
  useRealtimeEvent(useCallback((event) => {
    if (["stock_added", "stock_removed", "inventory_updated"].includes(event.type)) {
      fetchLogs();
    }
  }, [fetchLogs]));

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Inventory History</h1>
          <p className="text-text-secondary text-sm mt-1">Every stock movement, logged in real time</p>
        </div>
        <select className="input-field w-auto" value={movementFilter} onChange={(e) => setMovementFilter(e.target.value)}>
          <option value="">All Movements</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-overlay rounded-lg animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <Boxes className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No inventory movements yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-subtle">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Movement</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-subtle last:border-0 hover:bg-overlay">
                  <td className="px-5 py-3 font-medium">{log.product_name}</td>
                  <td className="px-5 py-3">
                    {log.movement_type === "in" ? (
                      <span className="inline-flex items-center gap-1.5 text-success text-xs bg-success/10 px-2 py-1 rounded-full">
                        <ArrowDownToLine className="w-3 h-3" /> Stock In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-warning text-xs bg-warning/10 px-2 py-1 rounded-full">
                        <ArrowUpFromLine className="w-3 h-3" /> Stock Out
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">{log.quantity}</td>
                  <td className="px-5 py-3 text-text-secondary">{log.reason || "—"}</td>
                  <td className="px-5 py-3 text-text-secondary text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-subtle disabled:opacity-40 hover:bg-overlay">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-subtle disabled:opacity-40 hover:bg-overlay">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
