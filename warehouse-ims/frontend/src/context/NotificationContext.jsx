import React, { createContext, useCallback, useContext, useState } from "react";
import { useRealtimeEvent } from "../hooks/useRealtimeEvent.js";

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 30;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleEvent = useCallback((event) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
        receivedAt: new Date().toISOString(),
        ...event,
      },
      ...prev,
    ].slice(0, MAX_NOTIFICATIONS));
    setUnreadCount((c) => c + 1);
  }, []);

  useRealtimeEvent(handleEvent);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
