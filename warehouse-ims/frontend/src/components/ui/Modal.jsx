import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className={`glass-card w-full ${maxWidth} max-h-[85vh] overflow-y-auto p-6`}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-lg">{title}</h2>
              <button onClick={onClose} className="text-text-secondary hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
