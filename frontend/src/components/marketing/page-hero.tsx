import { CtaButton } from "./cta-button";
import type { Cta } from "@/lib/content/types";

export function PageHero({
  eyebrow,
  title,
  lede,
  primaryCta,
  secondaryCta,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
}) {
  return (
    <header className="flex flex-col gap-5">
      {eyebrow ? (
        <span className="inline-block w-fit rounded-full border border-amber-500/30 bg-amber-500/8 px-3 py-1 font-pixel text-xs uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="m-0 max-w-3xl text-3xl font-bold leading-[1.15] -tracking-wide text-text sm:text-5xl sm:leading-tight">
        {title}
      </h1>
      {lede ? (
        <p className="m-0 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
          {lede}
        </p>
      ) : null}
      {primaryCta || secondaryCta ? (
        <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {primaryCta ? <CtaButton cta={primaryCta} variant="primary" /> : null}
          {secondaryCta ? <CtaButton cta={secondaryCta} variant="secondary" /> : null}
        </div>
      ) : null}
    </header>
  );
}
