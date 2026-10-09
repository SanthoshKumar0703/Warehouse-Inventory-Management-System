import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Plus, Trash2, Check, X, PackageCheck, Ban } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Modal from "../components/ui/Modal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_STYLES = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-primary/10 text-primary",
  received: "bg-success/10 text-success",
  rejected: "bg-danger/10 text-danger",
  cancelled: "bg-overlay text-text-secondary",
};

export default function PurchaseOrders() {
  const { user } = useAuth();
  const canManage = ["admin", "manager"].includes(user?.role);

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1, unit_price: "" }]);
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    api
      .get("/purchase-orders", { params: { status: statusFilter || undefined } })
      .then((res) => setOrders(res.data.purchase_orders))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    api.get("/suppliers").then((res) => setSuppliers(res.data.suppliers));
    api.get("/warehouses").then((res) => setWarehouses(res.data.warehouses));
    api.get("/products", { params: { per_page: 100 } }).then((res) => setProducts(res.data.products));
  }, []);

  const openCreate = () => {
    setSupplierId("");
    setWarehouseId("");
    setItems([{ product_id: "", quantity: 1, unit_price: "" }]);
    setModalOpen(true);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "product_id") {
        const prod = products.find((p) => String(p.id) === String(value));
        if (prod) next[idx].unit_price = prod.unit_price;
      }
      return next;
    });
  };

  const addItemRow = () => setItems((prev) => [...prev, { product_id: "", quantity: 1, unit_price: "" }]);
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const total = items.reduce((sum, it) => sum + (parseFloat(it.unit_price) || 0) * (parseInt(it.quantity, 10) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/purchase-orders", {
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        items: items
          .filter((it) => it.product_id)
          .map((it) => ({
            product_id: parseInt(it.product_id, 10),
            quantity: parseInt(it.quantity, 10) || 0,
            unit_price: parseFloat(it.unit_price) || 0,
          })),
      });
      toast.success("Purchase order created successfully.");
      setModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (order, action, successMsg) => {
    try {
      await api.post(`/purchase-orders/${order.id}/${action}`);
      toast.success(successMsg);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Purchase Orders</h1>
          <p className="text-text-secondary text-sm mt-1">Create, approve, and receive stock from suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {["pending", "approved", "received", "rejected", "cancelled"].map((s) => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {canManage && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Order
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-overlay rounded-lg animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No purchase orders yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-subtle">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Supplier</th>
                <th className="px-5 py-3 font-medium">Warehouse</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                {canManage && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-subtle last:border-0 hover:bg-overlay">
                  <td className="px-5 py-3 font-medium">{o.order_number}</td>
                  <td className="px-5 py-3 text-text-secondary">{o.supplier}</td>
                  <td className="px-5 py-3 text-text-secondary">{o.warehouse}</td>
                  <td className="px-5 py-3">${o.total_amount.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {o.status === "pending" && (
                        <>
                          <button title="Approve" onClick={() => runAction(o, "approve", "Purchase order approved.")} className="text-text-secondary hover:text-success p-1.5">
                            <Check className="w-4 h-4" />
                          </button>
                          <button title="Reject" onClick={() => runAction(o, "reject", "Purchase order rejected.")} className="text-text-secondary hover:text-danger p-1.5">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {o.status === "approved" && (
                        <button title="Receive Stock" onClick={() => runAction(o, "receive", "Stock received and inventory updated.")} className="text-text-secondary hover:text-success p-1.5">
                          <PackageCheck className="w-4 h-4" />
                        </button>
                      )}
                      {["pending", "approved"].includes(o.status) && (
                        <button title="Cancel" onClick={() => runAction(o, "cancel", "Purchase order cancelled.")} className="text-text-secondary hover:text-danger p-1.5">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase Order" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Supplier</label>
              <select required className="input-field" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Warehouse</label>
              <select required className="input-field" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-2 block">Line Items</label>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    required
                    className="input-field col-span-6"
                    value={it.product_id}
                    onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Qty"
                    className="input-field col-span-2"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    className="input-field col-span-3"
                    value={it.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="col-span-1 text-text-secondary hover:text-danger disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItemRow} className="mt-3 text-sm text-primary hover:text-primary-hover flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add line item
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-subtle">
            <span className="text-text-secondary text-sm">Total</span>
            <span className="font-display font-semibold text-lg">${total.toFixed(2)}</span>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
            {saving ? "Creating..." : "Create Purchase Order"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
