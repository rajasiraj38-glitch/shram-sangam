// packages/ui-kit/src/components/stat-box.tsx
// Reusable stat/KPI card for dashboards

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number;          // e.g. 12 means +12%
  sublabel?: string;
  className?: string;
}

export function StatBox({
  label,
  value,
  icon: Icon,
  iconColor = 'text-brand-500',
  iconBg = 'bg-brand-50',
  trend,
  sublabel,
  className,
}: StatBoxProps) {
  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div className={cn('rounded-card bg-white shadow-card border border-gray-100 p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 truncate">{value}</p>
          {sublabel && (
            <p className="mt-0.5 text-xs text-gray-400">{sublabel}</p>
          )}
          {trend !== undefined && (
            <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', trendUp ? 'text-coop-green' : 'text-coop-red')}>
              {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
