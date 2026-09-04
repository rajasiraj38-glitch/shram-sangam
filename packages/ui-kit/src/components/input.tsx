// packages/ui-kit/src/components/input.tsx
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon | React.ReactNode;
  leftAddon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  hint,
  icon,
  leftAddon,
  fullWidth = true,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const leadingContent = leftAddon ?? (
    typeof icon === 'function'
      ? React.createElement(icon, { className: 'h-4 w-4' })
      : icon
  );

  return (
    <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingContent && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {leadingContent}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'block rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            leadingContent && 'pl-9',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-300',
            fullWidth && 'w-full',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent',
          'disabled:bg-gray-50 disabled:cursor-not-allowed resize-none',
          error ? 'border-red-400' : 'border-gray-300',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
