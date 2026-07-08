// frontend/src/components/ui/input.tsx
"use client";

import * as React from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Boolean error state OR error message string */
  error?: boolean | string;
  label?: string;
  helper?: string;
  /** Shows helper text as a hover/focus tooltip on an info icon instead of inline */
  tooltip?: string;
  /** Node rendered on the right side of the label row (e.g. a Paste button) */
  labelAction?: React.ReactNode;
  mono?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helper, tooltip, labelAction, mono, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : undefined;

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor={id} className="text-[13px] font-medium text-text-muted">
                {label}
              </label>
              {tooltip && (
                <span className="relative group inline-flex items-center" tabIndex={0}>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="text-text-muted/35 group-hover:text-text-muted group-focus:text-text-muted cursor-help transition-colors"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span
                    role="tooltip"
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-52 px-2.5 py-2 rounded-md bg-surface-2 border border-border text-[11px] text-text-muted leading-relaxed opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 pointer-events-none z-20 shadow-lg"
                  >
                    {tooltip}
                  </span>
                </span>
              )}
            </div>
            {labelAction}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "flex w-full min-h-[44px] px-3 py-2",
            "rounded-lg bg-surface-2 border",
            mono ? "font-mono" : "font-sans",
            /* ≥16px below lg so iOS Safari doesn't auto-zoom on focus */
            "text-[15px] max-lg:text-base text-text placeholder:text-text-muted/60",
            "transition-colors duration-150",
            hasError
              ? "border-danger focus-visible:outline-danger"
              : "border-border focus-visible:border-primary focus-visible:outline-primary",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:opacity-45 disabled:cursor-not-allowed",
            className
          )}
          aria-describedby={
            errorMessage ? errorId : helper ? helperId : undefined
          }
          aria-invalid={hasError ? "true" : undefined}
          {...props}
        />
        {errorMessage ? (
          <p id={errorId} className="text-[12px] text-danger" role="alert">
            {errorMessage}
          </p>
        ) : helper && !tooltip ? (
          <p id={helperId} className="text-[12px] text-text-muted/50">
            {helper}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
export default Input;
