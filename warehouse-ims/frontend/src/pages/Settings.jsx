import React, { useState } from "react";
import toast from "react-hot-toast";
import { User, Lock, Bell, Palette, Chrome, Check } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "password", label: "Change Password", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "theme", label: "Theme", icon: Palette },
  { key: "google", label: "Google Account", icon: Chrome },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState("profile");

  // Profile
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications (client-side preference only — no backend model yet)
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyPurchaseOrders, setNotifyPurchaseOrders] = useState(true);
  const [notifyUserActivity, setNotifyUserActivity] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/auth/profile", { full_name: fullName, phone_number: phone });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <nav className="glass-card p-2 h-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition ${
                tab === key ? "bg-primary/15 text-primary" : "text-text-secondary hover:bg-overlay hover:text-text"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>

        <div className="glass-card p-6 md:col-span-3">
          {tab === "profile" && (
            <form onSubmit={saveProfile} className="space-y-4 max-w-md">
              <h2 className="font-display font-semibold mb-2">Profile</h2>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Full Name</label>
                <input required className="input-field" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Email</label>
                <input disabled className="input-field opacity-60" value={user?.email || ""} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Phone Number</label>
                <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Role</label>
                <input disabled className="input-field opacity-60 capitalize" value={user?.role || ""} />
              </div>
              <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-60">
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {tab === "password" && (
            <form onSubmit={savePassword} className="space-y-4 max-w-md">
              <h2 className="font-display font-semibold mb-2">Change Password</h2>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Current Password</label>
                <input required type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">New Password</label>
                <input required type="password" minLength={8} className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Confirm New Password</label>
                <input required type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" disabled={savingPassword} className="btn-primary disabled:opacity-60">
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {tab === "notifications" && (
            <div className="space-y-5 max-w-md">
              <h2 className="font-display font-semibold mb-2">Notification Settings</h2>
              <p className="text-text-secondary text-xs -mt-2 mb-4">
                These preferences control which real-time toasts you see in this browser session.
              </p>
              {[
                { label: "Low stock & out-of-stock alerts", state: notifyLowStock, set: setNotifyLowStock },
                { label: "Purchase order updates", state: notifyPurchaseOrders, set: setNotifyPurchaseOrders },
                { label: "User activity (registrations, logins)", state: notifyUserActivity, set: setNotifyUserActivity },
              ].map(({ label, state, set }) => (
                <label key={label} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">{label}</span>
                  <button
                    type="button"
                    onClick={() => set(!state)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${state ? "bg-primary" : "bg-overlay"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${state ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </label>
              ))}
            </div>
          )}

          {tab === "theme" && (
            <div className="max-w-md">
              <h2 className="font-display font-semibold mb-4">Theme</h2>
              <p className="text-text-secondary text-xs mb-4">
                WareFlow's Copper & Anthracite identity, in either a dark or light appearance.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`text-left rounded-2xl p-4 border-2 transition ${
                    theme === "dark" ? "border-primary" : "border-subtle"
                  }`}
                >
                  <div className="rounded-xl overflow-hidden border border-subtle mb-3">
                    <div className="h-16 flex" style={{ background: "#1A1A1A" }}>
                      <div className="w-1/3 h-full" style={{ background: "#202020" }} />
                      <div className="flex-1 p-2">
                        <div className="w-1/2 h-2 rounded-full mb-1.5" style={{ background: "#B87333" }} />
                        <div className="w-3/4 h-2 rounded-full" style={{ background: "#333333" }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dark</span>
                    {theme === "dark" && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`text-left rounded-2xl p-4 border-2 transition ${
                    theme === "light" ? "border-primary" : "border-subtle"
                  }`}
                >
                  <div className="rounded-xl overflow-hidden border border-subtle mb-3">
                    <div className="h-16 flex" style={{ background: "#F6F3EE" }}>
                      <div className="w-1/3 h-full" style={{ background: "#FFFFFF" }} />
                      <div className="flex-1 p-2">
                        <div className="w-1/2 h-2 rounded-full mb-1.5" style={{ background: "#B87333" }} />
                        <div className="w-3/4 h-2 rounded-full" style={{ background: "#E5E0D8" }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Light</span>
                    {theme === "light" && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              </div>
            </div>
          )}

          {tab === "google" && (
            <div className="max-w-md">
              <h2 className="font-display font-semibold mb-4">Google Account</h2>
              {user?.avatar_url ? (
                <div className="flex items-center gap-3">
                  <img src={user.avatar_url} alt="Google avatar" className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">Connected</p>
                    <p className="text-text-secondary text-xs">{user.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary text-sm">
                  No Google account linked. Sign out and use "Continue with Google" on the login page to link one.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
