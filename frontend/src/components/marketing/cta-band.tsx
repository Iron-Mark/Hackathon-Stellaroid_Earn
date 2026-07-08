import { CtaButton } from "./cta-button";
import type { Cta } from "@/lib/content/types";

export function CtaBand({
  title,
  body,
  primaryCta,
  secondaryCta,
}: {
  title: string;
  body?: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
}) {
  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-[linear-gradient(to_bottom_right_in_oklch,rgba(245,158,11,0.08),rgba(139,92,246,0.06))] px-7 py-8 text-center max-sm:px-5">
      <h2 className="m-0 text-2xl font-bold tracking-tight text-text">{title}</h2>
      {body ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-muted">{body}</p>
      ) : null}
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <CtaButton cta={primaryCta} variant="primary" />
        {secondaryCta ? <CtaButton cta={secondaryCta} variant="secondary" /> : null}
      </div>
    </section>
  );
}
