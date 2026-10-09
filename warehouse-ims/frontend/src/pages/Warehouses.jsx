import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Warehouse as WarehouseIcon, MapPin } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Modal from "../components/ui/Modal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { name: "", location: "", capacity: "" };

export default function Warehouses() {
  const { user } = useAuth();
  const canManage = ["admin", "manager"].includes(user?.role);

  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = useCallback(() => {
    setLoading(true);
    api
      .get("/warehouses", { params: { search } })
      .then((res) => setWarehouses(res.data.warehouses))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchWarehouses, 250);
    return () => clearTimeout(t);
  }, [fetchWarehouses]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (wh) => {
    setEditing(wh);
    setForm({ name: wh.name, location: wh.location || "", capacity: wh.capacity ?? "" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, capacity: form.capacity ? parseInt(form.capacity, 10) : null };
    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, payload);
        toast.success("Warehouse updated successfully.");
      } else {
        await api.post("/warehouses", payload);
        toast.success("Warehouse added successfully.");
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (wh) => {
    if (!window.confirm(`Delete "${wh.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/warehouses/${wh.id}`);
      toast.success("Warehouse deleted successfully.");
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete warehouse.");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Warehouses"
        subtitle="Manage your warehouse locations and capacity"
        search={search}
        onSearchChange={setSearch}
        actionLabel="Add Warehouse"
        onAction={openCreate}
        showAction={canManage}
      />

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-32 animate-pulse bg-overlay" />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-secondary">
          <WarehouseIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No warehouses yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div key={wh.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <WarehouseIcon className="w-5 h-5 text-primary" />
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(wh)} className="text-text-secondary hover:text-primary p-1.5">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(wh)} className="text-text-secondary hover:text-danger p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-display font-semibold mb-1">{wh.name}</h3>
              {wh.location && (
                <p className="text-text-secondary text-xs flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> {wh.location}
                </p>
              )}
              {wh.capacity != null && (
                <p className="text-text-secondary text-xs">Capacity: {wh.capacity.toLocaleString()} units</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Warehouse" : "Add Warehouse"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Location</label>
            <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Capacity (units)</label>
            <input type="number" min="0" className="input-field" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Warehouse"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
