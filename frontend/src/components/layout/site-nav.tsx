// frontend/src/components/layout/site-nav.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { GitFork } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_REPOSITORY_URL } from "@/lib/seo";
import { MobileBottomNav } from "./mobile-bottom-nav";

const navLinks = [
  { href: "/proof", label: "Verify" },
  { href: "/issuer/register", label: "Issue" },
  { href: "/employer", label: "Hire" },
  { href: "/opportunity", label: "Opportunities" },
  { href: "/pilot", label: "Pilot" },
  { href: "/docs", label: "Docs" },
  { href: "/status", label: "Status" },
];

export function SiteNav() {
  const pathname = usePathname();
  // Mobile/tablet: tuck the brand bar away on scroll-down (the bottom bar carries
  // navigation); reveal on any scroll-up. Desktop keeps a permanent sticky bar.
  const [barHidden, setBarHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 80) setBarHidden(false);
        else if (delta > 8) setBarHidden(true);
        else if (delta < -8) setBarHidden(false);
        lastY = y;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <a
        href="#main"
        className="absolute left-4 -top-12 focus:top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 px-3 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm no-underline transition-[top] duration-150"
      >
        Skip to content
      </a>

      {/* Installed-PWA: keeps the translucent status bar readable while the
          auto-hiding header is translated away. Zero-height in browsers. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-20 h-[env(safe-area-inset-top)] bg-surface-glass backdrop-blur-xl lg:hidden pointer-events-none"
      />

      {/* Glassmorphism nav — slim brand bar on mobile/tablet, full links at lg+ */}
      <nav
        className={cn(
          "sticky top-0 z-10",
          /* installed-PWA / notch: extend the glass under the status bar */
          "pt-[env(safe-area-inset-top)]",
          "border-b border-border-glass",
          "backdrop-blur-xl bg-surface-glass",
          /* amber hairline top edge */
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-linear-to-r before:from-transparent before:via-primary/60 before:to-transparent",
          "relative",
          "max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          barHidden && "max-lg:-translate-y-full max-lg:focus-within:translate-y-0"
        )}
        aria-label="Header"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto px-5 py-3 lg:px-7 lg:py-4 gap-4">
          {/* Brand */}
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2.5 text-text no-underline font-bold text-[17px] tracking-[-0.2px] shrink-0 hover:opacity-80 transition-opacity focus-visible:outline-primary"
          >
            <Image src="/logo.svg" alt="" width={28} height={28} />
            <span className="font-heading">Stellaroid Earn</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex gap-6 text-sm flex-1 ml-6">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                prefetch={false}
                className={cn(
                  "no-underline transition-colors focus-visible:outline-primary pb-0.5",
                  isActive(l.href)
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-muted hover:text-text"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions — desktop */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <a
              href={SITE_REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-border-glass bg-transparent px-3 text-[13px] font-semibold text-text no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              <GitFork className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>

          {/* Right action — mobile/tablet: compact GitHub icon (primary nav lives in the bottom bar) */}
          <a
            href={SITE_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository (opens in new tab)"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border-glass text-text-muted bg-transparent no-underline hover:text-text hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
          >
            <GitFork className="w-4.5 h-4.5" aria-hidden="true" />
          </a>
        </div>
      </nav>

      {/* App-style bottom navigation on mobile/tablet */}
      <MobileBottomNav />
    </>
  );
}
