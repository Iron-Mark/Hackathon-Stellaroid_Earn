import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/ui/json-ld";
import { JourneyRecognition } from "@/components/journey/journey-recognition";
import { JourneyTimeline } from "@/components/journey/journey-timeline";
import { JourneyCredits } from "@/components/journey/journey-credits";
import { journeyChapters } from "@/lib/content/journey";
import {
  buildPageMetadata,
  seoCanonicalUrl,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_CANONICAL_URL,
  SITE_REPOSITORY_URL,
} from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/journey",
  title: "Journey",
  description:
    "How Stellaroid Earn went from a bootcamp assignment to a Blue Belt project: the recognitions it earned and the commits, tags, and deployments behind them.",
});

const FIRST_COMMIT_DATE = "2026-03-20";

/** The newest milestone date, used as the Article's dateModified. */
const lastModified = journeyChapters
  .flatMap((chapter) => chapter.milestones.map((milestone) => milestone.date))
  .sort()
  .at(-1) as string;

const journeyBreadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_CANONICAL_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Journey",
      item: `${SITE_CANONICAL_URL}/journey`,
    },
  ],
};

const journeyArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Stellaroid Earn journey",
  description:
    "The recognitions Stellaroid Earn earned and the build history behind them, from the first commit through the Level 5 submission.",
  url: seoCanonicalUrl("/journey"),
  datePublished: FIRST_COMMIT_DATE,
  dateModified: lastModified,
  author: {
    "@type": "Person",
    name: SITE_AUTHOR_NAME,
    url: SITE_AUTHOR_URL,
  },
};

export default function JourneyPage() {
  return (
    <>
      <JsonLd data={journeyBreadcrumbJsonLd} />
      <JsonLd data={journeyArticleJsonLd} />

      <div className="min-h-screen bg-bg">
        <SiteNav />

        <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
          <header>
            <p className="m-0 text-xs font-medium uppercase tracking-[0.08em] text-primary">
              March 2026 to today
            </p>
            <h1 className="mt-3 mb-0 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              How this project got here
            </h1>
            <p className="mt-4 mb-0 max-w-[65ch] text-base leading-relaxed text-text-muted">
              Stellaroid Earn started as a bootcamp assignment and kept going
              after the bootcamp ended. This page is the record: what it earned,
              what I shipped, and who built the tools underneath it. Every
              milestone links to the commit, pull request, or release it came
              from, so none of it has to be taken on faith.
            </p>
          </header>

          <JourneyRecognition />
          <JourneyTimeline />
          <JourneyCredits />

          <div className="my-12 flex flex-wrap gap-3">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-5.5 py-3 text-[0.9375rem] font-semibold text-on-primary no-underline transition-[transform,background,box-shadow] duration-150 hover:-translate-y-px hover:bg-primary-hover motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              Try it in 60 seconds
            </Link>
            <Link
              href="/case-study"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5.5 py-3 text-[0.9375rem] font-semibold text-text no-underline transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-surface motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              Read the case study
            </Link>
            <a
              href={SITE_REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-transparent px-5.5 py-3 text-[0.9375rem] font-semibold text-text no-underline transition-[transform,background] duration-150 hover:-translate-y-px hover:bg-surface motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
            >
              Read the source
            </a>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
