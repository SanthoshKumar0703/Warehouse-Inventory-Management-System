import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PackageSearch, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <PackageSearch className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl">WareFlow</span>
        </div>

        <h1 className="text-xl font-display font-semibold text-center mb-1">Welcome back</h1>
        <p className="text-text-secondary text-sm text-center mb-6">
          Sign in to manage your warehouses
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@company.com"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field pr-10"
                placeholder="••••••••"
                {...register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-text-secondary">
              <input type="checkbox" className="accent-primary" {...register("remember")} />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-primary hover:text-primary-hover">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:text-primary-hover">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
