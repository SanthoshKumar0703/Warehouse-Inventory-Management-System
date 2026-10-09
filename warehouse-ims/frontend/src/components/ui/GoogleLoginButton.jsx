import React, { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../api/axios.js";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton({ onSuccess }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await api.post("/auth/google-login", { credential: response.credential });
          localStorage.setItem("access_token", res.data.access_token);
          localStorage.setItem("refresh_token", res.data.refresh_token);
          toast.success(res.data.message || "Signed in with Google.");
          onSuccess?.(res.data.user);
        } catch (err) {
          toast.error(err.response?.data?.message || "Google sign-in failed.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      width: 360,
      shape: "pill",
    });
  }, [onSuccess]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (backend) in your .env files to enable this"
        className="w-full flex items-center justify-center gap-2 border border-subtle rounded-xl py-2.5 text-sm text-text-secondary opacity-60 cursor-not-allowed"
      >
        Continue with Google
      </button>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
