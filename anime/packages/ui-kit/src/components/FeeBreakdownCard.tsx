import React from "react";
import { cn } from "../utils/cn";
import { IndianRupee, Wrench, Server, HeartHandshake } from "lucide-react";
import type { FeeBreakdown } from "@shram-sangam/shared-types";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FeeBreakdownCardProps {
  breakdown: FeeBreakdown;
  serviceName?: string;
  className?: string;
  compact?: boolean;
}

// ─── Row helper ──────────────────────────────────────────────────────────────

function FeeRow({
  icon,
  label,
  sublabel,
  amount,
  percent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  amount: number;
  percent: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        highlight
          ? "bg-teal-50 border border-teal-200"
          : "bg-slate-50 border border-slate-100"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
          highlight ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-600"
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            highlight ? "text-teal-800" : "text-slate-700"
          )}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-slate-500 truncate">{sublabel}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            "text-sm font-semibold",
            highlight ? "text-teal-700" : "text-slate-700"
          )}
        >
          ₹{amount.toFixed(2)}
        </p>
        <p className="text-xs text-slate-400">{percent}%</p>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FeeBreakdownCard({
  breakdown,
  serviceName,
  className,
  compact = false,
}: FeeBreakdownCardProps) {
  const { total_amount, worker_payout, coop_reserve_fee, mutual_aid_contribution } =
    breakdown;

  return (
    <div
      className={cn(
        "rounded-2xl border border-orange-100 bg-white shadow-card overflow-hidden",
        className
      )}
      aria-label="Transparent fee breakdown"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-orange-800">
              Transparent Pricing
            </h3>
            {serviceName && (
              <p className="text-xs text-orange-600 mt-0.5">{serviceName}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-orange-700">
            <IndianRupee size={16} aria-hidden="true" />
            <span className="text-lg font-bold">{total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Visual bar */}
      <div
        className="flex h-2"
        role="img"
        aria-label="90% worker, 7% operations, 3% mutual aid"
      >
        <div className="bg-teal-500" style={{ width: "90%" }} />
        <div className="bg-slate-300" style={{ width: "7%" }} />
        <div className="bg-lime-500" style={{ width: "3%" }} />
      </div>

      {/* Fee rows */}
      <div className={cn("flex flex-col gap-2 p-4")}>
        <FeeRow
          icon={<Wrench size={16} />}
          label="Worker Direct Payout"
          sublabel={compact ? undefined : "Goes directly to the technician"}
          amount={worker_payout}
          percent={90}
          highlight
        />
        <FeeRow
          icon={<Server size={16} />}
          label="Platform Operations"
          sublabel={compact ? undefined : "Server, insurance & admin costs"}
          amount={coop_reserve_fee}
          percent={7}
        />
        <FeeRow
          icon={<HeartHandshake size={16} />}
          label="Community Mutual Aid"
          sublabel={compact ? undefined : "Emergency fund & tool grants"}
          amount={mutual_aid_contribution}
          percent={3}
        />
      </div>

      {/* Footer callout */}
      {!compact && (
        <div className="px-4 pb-4">
          <p className="text-xs text-center text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            Unlike commercial apps that take <strong>25–30%</strong>, Shram
            Sangam keeps <strong>only 10%</strong> for operations + community
            fund.
          </p>
        </div>
      )}
    </div>
  );
}
