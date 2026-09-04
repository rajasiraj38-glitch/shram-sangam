// packages/ui-kit/src/components/fee-breakdown.tsx
// The core "cooperative differentiator" UI component.
// Shows the transparent 90/7/3 fee split on every booking.

import React from 'react';
import { Users, Shield, Heart } from 'lucide-react';
import { formatINR, computeFees } from '../lib/utils';
import { cn } from '../lib/utils';

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
