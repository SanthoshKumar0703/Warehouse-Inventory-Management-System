import React, { useCallback, useEffect, useState } from "react";
import {
  Package,
  Tags,
  Warehouse,
  Truck,
  ClipboardList,
  Boxes,
  AlertTriangle,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Brain,
} from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import StockLineChart from "../components/charts/StockLineChart.jsx";
import DistributionChart from "../components/charts/DistributionChart.jsx";
import BarChartHorizontal from "../components/charts/BarChartHorizontal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useRealtimeEvent } from "../hooks/useRealtimeEvent.js";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/dashboard/recent-activity"),
      api.get("/dashboard/analytics"),
      api.get("/dashboard/predictions"),
    ]).then(([summaryRes, activityRes, analyticsRes, predictionsRes]) => {
      setSummary(summaryRes.data);
      setActivities(activityRes.data.activities);
      setAnalytics(analyticsRes.data);
      setPredictions(predictionsRes.data.predictions);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Any real-time event (product added, stock changed, PO approved, etc.)
  // refreshes the live dashboard cards, charts, and activity feed.
  useRealtimeEvent(useCallback(() => { fetchAll(); }, [fetchAll]));

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">
          Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Here's what's happening across your warehouses today.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-card h-24 animate-pulse bg-overlay" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total Products" value={summary?.total_products ?? 0} icon={Package} delay={0} />
            <StatCard label="Categories" value={summary?.total_categories ?? 0} icon={Tags} delay={0.03} />
            <StatCard label="Warehouses" value={summary?.total_warehouses ?? 0} icon={Warehouse} delay={0.06} />
            <StatCard label="Suppliers" value={summary?.total_suppliers ?? 0} icon={Truck} delay={0.09} />
            <StatCard label="Purchase Orders" value={summary?.purchase_orders ?? 0} icon={ClipboardList} delay={0.12} />
            <StatCard label="Available Stock" value={summary?.available_stock ?? 0} icon={Boxes} delay={0.15} />
            <StatCard label="Low Stock" value={summary?.low_stock ?? 0} icon={AlertTriangle} accent="warning" delay={0.18} />
            <StatCard label="Out of Stock" value={summary?.out_of_stock ?? 0} icon={XCircle} accent="danger" delay={0.21} />
            <StatCard label="Today's Stock In" value={summary?.today_stock_in ?? 0} icon={ArrowDownToLine} accent="success" delay={0.24} />
            <StatCard label="Today's Stock Out" value={summary?.today_stock_out ?? 0} icon={ArrowUpFromLine} delay={0.27} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            <div className="glass-card p-5 lg:col-span-2">
              <h2 className="font-display font-semibold mb-4">Stock In vs Stock Out</h2>
              <StockLineChart
                labels={analytics?.monthly_labels || []}
                stockIn={analytics?.stock_in_series || []}
                stockOut={analytics?.stock_out_series || []}
              />
            </div>
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold mb-4">Category Distribution</h2>
              <DistributionChart
                labels={(analytics?.category_distribution || []).map((c) => c.label)}
                values={(analytics?.category_distribution || []).map((c) => c.value)}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-6">
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold mb-4">Warehouse Analytics</h2>
              <BarChartHorizontal
                labels={(analytics?.warehouse_analytics || []).map((w) => w.label)}
                values={(analytics?.warehouse_analytics || []).map((w) => w.value)}
              />
            </div>
            <div className="glass-card p-5">
              <h2 className="font-display font-semibold mb-4">Top Moving Products</h2>
              <BarChartHorizontal
                labels={(analytics?.top_moving_products || []).map((p) => p.label)}
                values={(analytics?.top_moving_products || []).map((p) => p.value)}
              />
            </div>
          </div>

          <div className="glass-card mt-6 p-5 border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Smart Reorder Recommendations</h2>
            </div>
            {predictions.length === 0 ? (
              <p className="text-text-secondary text-sm">
                Not enough stock-out history yet to generate predictions. Record some Stock Out
                movements and check back here.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {predictions.map((p) => (
                  <div key={p.product_id} className="bg-background rounded-xl p-4 border border-subtle">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{p.product_name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.days_remaining <= 7 ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                        }`}
                      >
                        {p.days_remaining} days left
                      </span>
                    </div>
                    <p className="text-text-secondary text-xs">
                      Using ~{p.avg_daily_usage}/day · {p.current_quantity} in stock
                    </p>
                    {p.recommended_reorder > 0 && (
                      <p className="text-xs mt-1">
                        Recommended reorder: <span className="text-primary font-medium">{p.recommended_reorder} units</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card mt-6 p-5">
            <h2 className="font-display font-semibold mb-4">Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="text-text-secondary text-sm">
                No activity yet — actions across the system will show up here in real time.
              </p>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm border-b border-subtle pb-2 last:border-0">
                    <span>
                      <span className="text-primary font-medium">{a.user}</span> — {a.action}
                    </span>
                    <span className="text-text-secondary text-xs">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
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
