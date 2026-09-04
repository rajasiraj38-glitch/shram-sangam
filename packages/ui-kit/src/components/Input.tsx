import React from "react";
import { cn } from "../utils/cn";

// ─── Text Input ───────────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftAddon, rightAddon, className, id, ...props },
    ref
  ) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={
              [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
              undefined
            }
            aria-invalid={error ? "true" : undefined}
            className={cn(
              "w-full h-10 rounded-xl border bg-white text-sm text-slate-800",
              "placeholder:text-slate-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              leftAddon ? "pl-10" : "pl-3",
              rightAddon ? "pr-10" : "pr-3",
              error
                ? "border-red-300 focus:ring-red-300"
                : "border-slate-200 focus:ring-orange-300 focus:border-orange-300",
              props.disabled && "opacity-50 cursor-not-allowed bg-slate-50",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-slate-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? "true" : undefined}
          className={cn(
            "w-full rounded-xl border bg-white text-sm text-slate-800 px-3 py-2.5",
            "placeholder:text-slate-400 resize-none",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300",
            error ? "border-red-300" : "border-slate-200",
            className
          )}
          {...props}
        />
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
