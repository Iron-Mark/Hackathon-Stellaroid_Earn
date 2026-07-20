import Link from "next/link";
import { JsonLd } from "@/components/ui/json-ld";
import { MarketingShell } from "./marketing-shell";
import { PageHero } from "./page-hero";
import { ProseSection } from "./prose-section";
import { FeatureGrid } from "./feature-grid";
import { StepList } from "./step-list";
import { FaqSection } from "./faq-section";
import { CtaBand } from "./cta-band";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildHowToJsonLd,
} from "@/lib/schema";
import type { LandingContent } from "@/lib/content/types";

/** Renders an audience landing page from typed content, with Breadcrumb,
 *  FAQPage, and (when steps exist) HowTo structured data. */
export function LandingLayout({
  content,
  breadcrumbName,
}: {
  content: LandingContent;
  breadcrumbName: string;
}) {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: breadcrumbName, path: content.slug },
        ])}
      />
      {content.faq.length ? <JsonLd data={buildFaqJsonLd(content.faq)} /> : null}
      {content.steps?.length ? (
        <JsonLd
          data={buildHowToJsonLd({
            name: content.h1,
            description: content.metaDescription,
            steps: content.steps,
            url: "#how-it-works",
          })}
        />
      ) : null}

      <MarketingShell>
        <PageHero
          eyebrow={content.eyebrow}
          title={content.h1}
          lede={content.lede}
          primaryCta={content.primaryCta}
          secondaryCta={content.secondaryCta}
        />

        {content.sections?.map((s, i) => (
          <ProseSection key={s.heading ?? i} {...s} />
        ))}

        {content.steps?.length ? (
          <StepList id="how-it-works" heading="How it works" steps={content.steps} />
        ) : null}

        <FeatureGrid heading="Why it holds up" items={content.features} />

        <FaqSection items={content.faq} />

        {content.internalLinks?.length ? (
          <nav aria-label="Related pages" className="flex flex-wrap gap-2">
            {content.internalLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                prefetch={false}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3.5 text-[13px] font-medium text-text-muted no-underline transition-colors hover:border-primary hover:text-text"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <CtaBand
          title="Try the live testnet pilot"
          body="Free public early access on Stellar testnet, with no purchase, subscription, or mainnet funds required."
          primaryCta={content.primaryCta}
          secondaryCta={content.secondaryCta}
        />
      </MarketingShell>
    </>
  );
}
