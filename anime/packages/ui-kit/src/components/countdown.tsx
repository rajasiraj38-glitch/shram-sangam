// packages/ui-kit/src/components/countdown.tsx
// 90-second acceptance countdown for incoming job offers

'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CountdownProps {
  expiresAt: string;   // ISO datetime
  onExpire?: () => void;
  className?: string;
}

export function Countdown({ expiresAt, onExpire, className }: CountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return; }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(timer); onExpire?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const urgent = remaining <= 20;
  const pct = Math.min(100, (remaining / 90) * 100);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-10 w-10 flex-shrink-0">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={urgent ? '#dc2626' : '#16a34a'}
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 94.25} 94.25`}
            strokeLinecap="round"
          />
        </svg>
        <span className={cn(
          'absolute inset-0 flex items-center justify-center text-xs font-bold',
          urgent ? 'text-coop-red' : 'text-gray-700',
        )}>
          {remaining}
        </span>
      </div>
      <div>
        <p className={cn('text-sm font-semibold', urgent ? 'text-coop-red' : 'text-gray-700')}>
          {urgent ? 'Expiring soon!' : 'Accept in time'}
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {remaining}s left to accept
        </p>
      </div>
    </div>
  );
}
