import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowUpFromLine } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import api from "../api/axios.js";

export default function StockOut() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/products", { params: { per_page: 100 } }).then((res) => setProducts(res.data.products));
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(productId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/inventory/stock-out", {
        product_id: parseInt(productId, 10),
        quantity: parseInt(quantity, 10),
        reason: reason || undefined,
      });
      toast.success(res.data.message);
      setQuantity("");
      setReason("");
      api.get("/products", { params: { per_page: 100 } }).then((r) => setProducts(r.data.products));
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Stock Out</h1>
        <p className="text-text-secondary text-sm mt-1">Record outgoing stock for a product</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4 md:col-span-2">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Product</label>
            <select required className="input-field" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.sku} ({p.quantity} in stock)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Quantity</label>
            <input
              required
              type="number"
              min="1"
              max={selectedProduct?.quantity}
              className="input-field"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Reason / Reference</label>
            <input className="input-field" placeholder="e.g. Sale, damaged, transferred" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <button type="submit" disabled={submitting || !productId} className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2">
            <ArrowUpFromLine className="w-4 h-4" /> {submitting ? "Removing..." : "Remove Stock"}
          </button>
        </form>

        <div className="glass-card p-6">
          <h3 className="font-display font-semibold mb-3 text-sm">Current Stock</h3>
          {selectedProduct ? (
            <div className="space-y-2 text-sm">
              <p className="text-text-secondary">Product</p>
              <p className="font-medium">{selectedProduct.name}</p>
              <div className="pt-3 border-t border-subtle">
                <p className="text-text-secondary text-xs">Quantity on hand</p>
                <p className="text-2xl font-display font-bold text-primary">{selectedProduct.quantity}</p>
                {selectedProduct.stock_status !== "in_stock" && (
                  <p className="text-xs text-warning mt-1 capitalize">{selectedProduct.stock_status.replace("_", " ")}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">Select a product to see its current stock.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
