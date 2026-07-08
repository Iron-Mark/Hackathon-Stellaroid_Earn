import type { Metadata } from "next";
import { DocsLayout } from "@/components/marketing/docs-layout";
import { docsPages, getDocPage } from "@/lib/content/docs";
import { buildPageMetadata } from "@/lib/seo";

const page = getDocPage("index")!;

export const metadata: Metadata = buildPageMetadata({
  path: "/docs",
  title: page.metaTitle,
  description: page.metaDescription,
  keywords: page.keywords.join(", "),
});

export default function DocsIndexPage() {
  return <DocsLayout page={page} allPages={docsPages} />;
}
