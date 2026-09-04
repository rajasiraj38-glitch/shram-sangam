// packages/ui-kit/src/lib/utils.ts
// Utility helpers shared across all UI components

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names without conflicts */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an INR amount — e.g. 1200 → "₹1,200" */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format a date string to a readable local format */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a datetime string to date + time */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Returns time remaining from now until a deadline */
export function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m left`;
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}m ${secs}s left`;
}

/** Compute 90/7/3 fee breakdown */
export function computeFees(total: number) {
  return {
    worker:    parseFloat((total * 0.90).toFixed(2)),
    coopOps:   parseFloat((total * 0.07).toFixed(2)),
    mutualAid: parseFloat((total * 0.03).toFixed(2)),
  };
}
