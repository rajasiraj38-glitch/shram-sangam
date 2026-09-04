import React, { createContext, useContext, useCallback, useState } from "react";
import { cn } from "../utils/cn";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    ({ type, title, message }: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      // Auto-dismiss after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");

  return {
    success: (title: string, message?: string) =>
      ctx.addToast({ type: "success", title, message }),
    error: (title: string, message?: string) =>
      ctx.addToast({ type: "error", title, message }),
    warning: (title: string, message?: string) =>
      ctx.addToast({ type: "warning", title, message }),
    info: (title: string, message?: string) =>
      ctx.addToast({ type: "info", title, message }),
    remove: ctx.removeToast,
  };
}

// ─── Toast Container ─────────────────────────────────────────────────────────

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50 border-emerald-200",
    icon_color: "text-emerald-500",
    title_color: "text-emerald-800",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50 border-red-200",
    icon_color: "text-red-500",
    title_color: "text-red-800",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50 border-amber-200",
    icon_color: "text-amber-500",
    title_color: "text-amber-800",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50 border-blue-200",
    icon_color: "text-blue-500",
    title_color: "text-blue-800",
  },
};

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const cfg = toastConfig[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            role="alert"
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3 shadow-lg pointer-events-auto",
              "animate-in slide-in-from-right-4 fade-in duration-200",
              cfg.bg
            )}
          >
            <Icon size={18} className={cn("flex-shrink-0 mt-0.5", cfg.icon_color)} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold", cfg.title_color)}>
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
