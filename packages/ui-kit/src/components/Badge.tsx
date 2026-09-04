import React from "react";
import { cn } from "../utils/cn";
import type { BookingStatus } from "@shram-sangam/shared-types";

// ─── Generic Badge ────────────────────────────────────────────────────────────

const colorMap = {
  gray:    "bg-slate-100 text-slate-700 border-slate-200",
  orange:  "bg-orange-100 text-orange-700 border-orange-200",
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  violet:  "bg-violet-100 text-violet-700 border-violet-200",
  cyan:    "bg-cyan-100 text-cyan-700 border-cyan-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  red:     "bg-red-100 text-red-700 border-red-200",
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  teal:    "bg-teal-100 text-teal-700 border-teal-200",
  lime:    "bg-lime-100 text-lime-700 border-lime-200",
} as const;

export type BadgeColor = keyof typeof colorMap;

export interface BadgeProps {
  label: string;
  color?: BadgeColor;
  dot?: boolean;
  className?: string;
}

export function Badge({ label, color = "gray", dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5",
        "text-xs font-medium rounded-full border",
        colorMap[color],
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-slate-500":    color === "gray",
            "bg-orange-500":   color === "orange",
            "bg-blue-500":     color === "blue",
            "bg-violet-500":   color === "violet",
            "bg-cyan-500":     color === "cyan",
            "bg-emerald-500":  color === "emerald",
            "bg-red-500":      color === "red",
            "bg-amber-500":    color === "amber",
            "bg-teal-500":     color === "teal",
            "bg-lime-500":     color === "lime",
          })}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

// ─── Booking Status Badge ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: BadgeColor }> = {
  requested:   { label: "Requested",    color: "amber"   },
  accepted:    { label: "Accepted",     color: "blue"    },
  arrived:     { label: "Worker Arrived", color: "violet" },
  in_progress: { label: "In Progress",  color: "cyan"    },
  completed:   { label: "Completed",    color: "emerald" },
  cancelled:   { label: "Cancelled",    color: "gray"    },
  disputed:    { label: "Disputed",     color: "red"     },
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      label={config.label}
      color={config.color}
      dot
      className={className}
    />
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

export function RoleBadge({ role }: { role: "customer" | "worker_member" | "admin_coop" }) {
  const config = {
    customer:      { label: "Customer",     color: "blue"   as BadgeColor },
    worker_member: { label: "Co-op Member", color: "teal"   as BadgeColor },
    admin_coop:    { label: "Admin",        color: "orange" as BadgeColor },
  };
  const c = config[role];
  return <Badge label={c.label} color={c.color} />;
}

// ─── Verified Badge ───────────────────────────────────────────────────────────

export function VerifiedBadge() {
  return (
    <Badge
      label="Verified Member"
      color="emerald"
      dot
      className="text-[10px]"
    />
  );
}
