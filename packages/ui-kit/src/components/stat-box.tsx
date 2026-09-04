// packages/ui-kit/src/components/stat-box.tsx
// Reusable stat/KPI card for dashboards

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

export type StatBoxColor = 'orange' | 'teal' | 'lime' | 'blue' | 'red' | 'slate';

export interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: LucideIcon | React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  color?: StatBoxColor;
  trend?: number;          // e.g. 12 means +12%
  sublabel?: string;
  className?: string;
}

const colorMap: Record<StatBoxColor, { iconBg: string; iconColor: string }> = {
  orange: { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  teal: { iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  lime: { iconBg: 'bg-lime-100', iconColor: 'text-lime-600' },
  blue: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  red: { iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
};

export function StatBox({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  color = 'slate',
  trend,
  sublabel,
  className,
}: StatBoxProps) {
  const trendUp = trend !== undefined && trend >= 0;
  const theme = colorMap[color];
  const resolvedIconBg = iconBg ?? theme.iconBg;
  const resolvedIconColor = iconColor ?? theme.iconColor;
  const renderedIcon: React.ReactNode =
    typeof icon === 'function'
      ? React.createElement(icon, { className: 'h-5 w-5' })
      : icon;

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
        {icon && (
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', resolvedIconBg)}>
            <span className={cn('h-5 w-5', resolvedIconColor)}>
              {renderedIcon}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
