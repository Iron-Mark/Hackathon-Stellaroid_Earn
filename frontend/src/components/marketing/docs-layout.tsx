import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/ui/json-ld";
import { ProseBlocks } from "./prose-section";
import { FaqSection } from "./faq-section";
import { CtaBand } from "./cta-band";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildGuideArticleJsonLd,
} from "@/lib/schema";
import { cn } from "@/lib/utils";
import type { DocPage } from "@/lib/content/types";

export function DocsLayout({
  page,
  allPages,
}: {
  page: DocPage;
  allPages: DocPage[];
}) {
  const path = page.slug === "index" ? "/docs" : `/docs/${page.slug}`;
  const breadcrumb =
    page.slug === "index"
      ? [
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
        ]
      : [
          { name: "Home", path: "/" },
          { name: "Docs", path: "/docs" },
          { name: page.navLabel, path },
        ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumb)} />
      <JsonLd
        data={buildGuideArticleJsonLd({
          title: page.title,
          description: page.metaDescription,
          path,
          datePublished: "2026-07-09",
          technical: true,
        })}
      />
      {page.faq.length ? <JsonLd data={buildFaqJsonLd(page.faq)} /> : null}

      <div className="relative min-h-dvh">
        <SiteNav />
        <div className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-12 max-sm:py-8">
          {/* Sidebar — desktop */}
          <aside className="hidden w-52 shrink-0 lg:block" aria-label="Docs navigation">
            <nav className="sticky top-24 flex flex-col gap-1">
              <p className="m-0 mb-2 font-pixel text-[11px] font-semibold uppercase tracking-widest text-primary">
                Documentation
              </p>
              {allPages.map((p) => {
                const href = p.slug === "index" ? "/docs" : `/docs/${p.slug}`;
                const active = p.slug === page.slug;
                return (
                  <Link
                    key={p.slug}
                    href={href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm no-underline transition-colors",
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-text-muted hover:bg-surface hover:text-text",
                    )}
                  >
                    {p.navLabel}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main id="main" className="min-w-0 flex-1">
            {/* Section nav — mobile/tablet */}
            <nav
              aria-label="Docs navigation"
              className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            >
              {allPages.map((p) => {
                const href = p.slug === "index" ? "/docs" : `/docs/${p.slug}`;
                const active = p.slug === page.slug;
                return (
                  <Link
                    key={p.slug}
                    href={href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium no-underline transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-surface text-text-muted hover:text-text",
                    )}
                  >
                    {p.navLabel}
                  </Link>
                );
              })}
            </nav>

            <article className="flex flex-col gap-8">
              <header className="flex flex-col gap-3">
                <h1 className="m-0 max-w-3xl text-3xl font-bold leading-[1.15] -tracking-wide text-text sm:text-4xl">
                  {page.title}
                </h1>
                <p className="m-0 max-w-2xl text-base leading-relaxed text-text-muted">
                  {page.lede}
                </p>
              </header>

              <ProseBlocks blocks={page.blocks} />

              <FaqSection items={page.faq} />

              <CtaBand
                title="Run it yourself on testnet"
                body="Everything documented here is live in the early-access pilot: free, testnet-only, and auditable on stellar.expert."
                primaryCta={{ label: "Try the app", href: "/app" }}
                secondaryCta={{
                  label: "View the source",
                  href: "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn",
                }}
              />
            </article>
          </main>
        </div>
        <SiteFooter />
      </div>
    </>
  );
}
