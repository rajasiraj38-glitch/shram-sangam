import React from "react";
import { cn } from "../utils/cn";

// ─── Availability Toggle (Worker "Open for Work") ─────────────────────────────

export interface AvailabilityToggleProps {
  isAvailable: boolean;
  onChange: (value: boolean) => void;
  loading?: boolean;
  className?: string;
}

export function AvailabilityToggle({
  isAvailable,
  onChange,
  loading = false,
  className,
}: AvailabilityToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl p-4 border-2 transition-colors duration-300",
        isAvailable
          ? "border-teal-300 bg-teal-50"
          : "border-slate-200 bg-slate-50",
        className
      )}
    >
      <div className="flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            isAvailable ? "text-teal-800" : "text-slate-600"
          )}
        >
          {isAvailable ? "Available for Work" : "Not Available"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {isAvailable
            ? "You'll receive nearby job requests"
            : "You won't receive new job requests"}
        </p>
      </div>

      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={isAvailable}
        aria-label="Toggle work availability"
        disabled={loading}
        onClick={() => onChange(!isAvailable)}
        className={cn(
          "relative inline-flex h-7 w-12 flex-shrink-0 rounded-full",
          "border-2 border-transparent transition-colors duration-300 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isAvailable ? "bg-teal-500" : "bg-slate-300"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg",
            "transform transition-transform duration-300 ease-in-out",
            isAvailable ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
