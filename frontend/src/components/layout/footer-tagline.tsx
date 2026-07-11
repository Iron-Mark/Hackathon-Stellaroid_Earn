"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/hooks/use-locale";
import { i18n } from "@/lib/i18n";
import { isLocalizedRoute } from "./locale-toggle";

export function FooterTagline() {
  const locale = useLocale();
  const pathname = usePathname();
  // On routes whose body doesn't localize the toggle is hidden — keep the
  // tagline English there too, so a user who picked Tagalog elsewhere isn't
  // shown localized copy with no visible way to switch back.
  const effectiveLocale = isLocalizedRoute(pathname) ? locale : "en";
  return <p>{i18n[effectiveLocale].footer.tagline}</p>;
}
