// packages/ui-kit/src/components/badge.tsx
import React from 'react';
import { cn } from '../lib/utils';

export type BadgeVariant =
  | 'default' | 'success' | 'warning' | 'danger'
  | 'info' | 'purple' | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-gray-100 text-gray-700',
  success:  'bg-green-100 text-green-800',
  warning:  'bg-yellow-100 text-yellow-800',
  danger:   'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-800',
  purple:   'bg-purple-100 text-purple-800',
  outline:  'border border-gray-300 text-gray-600 bg-transparent',
};

/** Booking status → badge variant mapping */
export const BOOKING_STATUS_VARIANT: Record<string, BadgeVariant> = {
  requested:   'warning',
  accepted:    'info',
  arrived:     'info',
  in_progress: 'success',
  completed:   'success',
  cancelled:   'default',
  disputed:    'danger',
};

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' ? 'bg-green-500' :
            variant === 'warning' ? 'bg-yellow-500' :
            variant === 'danger'  ? 'bg-red-500' :
            variant === 'info'    ? 'bg-blue-500' :
            variant === 'purple'  ? 'bg-purple-500' : 'bg-gray-500',
          )}
        />
      )}
      {children}
    </span>
  );
}

/** Convenience: render a booking status badge */
export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant={BOOKING_STATUS_VARIANT[status] ?? 'default'} dot>
      {label}
    </Badge>
  );
}
