import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { publish } from "../lib/realtimeBus.js";

const SocketContext = createContext(null);

const TONE_STYLES = {
  success: { border: "rgba(34,197,94,0.4)" },
  warning: { border: "rgba(245,158,11,0.4)" },
  danger: { border: "rgba(239,68,68,0.4)" },
  info: { border: "rgba(184,115,51,0.3)" },
};

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("inventory_event", (event) => {
      const style = TONE_STYLES[event.tone] || TONE_STYLES.info;
      toast(`${event.icon} ${event.message}`, {
        style: { border: `1px solid ${style.border}` },
      });
      publish(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
