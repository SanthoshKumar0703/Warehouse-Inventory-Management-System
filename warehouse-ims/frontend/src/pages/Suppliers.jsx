import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Truck, History } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Modal from "../components/ui/Modal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { name: "", contact_person: "", email: "", phone_number: "", address: "" };

export default function Suppliers() {
  const { user } = useAuth();
  const canManage = ["admin", "manager"].includes(user?.role);

  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchSuppliers = useCallback(() => {
    setLoading(true);
    api
      .get("/suppliers", { params: { search } })
      .then((res) => setSuppliers(res.data.suppliers))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchSuppliers, 250);
    return () => clearTimeout(t);
  }, [fetchSuppliers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact_person: s.contact_person || "",
      email: s.email || "",
      phone_number: s.phone_number || "",
      address: s.address || "",
    });
    setModalOpen(true);
  };

  const openHistory = async (s) => {
    setHistoryFor(s);
    setHistoryOpen(true);
    const res = await api.get(`/suppliers/${s.id}/purchase-history`);
    setHistory(res.data.purchase_history);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form);
        toast.success("Supplier updated successfully.");
      } else {
        await api.post("/suppliers", form);
        toast.success("Supplier added successfully.");
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      toast.success("Supplier deleted successfully.");
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete supplier.");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier contacts and view purchase history"
        search={search}
        onSearchChange={setSearch}
        actionLabel="Add Supplier"
        onAction={openCreate}
        showAction={canManage}
      />

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-overlay rounded-lg animate-pulse" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <Truck className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No suppliers yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-subtle">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-subtle last:border-0 hover:bg-overlay">
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.contact_person || "—"}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.email || "—"}</td>
                  <td className="px-5 py-3 text-text-secondary">{s.phone_number || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openHistory(s)} className="text-text-secondary hover:text-primary p-1.5">
                      <History className="w-4 h-4" />
                    </button>
                    {canManage && (
                      <>
                        <button onClick={() => openEdit(s)} className="text-text-secondary hover:text-primary p-1.5">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s)} className="text-text-secondary hover:text-danger p-1.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Supplier" : "Add Supplier"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Contact Person</label>
            <input className="input-field" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Phone Number</label>
            <input className="input-field" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Address</label>
            <textarea rows={2} className="input-field resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Supplier"}
          </button>
        </form>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Purchase History — ${historyFor?.name || ""}`} maxWidth="max-w-2xl">
        {history.length === 0 ? (
          <p className="text-text-secondary text-sm">No purchase orders with this supplier yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((o) => (
              <div key={o.id} className="flex items-center justify-between border-b border-subtle pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{o.order_number}</p>
                  <p className="text-xs text-text-secondary">{o.warehouse} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">${o.total_amount.toFixed(2)}</p>
                  <span className="text-xs capitalize text-text-secondary">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
