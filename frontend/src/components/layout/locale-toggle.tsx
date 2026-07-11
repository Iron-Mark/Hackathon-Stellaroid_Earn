"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Locale = "en" | "tl" | "es" | "pt" | "id" | "vi";
export const LOCALES: Locale[] = ["en", "tl", "es", "pt", "id", "vi"];
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}
export const LOCALE_STORAGE_KEY = "stellaroid:locale";
export const LOCALE_CHANGE_EVENT = "stellaroid:locale-change";

/**
 * Routes whose page body actually localizes (hero, /about copy, /app
 * dashboard strings). The picker only renders here — showing it on
 * English-only content pages advertised a switch that silently did nothing.
 */
export function isLocalizedRoute(path: string | null) {
  if (!path) return false;
  if (path === "/") return true;
  return ["/about", "/app"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

function PhFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="8" fill="#0038A8" />
      <rect y="8" width="24" height="8" fill="#CE1126" />
      <polygon points="0,0 10,8 0,16" fill="#FFFFFF" />
      <circle cx="3.4" cy="8" r="1.1" fill="#FCD116" />
    </svg>
  );
}

function GbFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFFFFF" strokeWidth="2.4" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.2" />
      <path d="M12,0 V16 M0,8 H24" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M12,0 V16 M0,8 H24" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}

function EsFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </svg>
  );
}

function BrFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="16" fill="#009B3A" />
      <polygon points="12,2 22,8 12,14 2,8" fill="#FEDF00" />
      <circle cx="12" cy="8" r="3.2" fill="#002776" />
    </svg>
  );
}

function IdFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="8" fill="#FF0000" />
      <rect y="8" width="24" height="8" fill="#FFFFFF" />
    </svg>
  );
}

function VnFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" aria-hidden="true">
      <rect width="24" height="16" fill="#DA251D" />
      <polygon
        points="12,3.2 13.09,6.5 16.57,6.52 13.76,8.57 14.82,11.88 12,9.85 9.18,11.88 10.24,8.57 7.43,6.52 10.91,6.5"
        fill="#FFFF00"
      />
    </svg>
  );
}

const LOCALE_META: Record<Locale, { label: string; Flag: () => ReactElement }> = {
  en: { label: "English", Flag: GbFlag },
  tl: { label: "Tagalog", Flag: PhFlag },
  es: { label: "Español", Flag: EsFlag },
  pt: { label: "Português", Flag: BrFlag },
  id: { label: "Bahasa Indonesia", Flag: IdFlag },
  vi: { label: "Tiếng Việt", Flag: VnFlag },
};

export function LocaleToggle() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) setLocale(saved);
    } catch { /* ignore */ }

    function onChange(e: Event) {
      const next = (e as CustomEvent<Locale>).detail;
      if (isLocale(next)) setLocale(next);
    }
    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function choose(next: Locale) {
    setLocale(next);
    setOpen(false);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch { /* ignore */ }
    document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent<Locale>(LOCALE_CHANGE_EVENT, { detail: next }));
  }

  if (!isLocalizedRoute(pathname)) return null;

  const { label: currentLabel, Flag: CurrentFlag } = LOCALE_META[locale];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentLabel}. Change language`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer border border-transparent hover:border-border"
      >
        <CurrentFlag />
        <span>{currentLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-150",
            open && "rotate-180 text-primary",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute bottom-full right-0 z-50 mb-2 min-w-[184px] rounded-lg border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl overflow-hidden py-1"
        >
          {LOCALES.map((code) => {
            const { label, Flag } = LOCALE_META[code];
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => choose(code)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-left cursor-pointer transition-colors",
                    active ? "text-primary bg-primary/8" : "text-text hover:bg-surface-2",
                  )}
                >
                  <Flag />
                  <span className="flex-1">{label}</span>
                  {active && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LocaleToggle;
