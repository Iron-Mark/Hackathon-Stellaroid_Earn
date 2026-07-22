// frontend/src/components/landing/localized-hero.tsx
"use client";

import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, SearchCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { useLocale } from "@/hooks/use-locale";
import { i18n } from "@/lib/i18n";

interface LocalizedHeroProps {
  className?: string;
}

const personaRoutes = [
  {
    href: "/issuer/register",
    Icon: BadgeCheck,
  },
  {
    href: `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`,
    Icon: SearchCheck,
  },
  {
    href: "/employer",
    Icon: BriefcaseBusiness,
  },
];

export function LocalizedHero({ className }: LocalizedHeroProps) {
  const locale = useLocale();
  const t = i18n[locale].hero;

  return (
    <section
      className={cn(
        "px-6 pt-14 pb-16 sm:px-0 sm:py-24 sm:pb-16 max-w-260 mx-auto text-center",
        className,
      )}
    >
      <span className="inline-block font-pixel text-xs tracking-widest uppercase text-primary border border-amber-500/30 bg-amber-500/8 px-3 py-1 rounded-full mb-5">
        {t.eyebrow}
      </span>
      <h1 className="text-3xl sm:text-7xl leading-[1.15] sm:leading-tight -tracking-wide font-bold m-0 mb-5">
        {t.h1a}
        {" "}
        <br />
        <em className="not-italic bg-[linear-gradient(to_right_in_oklch,var(--color-primary),#FCD34D)] bg-clip-text text-transparent">
          {t.h1b}
        </em>
      </h1>
      <p className="text-base sm:text-lg text-text-muted max-w-160 mx-auto mb-8 leading-[1.55]">
        {t.lede}
      </p>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:flex-wrap">
        <Link
          href="/app"
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold text-base no-underline",
            "bg-primary text-on-primary border border-primary shadow-lg shadow-amber-500/15",
            "hover:bg-primary-hover hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-0.5",
            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-1",
            "transition-all duration-150 ease-out",
            "motion-safe:hover:-translate-y-px motion-reduce:hover:translate-y-0",
          )}
        >
          {t.ctaPrimary}
        </Link>
        <Link
          href="/demo"
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold text-base no-underline",
            "text-text border border-border bg-transparent",
            "hover:bg-surface hover:-translate-y-0.5",
            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-1",
            "transition-all duration-150 ease-out",
            "motion-safe:hover:-translate-y-px motion-reduce:hover:translate-y-0",
          )}
        >
          {t.ctaGhost}
        </Link>
        <Link
          href="/start"
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold text-base no-underline",
            "text-text border border-border bg-transparent",
            "hover:bg-surface hover:-translate-y-0.5",
            "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-1",
            "transition-all duration-150 ease-out",
            "motion-safe:hover:-translate-y-px motion-reduce:hover:translate-y-0",
          )}
        >
          Try it yourself in 60s
        </Link>
      </div>
      <div
        className="mt-10 grid gap-3 px-0 text-left sm:grid-cols-3"
        aria-label="Choose your Stellaroid workflow"
      >
        {t.personas.map((persona, index) => {
          const route = personaRoutes[index];
          const Icon = route.Icon;

          return (
            <Link
              key={persona.label}
              href={route.href}
              prefetch={false}
              className={cn(
                "group min-h-[188px] rounded-lg border border-border bg-surface/80 p-5 no-underline",
                "flex flex-col gap-3 transition-[border-color,background,transform] duration-150 ease-out",
                "hover:border-primary hover:bg-surface motion-safe:hover:-translate-y-0.5",
                "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
              )}
            >
              <div className="flex min-h-11 items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-pixel text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {persona.label}
                </span>
              </div>
              <div className="grid gap-2">
                <h2 className="m-0 text-lg font-semibold leading-snug text-text">
                  {persona.title}
                </h2>
                <p className="m-0 text-sm leading-relaxed text-text-muted">
                  {persona.body}
                </p>
              </div>
              <span className="mt-auto inline-flex min-h-11 items-center text-sm font-semibold text-primary group-hover:text-primary-hover">
                {persona.cta}
              </span>
            </Link>
          );
        })}
      </div>
      <img
        src="/illust/illust-hero.svg"
        alt="Register, verify, and pay flow"
        width={560}
        height={187}
        className="block max-w-full h-auto mx-auto mt-12 sm:mt-12 sm:[image-rendering:pixelated]"
      />
    </section>
  );
}

export default LocalizedHero;
