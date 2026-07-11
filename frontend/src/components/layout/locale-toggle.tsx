"use client";

import { useEffect, useState, type ReactElement } from "react";
import { usePathname } from "next/navigation";

export type Locale = "en" | "tl" | "es";
export const LOCALES: Locale[] = ["en", "tl", "es"];
export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "tl" || value === "es";
}
export const LOCALE_STORAGE_KEY = "stellaroid:locale";
export const LOCALE_CHANGE_EVENT = "stellaroid:locale-change";

/**
 * Routes whose page body actually localizes (hero, /about copy, /app
 * dashboard strings). The toggle only renders here — showing it on
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

const LOCALE_META: Record<Locale, { label: string; Flag: () => ReactElement }> = {
  en: { label: "English", Flag: GbFlag },
  tl: { label: "Tagalog", Flag: PhFlag },
  es: { label: "Español", Flag: EsFlag },
};

export function LocaleToggle() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");

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

  function toggle() {
    const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];
    setLocale(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch { /* ignore */ }
    document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent<Locale>(LOCALE_CHANGE_EVENT, { detail: next }));
  }

  if (!isLocalizedRoute(pathname)) return null;

  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];
  const { label: nextLabel, Flag: NextFlag } = LOCALE_META[nextLocale];

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch language to ${nextLabel}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer border border-transparent hover:border-border"
    >
      <NextFlag />
      <span>{nextLabel}</span>
    </button>
  );
}

export default LocaleToggle;
