// packages/ui-kit/src/components/spinner.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-label={label ?? 'Loading'}>
      <Loader2 className={cn('animate-spin text-brand-500', sizes[size], className)} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}

/** Full-screen loading overlay */
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Spinner size="lg" label={label} />
    </div>
  );
}
