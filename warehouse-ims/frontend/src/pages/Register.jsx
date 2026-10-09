import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PackageSearch } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

function getPasswordStrength(password = "") {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very weak", color: "bg-danger" },
    { label: "Weak", color: "bg-danger" },
    { label: "Fair", color: "bg-warning" },
    { label: "Good", color: "bg-warning" },
    { label: "Strong", color: "bg-success" },
  ];
  return { score, ...levels[score] };
}

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("staff");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password", "");
  const strength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await registerUser({
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        password: data.password,
        confirm_password: data.confirm_password,
        role,
      });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
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

        <h1 className="text-xl font-display font-semibold text-center mb-1">Create your account</h1>
        <p className="text-text-secondary text-sm text-center mb-6">
          Start managing your warehouse in minutes
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Full Name</label>
            <input
              className="input-field"
              placeholder="Jane Doe"
              {...register("full_name", { required: "Full name is required" })}
            />
            {errors.full_name && <p className="text-danger text-xs mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">I'm joining as</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "staff", label: "Staff" },
                { key: "manager", label: "Manager" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRole(option.key)}
                  className={`rounded-xl py-2.5 text-sm font-medium border transition ${
                    role === option.key
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-subtle text-text-secondary hover:bg-overlay"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-text-secondary text-xs mt-1.5">
              An administrator can change your role later if needed.
            </p>
          </div>

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
            <label className="text-sm text-text-secondary mb-1 block">Phone Number</label>
            <input
              type="tel"
              className="input-field"
              placeholder="+91 98765 43210"
              {...register("phone_number")}
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Minimum 8 characters" },
              })}
            />
            {password && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-overlay rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">{strength.label}</p>
              </div>
            )}
            {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-sm text-text-secondary mb-1 block">Confirm Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              {...register("confirm_password", {
                required: "Please confirm your password",
                validate: (value) => value === password || "Passwords do not match",
              })}
            />
            {errors.confirm_password && (
              <p className="text-danger text-xs mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
