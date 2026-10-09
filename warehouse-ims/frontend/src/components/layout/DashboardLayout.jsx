import React from "react";
import Sidebar from "./Sidebar.jsx";
import NotificationBell from "../ui/NotificationBell.jsx";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-background text-text">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">
        <div className="flex justify-end mb-2">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
