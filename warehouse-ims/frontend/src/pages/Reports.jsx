import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileBarChart, FileText, FileSpreadsheet, Printer, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const REPORTS = [
  { key: "inventory", label: "Inventory Report", desc: "Every product, its stock level, and status" },
  { key: "warehouse", label: "Warehouse Report", desc: "Product counts and total units per warehouse" },
  { key: "product", label: "Product Report", desc: "Full product catalog with pricing" },
  { key: "supplier", label: "Supplier Report", desc: "Suppliers, order counts, and total spend" },
  { key: "purchase", label: "Purchase Report", desc: "All purchase orders and their status" },
];

export default function Reports() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    setAuditLoading(true);
    api.get("/dashboard/audit-logs", { params: { page: auditPage, per_page: 10 } })
      .then((res) => {
        setAuditLogs(res.data.logs);
        setAuditTotalPages(res.data.total_pages || 1);
      })
      .finally(() => setAuditLoading(false));
  }, [auditPage, user]);

  const download = async (reportKey, format) => {
    const busyKey = `${reportKey}-${format}`;
    setDownloading(busyKey);
    try {
      const res = await api.get(`/reports/${reportKey}`, {
        params: { format },
        responseType: "blob",
      });
      const ext = format === "excel" ? "xlsx" : "pdf";
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${reportKey}_report.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`${reportKey[0].toUpperCase() + reportKey.slice(1)} report downloaded.`);
    } catch (err) {
      toast.error("Could not generate the report.");
    } finally {
      setDownloading(null);
    }
  };

  const printReport = async (reportKey) => {
    setDownloading(`${reportKey}-print`);
    try {
      const res = await api.get(`/reports/${reportKey}`, { params: { format: "pdf" }, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const win = window.open(blobUrl, "_blank");
      if (win) win.onload = () => win.print();
    } catch (err) {
      toast.error("Could not prepare the report for printing.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Reports</h1>
        <p className="text-text-secondary text-sm mt-1">Export or print any report as PDF or Excel</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="glass-card p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <FileBarChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold">{r.label}</h3>
                <p className="text-text-secondary text-xs mt-0.5">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => download(r.key, "pdf")}
                disabled={downloading === `${r.key}-pdf`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-subtle rounded-lg py-2 hover:bg-overlay transition disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => download(r.key, "excel")}
                disabled={downloading === `${r.key}-excel`}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-subtle rounded-lg py-2 hover:bg-overlay transition disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => printReport(r.key)}
                disabled={downloading === `${r.key}-print`}
                className="flex items-center justify-center gap-1.5 text-xs border border-subtle rounded-lg py-2 px-3 hover:bg-overlay transition disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {user?.role === "admin" && (
        <div className="glass-card mt-6 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-4 h-4 text-primary" />
            <h2 className="font-display font-semibold">Audit Log</h2>
          </div>
          {auditLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-overlay rounded-lg animate-pulse" />)}
            </div>
          ) : auditLogs.length === 0 ? (
            <p className="text-text-secondary text-sm">No audit activity yet.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {auditLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between text-sm border-b border-subtle pb-2 last:border-0">
                    <span><span className="text-primary font-medium">{log.user}</span> — {log.action}{log.details ? `: ${log.details}` : ""}</span>
                    <span className="text-text-secondary text-xs">{new Date(log.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              {auditTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button disabled={auditPage <= 1} onClick={() => setAuditPage((p) => p - 1)} className="p-1.5 rounded-lg border border-subtle disabled:opacity-40 hover:bg-overlay">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-text-secondary">Page {auditPage} of {auditTotalPages}</span>
                  <button disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage((p) => p + 1)} className="p-1.5 rounded-lg border border-subtle disabled:opacity-40 hover:bg-overlay">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
