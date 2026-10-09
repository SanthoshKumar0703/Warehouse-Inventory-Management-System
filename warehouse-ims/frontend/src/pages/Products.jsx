import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2, Package, QrCode, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Modal from "../components/ui/Modal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  name: "", sku: "", description: "", category_id: "", warehouse_id: "",
  supplier_id: "", unit_price: "", quantity: "", reorder_level: "10", status: "active",
};

const STATUS_STYLES = {
  in_stock: "bg-success/10 text-success",
  low_stock: "bg-warning/10 text-warning",
  out_of_stock: "bg-danger/10 text-danger",
};

export default function Products() {
  const { user } = useAuth();
  const canManage = ["admin", "manager"].includes(user?.role);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [codesOpen, setCodesOpen] = useState(false);
  const [codesFor, setCodesFor] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.categories));
    api.get("/warehouses").then((res) => setWarehouses(res.data.warehouses));
    api.get("/suppliers").then((res) => setSuppliers(res.data.suppliers));
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    api
      .get("/products", {
        params: {
          search,
          category_id: categoryFilter || undefined,
          warehouse_id: warehouseFilter || undefined,
          page,
          per_page: 9,
        },
      })
      .then((res) => {
        setProducts(res.data.products);
        setTotalPages(res.data.total_pages || 1);
      })
      .finally(() => setLoading(false));
  }, [search, categoryFilter, warehouseFilter, page]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 250);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  useEffect(() => setPage(1), [search, categoryFilter, warehouseFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description || "",
      category_id: p.category_id || "", warehouse_id: p.warehouse_id || "",
      supplier_id: p.supplier_id || "", unit_price: p.unit_price, quantity: p.quantity,
      reorder_level: p.reorder_level, status: p.status,
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      category_id: form.category_id || null,
      warehouse_id: form.warehouse_id || null,
      supplier_id: form.supplier_id || null,
      unit_price: parseFloat(form.unit_price) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      reorder_level: parseInt(form.reorder_level, 10) || 0,
    };
    try {
      let productId = editing?.id;
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success("Product updated successfully.");
      } else {
        const res = await api.post("/products", payload);
        productId = res.data.product.id;
        toast.success("Product added successfully.");
      }
      if (imageFile && productId) {
        const fd = new FormData();
        fd.append("image", imageFile);
        await api.post(`/products/${productId}/image`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Product deleted successfully.");
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete product.");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Products"
        subtitle="Manage your full product catalog"
        search={search}
        onSearchChange={setSearch}
        actionLabel="Add Product"
        onAction={openCreate}
        showAction={canManage}
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="input-field w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input-field w-auto" value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
          <option value="">All Warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-44 animate-pulse bg-overlay" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-secondary">
          <Package className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No products found.
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-overlay overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[p.stock_status]}`}>
                    {p.stock_status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="font-display font-semibold mb-0.5 truncate">{p.name}</h3>
                <p className="text-xs text-text-secondary mb-3">{p.sku}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-text-secondary">Qty: <span className="text-text">{p.quantity}</span></span>
                  <span className="font-medium">${Number(p.unit_price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCodesFor(p); setCodesOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-subtle rounded-lg py-1.5 hover:bg-overlay transition"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Codes
                  </button>
                  {canManage && (
                    <>
                      <button onClick={() => openEdit(p)} className="text-text-secondary hover:text-primary p-1.5">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="text-text-secondary hover:text-danger p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-subtle disabled:opacity-40 hover:bg-overlay"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-subtle disabled:opacity-40 hover:bg-overlay"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product" : "Add Product"} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Name</label>
              <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">SKU <span className="text-text-secondary/60">(auto if blank)</span></label>
              <input className="input-field" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Description</label>
            <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Category</label>
              <select className="input-field" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Warehouse</label>
              <select className="input-field" value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
                <option value="">None</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Supplier</label>
              <select className="input-field" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Unit Price</label>
              <input required type="number" min="0" step="0.01" className="input-field" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Quantity</label>
              <input required type="number" min="0" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Reorder Level</label>
              <input type="number" min="0" className="input-field" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Product Image</label>
            <label className="flex items-center gap-2 border border-dashed border-subtle rounded-xl px-4 py-3 text-sm text-text-secondary cursor-pointer hover:bg-overlay transition">
              <ImagePlus className="w-4 h-4" />
              {imageFile ? imageFile.name : "Choose an image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? "Saving..." : editing ? "Save Changes" : "Add Product"}
          </button>
        </form>
      </Modal>

      <Modal open={codesOpen} onClose={() => setCodesOpen(false)} title={`Codes — ${codesFor?.name || ""}`}>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-2">QR Code</p>
            {codesFor?.qr_code_url ? (
              <img src={codesFor.qr_code_url} alt="QR code" className="w-full rounded-lg bg-white p-2" />
            ) : (
              <p className="text-xs text-text-secondary">Not generated</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-2">Barcode</p>
            {codesFor?.barcode_url ? (
              <img src={codesFor.barcode_url} alt="Barcode" className="w-full rounded-lg bg-white p-2" />
            ) : (
              <p className="text-xs text-text-secondary">Not generated</p>
            )}
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
