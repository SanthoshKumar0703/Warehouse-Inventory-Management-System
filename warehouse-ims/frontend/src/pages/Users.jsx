import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Users as UsersIcon, KeyRound, Trash2, ShieldAlert } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import Modal from "../components/ui/Modal.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_STYLES = {
  admin: "bg-primary/10 text-primary",
  manager: "bg-warning/10 text-warning",
  staff: "bg-overlay text-text-secondary",
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    api.get("/users").then((res) => setUsers(res.data.users)).finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  if (currentUser?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center text-text-secondary">
          <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-40" />
          Only administrators can manage users.
        </div>
      </DashboardLayout>
    );
  }

  const handleRoleChange = async (u, role) => {
    try {
      await api.put(`/users/${u.id}`, { role });
      toast.success(`${u.full_name}'s role updated to ${role}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update role.");
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      toast.success(`${u.full_name} ${u.is_active ? "deactivated" : "activated"}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update status.");
    }
  };

  const openReset = (u) => {
    setResetFor(u);
    setNewPassword("");
    setResetModalOpen(true);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api.post(`/users/${resetFor.id}/reset-password`, { new_password: newPassword });
      toast.success(`Password reset for ${resetFor.full_name}.`);
      setResetModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reset password.");
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete "${u.full_name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete user.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Users</h1>
        <p className="text-text-secondary text-sm mt-1">Manage roles, access, and passwords</p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-overlay rounded-lg animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <UsersIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
            No users found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-subtle">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-subtle last:border-0 hover:bg-overlay">
                  <td className="px-5 py-3 font-medium">{u.full_name}{u.id === currentUser.id && <span className="text-text-secondary text-xs ml-1">(you)</span>}</td>
                  <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${ROLE_STYLES[u.role]}`}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs px-2 py-1 rounded-full ${u.is_active ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openReset(u)} title="Reset password" className="text-text-secondary hover:text-primary p-1.5">
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(u)} title="Delete user" className="text-text-secondary hover:text-danger p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={resetModalOpen} onClose={() => setResetModalOpen(false)} title={`Reset Password — ${resetFor?.full_name || ""}`}>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">New Password</label>
            <input required type="password" minLength={8} className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={resetting} className="btn-primary w-full disabled:opacity-60">
            {resetting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
