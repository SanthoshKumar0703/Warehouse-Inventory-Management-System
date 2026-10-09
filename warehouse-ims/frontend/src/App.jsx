import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Categories from "./pages/Categories.jsx";
import Warehouses from "./pages/Warehouses.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Inventory from "./pages/Inventory.jsx";
import StockIn from "./pages/StockIn.jsx";
import StockOut from "./pages/StockOut.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute>
            <Warehouses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suppliers"
        element={
          <ProtectedRoute>
            <Suppliers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase-orders"
        element={
          <ProtectedRoute>
            <PurchaseOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-in"
        element={
          <ProtectedRoute>
            <StockIn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-out"
        element={
          <ProtectedRoute>
            <StockOut />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
