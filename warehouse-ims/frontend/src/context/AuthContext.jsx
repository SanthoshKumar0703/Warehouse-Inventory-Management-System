import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    setUser(res.data.user);
    toast.success(res.data.message || "Welcome back!");
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    setUser(res.data.user);
    toast.success(res.data.message || "Account created successfully.");
    return res.data.user;
  };

  const setUserFromGoogle = (googleUser) => {
    setUser(googleUser);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    toast.success("You have been logged out.");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUserFromGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
