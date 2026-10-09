import React from "react";
import { Link } from "react-router-dom";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-5">
        <PackageX className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-5xl font-display font-extrabold mb-2">404</h1>
      <p className="text-text-secondary max-w-sm mb-8">
        This page went missing from the warehouse. It might have been moved or never existed.
      </p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  );
}
