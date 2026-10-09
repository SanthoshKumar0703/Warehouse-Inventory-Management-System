import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <App />
                <Toaster
                  position="bottom-left"
                  toastOptions={{
                    duration: 5000,
                    style: {
                      background: "rgb(var(--color-card))",
                      color: "rgb(var(--color-text))",
                      border: "1px solid rgba(184,115,51,0.3)",
                      borderRadius: "14px",
                    },
                  }}
                />
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
