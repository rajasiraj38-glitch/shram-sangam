// packages/ui-kit/src/components/nav.tsx
// Top navigation bar — shared shell across all three apps

import React from 'react';
import { Menu, X, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

export interface NavBarProps {
  appName: string;
  role?: 'customer' | 'worker_member' | 'admin_coop';
  userName?: string;
  items?: NavItem[];
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
  rightSlot?: React.ReactNode;
}

const roleColors: Record<string, string> = {
  customer:     'bg-blue-100 text-blue-800',
  worker_member:'bg-green-100 text-green-800',
  admin_coop:   'bg-purple-100 text-purple-800',
};

const roleLabels: Record<string, string> = {
  customer:     'Customer',
  worker_member:'Worker Member',
  admin_coop:   'Co-op Admin',
};

export function NavBar({
  appName,
  role,
  userName,
  items = [],
  mobileOpen,
  onMobileToggle,
  rightSlot,
}: NavBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">
        {/* Logo / App name */}
        <div className="flex items-center gap-2 font-bold text-gray-900 flex-shrink-0">
          <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm hidden sm:block">{appName}</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 ml-4 flex-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                item.active
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Role badge */}
          {role && (
            <span className={cn('hidden sm:inline-flex rounded-full px-2 py-0.5 text-xs font-medium', roleColors[role])}>
              {roleLabels[role]}
            </span>
          )}
          {/* User name */}
          {userName && (
            <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[120px]">
              {userName}
            </span>
          )}
          {rightSlot}
          {/* Mobile hamburger */}
          {onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="sm:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && items.length > 0 && (
        <div className="sm:hidden border-t border-gray-100 px-4 py-2 flex flex-col gap-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                item.active ? 'bg-brand-50 text-brand-600' : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
