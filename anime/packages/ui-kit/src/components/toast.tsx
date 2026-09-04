// packages/ui-kit/src/components/toast.tsx
// Lightweight toast notification component (no external dependency needed)

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'REMOVE'; id: string };

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      return { toasts: [action.toast, ...state.toasts].slice(0, 5) };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', toast: { id, type, title, message } });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000);
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-coop-green" />,
    error:   <AlertCircle className="h-5 w-5 text-coop-red" />,
    info:    <Info className="h-5 w-5 text-coop-blue" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  const borders: Record<ToastType, string> = {
    success: 'border-l-4 border-l-coop-green',
    error:   'border-l-4 border-l-coop-red',
    info:    'border-l-4 border-l-coop-blue',
    warning: 'border-l-4 border-l-yellow-500',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80"
      >
        {state.toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              'flex items-start gap-3 rounded-lg bg-white p-4 shadow-lg',
              'animate-in slide-in-from-right-5',
              borders[t.type],
            )}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
              {t.message && (
                <p className="text-xs text-gray-500 mt-0.5">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dispatch({ type: 'REMOVE', id: t.id })}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
