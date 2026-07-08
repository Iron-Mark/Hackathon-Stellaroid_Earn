import type { Metadata } from "next";
import { JsonLd } from "@/components/ui/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { ProseSection, renderInline } from "@/components/marketing/prose-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { CtaBand } from "@/components/marketing/cta-band";
import {
  buildBreadcrumbJsonLd,
  buildDefinedTermSetJsonLd,
  buildFaqJsonLd,
} from "@/lib/schema";
import { glossaryContent as content } from "@/lib/content/glossary";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: content.slug,
  title: content.metaTitle,
  description: content.metaDescription,
  keywords: content.keywords.join(", "),
});

export default function GlossaryPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Glossary", path: content.slug },
        ])}
      />
      <JsonLd
        data={buildDefinedTermSetJsonLd({
          name: content.h1,
          path: content.slug,
          terms: content.terms,
        })}
      />
      {content.faq.length ? <JsonLd data={buildFaqJsonLd(content.faq)} /> : null}

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

        <section aria-labelledby="terms-heading" className="flex flex-col gap-4">
          <h2 id="terms-heading" className="m-0 text-2xl font-bold tracking-tight text-text">
            Terms, defined
          </h2>
          <dl className="m-0 grid gap-3 sm:grid-cols-2">
            {content.terms.map((t) => (
              <div
                key={t.term}
                className="rounded-lg border border-border bg-surface px-5 py-4"
              >
                <dt className="text-[0.9375rem] font-semibold text-text">{t.term}</dt>
                <dd className="m-0 mt-1.5 text-sm leading-[1.6] text-text-muted">
                  {renderInline(t.definition)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <FaqSection items={content.faq} />

        <CtaBand
          title="See the terms in action"
          body="Open a live testnet proof page or run the full issue-verify-pay flow in the pilot."
          primaryCta={{ label: "See a live proof", href: "/proof" }}
          secondaryCta={{ label: "Read the guides", href: "/guides" }}
        />
      </MarketingShell>
    </>
  );
}
