import Link from "next/link";
import { JsonLd } from "@/components/ui/json-ld";
import { ProseBlocks } from "./prose-section";
import { StepList } from "./step-list";
import { FaqSection } from "./faq-section";
import { CtaBand } from "./cta-band";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildGuideArticleJsonLd,
  buildHowToJsonLd,
} from "@/lib/schema";
import type { GuideArticle } from "@/lib/content/types";

export function ArticleLayout({ article }: { article: GuideArticle }) {
  const path = `/guides/${article.slug}`;

  return (
    <>
      <JsonLd
        data={buildGuideArticleJsonLd({
          title: article.title,
          description: article.metaDescription,
          path,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
          technical: article.technical,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: article.title, path },
        ])}
      />
      {article.faq.length ? <JsonLd data={buildFaqJsonLd(article.faq)} /> : null}
      {article.howToSteps?.length ? (
        <JsonLd
          data={buildHowToJsonLd({
            name: article.howToName ?? article.title,
            description: article.metaDescription,
            steps: article.howToSteps,
            url: `#steps`,
          })}
        />
      ) : null}

      <article className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <nav aria-label="Breadcrumb" className="text-[13px] text-text-muted">
            <Link href="/guides" prefetch={false} className="text-accent no-underline hover:underline">
              Guides
            </Link>
            <span className="mx-1.5" aria-hidden="true">
              /
            </span>
            <span className="text-text-muted">{article.audience}</span>
          </nav>
          <h1 className="m-0 max-w-3xl text-3xl font-bold leading-[1.15] -tracking-wide text-text sm:text-4xl">
            {article.title}
          </h1>
          <p className="m-0 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            {article.lede}
          </p>
          <p className="m-0 font-pixel text-[11px] uppercase tracking-widest text-text-muted">
            <time dateTime={article.datePublished}>
              {new Date(article.datePublished).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            For {article.audience}
          </p>
        </div>

        <ProseBlocks blocks={article.blocks} />

        {article.howToSteps?.length ? (
          // Distinct heading — the keyworded howToName feeds the HowTo JSON-LD,
          // but repeating it verbatim as an h2 would duplicate the page h1.
          <StepList id="steps" heading="Step-by-step checklist" steps={article.howToSteps} />
        ) : null}

        <FaqSection items={article.faq} />

        <CtaBand
          title="See it work on a live testnet proof"
          body="Stellaroid Earn is in early access on Stellar testnet — open a public proof page or run the flow yourself."
          primaryCta={article.primaryCta}
          secondaryCta={article.secondaryCta}
        />
      </article>
    </>
  );
}
