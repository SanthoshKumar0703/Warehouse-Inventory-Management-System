import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Warehouse,
  Boxes,
  Truck,
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileBarChart,
  Users,
  Settings,
  LogOut,
  PackageSearch,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { to: "/stock-in", label: "Stock In", icon: ArrowDownToLine },
  { to: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/users", label: "Users", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-sidebar border-r border-subtle">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <PackageSearch className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">WareFlow</span>
        </div>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-overlay hover:text-primary transition"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-text-secondary hover:bg-overlay hover:text-text"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-subtle">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-overlay hover:text-text transition"
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-text text-sm truncate">{user?.full_name || "User"}</span>
            <span className="text-xs text-text-secondary capitalize">{user?.role}</span>
          </div>
        </NavLink>
        <button
          onClick={logout}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-danger/90 hover:bg-danger/10 transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
