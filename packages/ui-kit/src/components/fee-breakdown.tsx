// packages/ui-kit/src/components/fee-breakdown.tsx
// The core "cooperative differentiator" UI component.
// Shows the transparent 90/7/3 fee split on every booking.

import React from 'react';
import { Users, Shield, Heart, IndianRupee, Wrench, Server, HeartHandshake } from 'lucide-react';
import { formatINR, computeFees } from '../lib/utils';
import { cn } from '../lib/utils';
import type { FeeBreakdown as FeeBreakdownType } from '@shram-sangam/shared-types';

export interface FeeBreakdownProps {
  total: number;
  className?: string;
  compact?: boolean;
}

export function FeeBreakdown({ total, className, compact = false }: FeeBreakdownProps) {
  const fees = computeFees(total);

  const rows = [
    {
      icon: Users,
      label: 'Worker Direct Payout',
      sublabel: '90% — goes straight to the technician',
      amount: fees.worker,
      color: 'text-coop-green',
      bg: 'bg-green-50',
      bar: 'bg-coop-green',
      width: '90%',
    },
    {
      icon: Shield,
      label: 'Platform Operations',
      sublabel: '7% — server, support & admin',
      amount: fees.coopOps,
      color: 'text-coop-blue',
      bg: 'bg-blue-50',
      bar: 'bg-coop-blue',
      width: '7%',
    },
    {
      icon: Heart,
      label: 'Mutual Aid Fund',
      sublabel: '3% — worker emergency & tool reserve',
      amount: fees.mutualAid,
      color: 'text-coop-purple',
      bg: 'bg-purple-50',
      bar: 'bg-coop-purple',
      width: '3%',
    },
  ];

  if (compact) {
    return (
      <div className={cn('flex gap-2 flex-wrap', className)}>
        {rows.map((r) => (
          <div key={r.label} className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5', r.bg)}>
            <r.icon className={cn('h-3.5 w-3.5', r.color)} />
            <span className={cn('text-xs font-medium', r.color)}>{formatINR(r.amount)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-orange-100 bg-orange-50 p-4', className)}>
      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-3">
        Transparent Fee Breakdown — Unlike platforms that hide their 25–30% cut
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', r.bg)}>
                  <r.icon className={cn('h-3.5 w-3.5', r.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.label}</p>
                  {!compact && (
                    <p className="text-xs text-gray-500">{r.sublabel}</p>
                  )}
                </div>
              </div>
              <span className={cn('text-sm font-bold', r.color)}>{formatINR(r.amount)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={cn('h-full rounded-full', r.bar)}
                style={{ width: r.width }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between items-center border-t border-orange-200 pt-2">
        <span className="text-sm text-gray-600 font-medium">Total</span>
        <span className="text-base font-bold text-gray-900">{formatINR(total)}</span>
      </div>
    </div>
  );
}

export interface FeeBreakdownCardProps {
  breakdown: FeeBreakdownType;
  serviceName?: string;
  className?: string;
  compact?: boolean;
}

function FeeRowCard({
  icon: Icon,
  label,
  sublabel,
  amount,
  percent,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
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
        <Icon size={16} />
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
        <FeeRowCard
          icon={Wrench}
          label="Worker Direct Payout"
          sublabel={compact ? undefined : "Goes directly to the technician"}
          amount={worker_payout}
          percent={90}
          highlight
        />
        <FeeRowCard
          icon={Server}
          label="Platform Operations"
          sublabel={compact ? undefined : "Server, insurance & admin costs"}
          amount={coop_reserve_fee}
          percent={7}
        />
        <FeeRowCard
          icon={HeartHandshake}
          label="Community Mutual Aid"
          sublabel={compact ? undefined : "Emergency fund & tool grants"}
          amount={mutual_aid_contribution}
          percent={3}
        />
      </div>

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
