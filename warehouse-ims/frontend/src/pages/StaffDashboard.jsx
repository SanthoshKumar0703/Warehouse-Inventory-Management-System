import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  XCircle,
  PackageSearch,
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useRealtimeEvent } from "../hooks/useRealtimeEvent.js";

/** Minimal, task-focused dashboard for Staff — today's stock activity,
 * quick actions, and which products need attention. No analytics/AI. */
export default function StaffDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [attentionProducts, setAttentionProducts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/products", { params: { stock_status: "low_stock", per_page: 5 } }),
      api.get("/dashboard/recent-activity"),
    ]).then(([summaryRes, productsRes, activityRes]) => {
      setSummary(summaryRes.data);
      setAttentionProducts(productsRes.data.products);
      setActivities(activityRes.data.activities.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useRealtimeEvent(useCallback(() => { fetchAll(); }, [fetchAll]));

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">
          Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Here's what needs your attention today.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link to="/stock-in" className="glass-card p-5 flex items-center gap-3 hover:shadow-glow transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-success/15 flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Stock In</p>
            <p className="text-text-secondary text-xs">Record incoming stock</p>
          </div>
        </Link>
        <Link to="/stock-out" className="glass-card p-5 flex items-center gap-3 hover:shadow-glow transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-warning/15 flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm">Stock Out</p>
            <p className="text-text-secondary text-xs">Record outgoing stock</p>
          </div>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse bg-overlay" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Today's Stock In" value={summary?.today_stock_in ?? 0} icon={ArrowDownToLine} accent="success" delay={0} />
            <StatCard label="Today's Stock Out" value={summary?.today_stock_out ?? 0} icon={ArrowUpFromLine} delay={0.05} />
            <StatCard label="Low Stock" value={summary?.low_stock ?? 0} icon={AlertTriangle} accent="warning" delay={0.1} />
            <StatCard label="Out of Stock" value={summary?.out_of_stock ?? 0} icon={XCircle} accent="danger" delay={0.15} />
          </div>

          <div className="glass-card mt-6 p-5">
            <h2 className="font-display font-semibold mb-4">Needs Attention</h2>
            {attentionProducts.length === 0 ? (
              <p className="text-text-secondary text-sm flex items-center gap-2">
                <PackageSearch className="w-4 h-4" /> Nothing running low right now.
              </p>
            ) : (
              <ul className="space-y-2">
                {attentionProducts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm border-b border-subtle pb-2 last:border-0">
                    <span>{p.name} <span className="text-text-secondary">({p.sku})</span></span>
                    <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">{p.quantity} left</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="glass-card mt-6 p-5">
            <h2 className="font-display font-semibold mb-4">Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="text-text-secondary text-sm">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm border-b border-subtle pb-2 last:border-0">
                    <span><span className="text-primary font-medium">{a.user}</span> — {a.action}</span>
                    <span className="text-text-secondary text-xs">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
