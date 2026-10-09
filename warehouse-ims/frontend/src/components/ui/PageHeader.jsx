import React from "react";
import { Search, Plus } from "lucide-react";

export default function PageHeader({ title, subtitle, search, onSearchChange, actionLabel, onAction, showAction = true }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-display font-bold">{title}</h1>
        {subtitle && <p className="text-text-secondary text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="input-field pl-9 w-48 md:w-64"
            />
          </div>
        )}
        {showAction && (
          <button onClick={onAction} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
