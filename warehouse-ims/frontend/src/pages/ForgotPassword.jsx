import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { PackageSearch, ArrowLeft } from "lucide-react";
import api from "../api/axios.js";

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3 };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password/request-otp", { email });
      toast.success(res.data.message);
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password/verify-otp", { email, otp });
      toast.success(res.data.message);
      setStep(STEPS.RESET);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password/reset", { email, otp, new_password: newPassword });
      toast.success(res.data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[STEPS.EMAIL, STEPS.OTP, STEPS.RESET].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-10 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-overlay"
              }`}
            />
          ))}
        </div>

        {step === STEPS.EMAIL && (
          <form onSubmit={requestOtp} className="space-y-4">
            <h1 className="text-xl font-display font-semibold text-center mb-1">Forgot password?</h1>
            <p className="text-text-secondary text-sm text-center mb-4">
              Enter your email and we'll send you a reset code.
            </p>
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === STEPS.OTP && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <h1 className="text-xl font-display font-semibold text-center mb-1">Enter the code</h1>
            <p className="text-text-secondary text-sm text-center mb-4">
              We sent a 6-digit code to <span className="text-text">{email}</span>. It expires in 10 minutes.
            </p>
            <input
              required
              maxLength={6}
              className="input-field text-center tracking-[0.5em] text-lg"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === STEPS.RESET && (
          <form onSubmit={resetPassword} className="space-y-4">
            <h1 className="text-xl font-display font-semibold text-center mb-1">Set a new password</h1>
            <p className="text-text-secondary text-sm text-center mb-4">
              Choose a strong password for your account.
            </p>
            <input
              type="password"
              required
              className="input-field"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              required
              className="input-field"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-text">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
