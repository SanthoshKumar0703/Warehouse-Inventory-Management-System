import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, accent = "primary", delay = 0 }) {
  const accentClasses = {
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 flex items-center gap-4 hover:shadow-glow transition-shadow duration-300"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accentClasses[accent]}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div>
        <p className="text-2xl font-display font-bold leading-tight">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </motion.div>
  );
}
