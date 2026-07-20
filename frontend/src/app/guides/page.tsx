import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/ui/json-ld";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { ProseSection } from "@/components/marketing/prose-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/schema";
import { guideIndexContent as content, guides } from "@/lib/content/guides";
import { buildPageMetadata, seoCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: content.slug,
  title: content.metaTitle,
  description: content.metaDescription,
  keywords: content.keywords.join(", "),
});

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: content.h1,
  url: seoCanonicalUrl(content.slug),
  description: content.metaDescription,
  hasPart: guides.map((g) => ({
    "@type": g.technical ? "TechArticle" : "Article",
    headline: g.title,
    url: seoCanonicalUrl(`/guides/${g.slug}`),
    description: g.metaDescription,
    datePublished: g.datePublished,
  })),
};

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <JsonLd data={collectionJsonLd} />
      {content.faq?.length ? <JsonLd data={buildFaqJsonLd(content.faq)} /> : null}

      <MarketingShell>
        <PageHero
          eyebrow={content.eyebrow}
          title={content.h1}
          lede={content.lede}
          primaryCta={content.primaryCta}
          secondaryCta={content.secondaryCta}
        />

        <section aria-label="All guides" className="grid gap-4">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              prefetch={false}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-6 no-underline transition-[border-color,background] duration-150 hover:border-primary hover:bg-surface-2"
            >
              <p className="m-0 font-pixel text-[11px] uppercase tracking-widest text-primary">
                {g.audience}
              </p>
              <h2 className="m-0 text-xl font-semibold leading-snug text-text">
                {g.title}
              </h2>
              <p className="m-0 text-sm leading-relaxed text-text-muted">{g.lede}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Read the guide
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </section>

        {content.sections?.map((s, i) => (
          <ProseSection key={s.heading ?? i} {...s} />
        ))}

        <FaqSection items={content.faq} />
      </MarketingShell>
    </>
  );
}
