import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext.jsx";

function timeAgo(isoOrEvent) {
  const diffMs = Date.now() - new Date(isoOrEvent).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-overlay hover:text-primary transition"
        title="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto glass-card p-2 z-50 shadow-soft"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-display font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-text-secondary hover:text-primary flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="text-text-secondary text-sm px-2 py-6 text-center">
                Nothing yet — real-time updates will appear here.
              </p>
            ) : (
              <ul className="space-y-1">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-overlay">
                    <span className="text-base leading-none mt-0.5">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{n.message}</p>
                      <p className="text-text-secondary text-xs">{timeAgo(n.receivedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
