import React from "react";
import { cn } from "../utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StatBoxProps {
  label: string;
  value: string | number;
  subvalue?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "orange" | "teal" | "lime" | "blue" | "red" | "slate";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const colorConfig = {
  orange: {
    bg:       "bg-orange-50",
    border:   "border-orange-100",
    iconBg:   "bg-orange-100",
    iconText: "text-orange-600",
    value:    "text-orange-700",
    label:    "text-orange-600",
  },
  teal: {
    bg:       "bg-teal-50",
    border:   "border-teal-100",
    iconBg:   "bg-teal-100",
    iconText: "text-teal-600",
    value:    "text-teal-700",
    label:    "text-teal-600",
  },
  lime: {
    bg:       "bg-lime-50",
    border:   "border-lime-100",
    iconBg:   "bg-lime-100",
    iconText: "text-lime-600",
    value:    "text-lime-700",
    label:    "text-lime-600",
  },
  blue: {
    bg:       "bg-blue-50",
    border:   "border-blue-100",
    iconBg:   "bg-blue-100",
    iconText: "text-blue-600",
    value:    "text-blue-700",
    label:    "text-blue-600",
  },
  red: {
    bg:       "bg-red-50",
    border:   "border-red-100",
    iconBg:   "bg-red-100",
    iconText: "text-red-600",
    value:    "text-red-700",
    label:    "text-red-600",
  },
  slate: {
    bg:       "bg-slate-50",
    border:   "border-slate-100",
    iconBg:   "bg-slate-100",
    iconText: "text-slate-600",
    value:    "text-slate-700",
    label:    "text-slate-600",
  },
} as const;

const sizeConfig = {
  sm: { value: "text-lg font-bold",  label: "text-xs", icon: 16, pad: "p-3 gap-2" },
  md: { value: "text-2xl font-bold", label: "text-sm", icon: 20, pad: "p-4 gap-3" },
  lg: { value: "text-3xl font-bold", label: "text-sm", icon: 24, pad: "p-5 gap-3" },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function StatBox({
  label,
  value,
  subvalue,
  icon,
  trend,
  trendLabel,
  color = "slate",
  className,
  size = "md",
}: StatBoxProps) {
  const c = colorConfig[color];
  const s = sizeConfig[size];

  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    trend === "up"
      ? "text-emerald-600"
      : trend === "down"
      ? "text-red-500"
      : "text-slate-400";

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-card",
        c.bg,
        c.border,
        className
      )}
      role="region"
      aria-label={label}
    >
      <div className={cn("flex items-start", s.pad)}>
        {icon && (
          <div
            className={cn(
              "flex-shrink-0 rounded-xl flex items-center justify-center",
              c.iconBg,
              c.iconText,
              size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-12 h-12"
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium truncate", c.label, s.label)}>{label}</p>
          <p className={cn(c.value, s.value, "mt-0.5 tabular-nums")}>
            {value}
          </p>
          {subvalue && (
            <p className="text-xs text-slate-500 mt-0.5">{subvalue}</p>
          )}
          {trendLabel && (
            <div className={cn("flex items-center gap-1 mt-1", trendColor)}>
              <TrendIcon size={12} aria-hidden="true" />
              <span className="text-xs font-medium">{trendLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cooperative Pool Card (specialized StatBox) ──────────────────────────────

export function CoopPoolCard({
  title,
  balance,
  subtitle,
  className,
}: {
  title: string;
  balance: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-lime-200 bg-gradient-to-br from-lime-50 to-teal-50 p-4 shadow-card",
        className
      )}
    >
      <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-3xl font-bold text-teal-800 mt-1 tabular-nums">
        ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </p>
      {subtitle && (
        <p className="text-xs text-teal-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
}
