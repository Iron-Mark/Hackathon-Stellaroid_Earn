// frontend/src/components/layout/mobile-bottom-nav.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  ExternalLink,
  FlaskConical,
  GitFork,
  Home,
  Info,
  MoreHorizontal,
  Rocket,
  SearchCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_REPOSITORY_URL } from "@/lib/seo";
import { LocaleToggle } from "./locale-toggle";

const tabs = [
  { href: "/", label: "Home", match: (p: string) => p === "/", Icon: Home },
  { href: "/proof", label: "Verify", match: (p: string) => p.startsWith("/proof"), Icon: SearchCheck },
  { href: "/issuer/register", label: "Issue", match: (p: string) => p.startsWith("/issuer"), Icon: BadgeCheck },
  {
    href: "/employer",
    label: "Hire",
    match: (p: string) => p.startsWith("/employer") || p.startsWith("/opportunity"),
    Icon: BriefcaseBusiness,
  },
];

const moreLinks = [
  { href: "/app", label: "Launch App", detail: "Register, endorse, and pay on-chain", Icon: Rocket },
  { href: "/docs", label: "Docs", detail: "Contract, integration, and security reference", Icon: BookOpen },
  { href: "/pilot", label: "Pilot", detail: "Run a cohort pilot with us", Icon: FlaskConical },
  { href: "/status", label: "Status", detail: "Network health and live events", Icon: Activity },
  { href: "/about", label: "About", detail: "How Stellaroid Earn works", Icon: Info },
];

const moreMatch = (p: string) =>
  ["/app", "/docs", "/pilot", "/status", "/about", "/metrics", "/talent"].some(prefix => p.startsWith(prefix));

export function MobileBottomNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the sheet whenever navigation happens
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      // Trap Tab inside the sheet — aria-modal promises an inert background
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement;
        const inside = current instanceof HTMLElement && panel.contains(current);
        if (e.shiftKey) {
          if (!inside || current === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (!inside || current === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);

    // The sheet hides via lg:hidden — if the viewport crosses into desktop
    // (tablet rotation, window resize) close it so the scroll lock can't strand.
    // resize listener doubles as a fallback where matchMedia change is flaky.
    const desktopQuery = window.matchMedia("(width >= 64rem)");
    function closeIfDesktop() {
      if (desktopQuery.matches) {
        setOpen(false);
      }
    }
    desktopQuery.addEventListener("change", closeIfDesktop);
    window.addEventListener("resize", closeIfDesktop, { passive: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktopQuery.removeEventListener("change", closeIfDesktop);
      window.removeEventListener("resize", closeIfDesktop);
    };
  }, [open]);

  function closeSheet() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const path = pathname ?? "";

  return (
    <>
      <nav
        data-mobile-bottom-nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 lg:hidden",
          "border-t border-border-glass backdrop-blur-xl bg-surface-glass",
          /* amber hairline top edge — mirrors the desktop nav */
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-linear-to-r before:from-transparent before:via-primary/60 before:to-transparent",
          "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        )}
      >
        <div className="grid h-16 max-w-md mx-auto grid-cols-5">
          {tabs.map(({ href, label, match, Icon }) => {
            const active = match(path);
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                aria-current={active ? (path === href ? "page" : "true") : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 no-underline",
                  "touch-manipulation transition-colors active:opacity-70",
                  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 rounded-md",
                  active ? "text-primary" : "text-text-muted hover:text-text"
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  />
                )}
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </Link>
            );
          })}
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 bg-transparent border-0 cursor-pointer",
              "touch-manipulation transition-colors active:opacity-70",
              "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2 rounded-md",
              open || moreMatch(path) ? "text-primary" : "text-text-muted hover:text-text"
            )}
          >
            {moreMatch(path) && !open && (
              <span
                aria-hidden="true"
                className="absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.6)]"
              />
            )}
            <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm motion-safe:animate-[modalFade_150ms_ease-out]"
            onClick={closeSheet}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            className={cn(
              "fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl",
              "max-h-[80dvh] overflow-y-auto overscroll-contain",
              "border-t border-border-glass bg-surface",
              "shadow-[0_-8px_32px_rgba(0,0,0,0.45)]",
              "pb-[calc(env(safe-area-inset-bottom)+16px)]",
              "motion-safe:animate-[sheetUp_220ms_cubic-bezier(0.16,1,0.3,1)]",
              /* tablet: float as a centered card above the tab bar instead of a full-width sheet */
              "sm:mx-auto sm:w-[26rem] sm:max-w-[calc(100%-3rem)] sm:rounded-2xl sm:border sm:pb-4",
              "sm:bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]"
            )}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
              <span className="h-1 w-9 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between px-5 pb-1">
              <p className="font-pixel text-[11px] font-semibold uppercase tracking-widest text-primary">
                More
              </p>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                onClick={closeSheet}
                className="flex items-center justify-center w-11 h-11 -mr-2 rounded-lg border-0 bg-transparent text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col px-3 pb-1">
              {moreLinks.map(({ href, label, detail, Icon }) => {
                const active = path.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={closeSheet}
                    aria-current={active ? (path === href ? "page" : "true") : undefined}
                    className={cn(
                      "flex items-center gap-3.5 rounded-lg px-3 py-3 no-underline",
                      "touch-manipulation transition-colors active:opacity-70 hover:bg-surface-2"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
                        active
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border bg-surface-2 text-text-muted"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className={cn("text-[15px] font-semibold", active ? "text-primary" : "text-text")}>
                        {label}
                      </span>
                      <span className="text-xs text-text-muted truncate">{detail}</span>
                    </span>
                  </Link>
                );
              })}

              <a
                href={SITE_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                onClick={closeSheet}
                className="flex items-center gap-3.5 rounded-lg px-3 py-3 no-underline touch-manipulation transition-colors active:opacity-70 hover:bg-surface-2"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-text-muted">
                  <GitFork className="w-4.5 h-4.5" aria-hidden="true" />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-text">
                    GitHub
                    <ExternalLink className="w-3 h-3 opacity-50" aria-hidden="true" />
                    <span className="visually-hidden">(opens in new tab)</span>
                  </span>
                  <span className="text-xs text-text-muted truncate">Source code for this project</span>
                </span>
              </a>

              <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3">
                <span className="text-[13px] font-medium text-text-muted">Language</span>
                <LocaleToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
