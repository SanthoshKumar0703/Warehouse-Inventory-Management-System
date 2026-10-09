import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownToLine, CreditCard, Plus } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function StockIn() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState("");
  const [paying, setPaying] = useState(false);
  const [addingFree, setAddingFree] = useState(false);

  useEffect(() => {
    api.get("/products", { params: { per_page: 100 } }).then((res) => setProducts(res.data.products));
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(productId));
  const total = (parseFloat(unitCost) || 0) * (parseInt(quantity, 10) || 0);

  const refreshProducts = () => {
    api.get("/products", { params: { per_page: 100 } }).then((r) => setProducts(r.data.products));
  };

  const handleProductChange = (id) => {
    setProductId(id);
    const prod = products.find((p) => String(p.id) === String(id));
    if (prod) setUnitCost(prod.unit_price);
  };

  const finalizeStockIn = async (paymentId) => {
    try {
      const res = await api.post("/inventory/stock-in", {
        product_id: parseInt(productId, 10),
        quantity: parseInt(quantity, 10),
        reason: reason || undefined,
        payment_id: paymentId || undefined,
      });
      toast.success(res.data.message);
      setQuantity("");
      setReason("");
      refreshProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong adding the stock.");
    }
  };

  const handlePayAndAdd = async (e) => {
    e.preventDefault();
    if (total <= 0) {
      toast.error("Enter a quantity and unit cost greater than zero to pay, or use \"Add without payment\" below.");
      return;
    }
    setPaying(true);
    try {
      const orderRes = await api.post("/payments/create-order", { amount: total });
      const { order_id, amount, currency, key_id } = orderRes.data;

      if (!window.Razorpay) {
        toast.error("Payment checkout failed to load. Check your internet connection and try again.");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency,
        order_id,
        name: "WareFlow",
        description: `Stock In — ${selectedProduct?.name || "Product"}`,
        theme: { color: "#B87333" },
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data.verified) {
              toast.success("Payment verified.");
              await finalizeStockIn(response.razorpay_payment_id);
            } else {
              toast.error("Payment could not be verified. Stock was not added.");
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled — stock was not added.", { icon: "ℹ️" });
            setPaying(false);
          },
        },
      });
      rzp.open();
    } catch (err) {
      setPaying(false);
      toast.error(err.response?.data?.message || "Could not start the payment.");
    }
  };

  const handleAddWithoutPayment = async (e) => {
    e.preventDefault();
    setAddingFree(true);
    await finalizeStockIn(null);
    setAddingFree(false);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Stock In</h1>
        <p className="text-text-secondary text-sm mt-1">Record incoming stock — pay the supplier via Razorpay, or add stock directly for adjustments and returns</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={handlePayAndAdd} className="glass-card p-6 space-y-4 md:col-span-2">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Product</label>
            <select required className="input-field" value={productId} onChange={(e) => handleProductChange(e.target.value)}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Quantity</label>
              <input required type="number" min="1" className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Unit Cost (₹)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Reason / Reference</label>
            <input className="input-field" placeholder="e.g. Restock, returned item" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-subtle">
            <span className="text-text-secondary text-sm">Total Payment</span>
            <span className="font-display font-semibold text-lg">₹{total.toFixed(2)}</span>
          </div>

          <button type="submit" disabled={paying || !productId} className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" /> {paying ? "Processing payment..." : `Pay ₹${total.toFixed(2)} & Add Stock`}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-subtle" />
            <span className="text-xs text-text-secondary">OR</span>
            <div className="h-px flex-1 bg-subtle" />
          </div>

          <button
            type="button"
            onClick={handleAddWithoutPayment}
            disabled={addingFree || !productId || !quantity}
            className="w-full flex items-center justify-center gap-2 border border-subtle rounded-xl py-2.5 text-sm text-text-secondary hover:bg-overlay transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {addingFree ? "Adding..." : "Add without payment (adjustment / return)"}
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
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">Select a product to see its current stock.</p>
          )}
          {user?.role && (
            <p className="text-text-secondary text-xs mt-4 pt-4 border-t border-subtle">
              Razorpay checkout requires <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to be set in the backend <code>.env</code>. Until then, "Pay & Add Stock" will show a setup message — use "Add without payment" instead.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
