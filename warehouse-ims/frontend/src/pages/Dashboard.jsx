import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import ManagerDashboard from "./ManagerDashboard.jsx";
import StaffDashboard from "./StaffDashboard.jsx";

/** Routes to a role-specific dashboard. Admin sees the full analytics
 * suite; Manager sees an operational subset; Staff sees a minimal,
 * task-focused view. Defaults to the Staff view (least privilege) if
 * the role is ever missing or unrecognized. */
export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "admin") return <AdminDashboard />;
  if (user?.role === "manager") return <ManagerDashboard />;
  return <StaffDashboard />;
}
