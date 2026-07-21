"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
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
  // Which option currently holds focus (roving tabindex). Kept in sync with the
  // element that actually has DOM focus so keyboard and screen readers agree.
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selected = options.find((o) => o.value === value);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const listboxId = `${id ?? "select"}-listbox`;
  const optionId = (i: number) => `${id ?? "select"}-option-${i}`;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // On open, start on the selected option and move focus into the list so
  // keyboard/screen-reader users land on a real, operable control.
  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    const raf = requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, selectedIndex]);

  function openMenu() {
    if (options.length > 0) setOpen(true);
  }

  function closeMenu(refocusTrigger = true) {
    setOpen(false);
    if (refocusTrigger) triggerRef.current?.focus();
  }

  function selectAt(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  }

  function moveActive(next: number) {
    const clamped = Math.max(0, Math.min(options.length - 1, next));
    setActiveIndex(clamped);
    optionRefs.current[clamped]?.focus();
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    // Enter/Space open via the native button click; only arrows need handling.
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(activeIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(activeIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        moveActive(0);
        break;
      case "End":
        e.preventDefault();
        moveActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectAt(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex items-center justify-between w-full min-h-[44px] rounded-lg border px-3 py-2 text-[15px] max-lg:text-base text-left cursor-pointer transition-colors duration-150",
          "bg-surface-2 border-border hover:border-primary/40",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
          open && "border-primary",
        )}
      >
        <span className={selected ? "text-text" : "text-text-muted"}>
          {selected?.label ?? placeholder ?? "Select..."}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform duration-150",
            open && "rotate-180 text-primary",
          )}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl overflow-hidden py-1 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              onClick={() => selectAt(index)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 text-[14px] cursor-pointer transition-colors outline-none",
                "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2",
                option.value === value
                  ? "text-primary bg-primary/8"
                  : "text-text hover:bg-surface-2",
                index === activeIndex && option.value !== value && "bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 flex items-center justify-center shrink-0",
                  option.value !== value && "invisible",
                )}
              >
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
