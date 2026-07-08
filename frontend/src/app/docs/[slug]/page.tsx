import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/marketing/docs-layout";
import { docsPages, getDocPage } from "@/lib/content/docs";
import { buildPageMetadata } from "@/lib/seo";

interface DocPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return docsPages.filter((p) => p.slug !== "index").map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page || page.slug === "index") return {};
  return buildPageMetadata({
    path: `/docs/${page.slug}`,
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords.join(", "),
    openGraphType: "article",
  });
}

export default async function DocsSectionPage({ params }: DocPageProps) {
  const { slug } = await params;
  const page = getDocPage(slug);
  if (!page || page.slug === "index") notFound();

  return <DocsLayout page={page} allPages={docsPages} />;
}
