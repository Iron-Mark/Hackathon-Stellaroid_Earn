"use client";

import { useEffect, useState } from "react";
import {
  LOCALE_CHANGE_EVENT,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from "@/components/layout/locale-toggle";

export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) setLocale(saved);
    } catch {
      // SSR or storage denied — stay on default
    }

    function onChange(e: Event) {
      const next = (e as CustomEvent<Locale>).detail;
      if (isLocale(next)) setLocale(next);
    }

    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  }, []);

  return locale;
}
