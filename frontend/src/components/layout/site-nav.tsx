// frontend/src/components/layout/site-nav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X, GitFork } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_REPOSITORY_URL } from "@/lib/seo";

const navLinks = [
  { href: "/proof", label: "Verify" },
  { href: "/issuer/register", label: "Issue" },
  { href: "/employer", label: "Hire" },
  { href: "/pilot", label: "Pilot" },
  { href: "/status", label: "Status" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Glassmorphism nav */}
      <nav
        className={cn(
          "sticky top-0 z-10",
          "border-b border-border-glass",
          "backdrop-blur-xl bg-surface-glass",
          /* amber hairline top edge */
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-linear-to-r before:from-transparent before:via-primary/60 before:to-transparent",
          "relative"
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto px-7 py-4 gap-4">
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
          <div className="hidden md:flex gap-6 text-sm flex-1 ml-6">
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

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
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

          {/* Mobile burger */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-border text-text bg-transparent cursor-pointer hover:bg-surface-2 transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-x-0 top-[65px] bottom-0 z-20 bg-bg flex flex-col gap-1 p-6 md:hidden">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              onClick={() => setOpen(false)}
              className={cn(
                "px-4 py-3.5 text-[17px] border-b border-border no-underline transition-colors",
                isActive(l.href)
                  ? "text-primary font-semibold"
                  : "text-text hover:text-primary"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={SITE_REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border-glass bg-transparent px-4 text-sm font-semibold text-text no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              <GitFork className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      )}
    </>
  );
}
