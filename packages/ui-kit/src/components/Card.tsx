import React from "react";
import { cn } from "../utils/cn";

// ─── Base Card ────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({ className, noPadding = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-100 bg-white shadow-card",
        !noPadding && "p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Card Header ─────────────────────────────────────────────────────────────

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Gig Request Card ─────────────────────────────────────────────────────────

export interface GigCardProps {
  serviceName: string;
  category: string;
  address: string;
  distanceKm?: number;
  workerPayout: number;
  totalAmount: number;
  status?: string;
  timeAgo?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  className?: string;
}

export function GigCard({
  serviceName,
  category,
  address,
  distanceKm,
  workerPayout,
  totalAmount,
  status,
  timeAgo,
  onAccept,
  onDecline,
  className,
}: GigCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-orange-200 bg-white shadow-card-hover p-4 space-y-3",
        className
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{serviceName}</h3>
          <p className="text-xs text-slate-500">{category}</p>
        </div>
        {timeAgo && (
          <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo}</span>
        )}
      </div>

      {/* Location */}
      <p className="text-sm text-slate-600 line-clamp-2">{address}</p>

      {/* Metrics row */}
      <div className="flex items-center gap-4 text-sm">
        {distanceKm !== undefined && (
          <span className="text-slate-500">
            📍 <strong>{distanceKm.toFixed(1)} km</strong>
          </span>
        )}
        <span className="text-teal-700 font-semibold">
          You earn: ₹{workerPayout.toFixed(0)}
        </span>
        <span className="text-slate-400 text-xs">
          (of ₹{totalAmount.toFixed(0)})
        </span>
      </div>

      {/* Action buttons */}
      {(onAccept || onDecline) && (
        <div className="flex gap-2 pt-1">
          {onAccept && (
            <button
              onClick={onAccept}
              className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label={`Accept ${serviceName} job`}
            >
              Accept
            </button>
          )}
          {onDecline && (
            <button
              onClick={onDecline}
              className="flex-1 h-10 border-2 border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label={`Decline ${serviceName} job`}
            >
              Decline
            </button>
          )}
        </div>
      )}
    </div>
  );
}
