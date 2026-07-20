import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ArticleLayout } from "@/components/marketing/article-layout";
import { getGuide, guides } from "@/lib/content/guides";
import { buildPageMetadata } from "@/lib/seo";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildPageMetadata({
    path: `/guides/${guide.slug}`,
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords.join(", "),
    openGraphType: "article",
    images: null, // uses this route's own opengraph-image.tsx
  });
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <MarketingShell className="max-w-3xl">
      <ArticleLayout article={guide} />
    </MarketingShell>
  );
}
