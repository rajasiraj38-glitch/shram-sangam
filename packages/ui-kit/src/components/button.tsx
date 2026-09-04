// packages/ui-kit/src/components/button.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-sm active:scale-95',
  secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  outline:   'border border-white bg-transparent text-white hover:bg-white/10',
  ghost:     'hover:bg-gray-100 text-gray-600',
  danger:    'bg-coop-red hover:bg-red-700 text-white shadow-sm active:scale-95',
  success:   'bg-coop-green hover:bg-green-700 text-white shadow-sm active:scale-95',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {!loading && leftIcon}
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
