import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Tags } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Modal from "../components/ui/Modal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Categories() {
  const { user } = useAuth();
  const canManage = ["admin", "manager"].includes(user?.role);

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    api
      .get("/categories", { params: { search } })
      .then((res) => setCategories(res.data.categories))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCategories, 250);
    return () => clearTimeout(t);
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description || "" });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success("Category updated successfully.");
      } else {
        await api.post("/categories", form);
        toast.success("Category added successfully.");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success("Category deleted successfully.");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete category.");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Categories"
        subtitle="Organize your products into categories"
        search={search}
        onSearchChange={setSearch}
        actionLabel="Add Category"
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
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <Tags className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No categories yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-subtle">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Products</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-subtle last:border-0 hover:bg-overlay">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-text-secondary">{c.description || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {c.product_count}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openEdit(c)} className="text-text-secondary hover:text-primary p-1.5">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c)} className="text-text-secondary hover:text-danger p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Name</label>
            <input
              required
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Description</label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Category"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
