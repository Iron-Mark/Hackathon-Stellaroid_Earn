"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({ id, value, onChange, options, placeholder, className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onEscape);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-controls={`${id ?? "select"}-listbox`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center justify-between w-full min-h-[44px] rounded-lg border px-3 py-2 text-[15px] max-lg:text-base text-left cursor-pointer transition-colors duration-150",
          "bg-surface-2 border-border hover:border-primary/40",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          open && "border-primary"
        )}
      >
        <span className={selected ? "text-text" : "text-text-muted"}>
          {selected?.label ?? placeholder ?? "Select..."}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform duration-150",
            open && "rotate-180 text-primary"
          )}
        />
      </button>

      {open && (
        <ul
          id={`${id ?? "select"}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl overflow-hidden py-1 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-[14px] cursor-pointer transition-colors",
                option.value === value
                  ? "text-primary bg-primary/8"
                  : "text-text hover:bg-surface-2"
              )}
            >
              <span className={cn(
                "w-4 h-4 flex items-center justify-center shrink-0",
                option.value !== value && "invisible"
              )}>
                <Check className="w-3.5 h-3.5 text-primary" />
              </span>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
