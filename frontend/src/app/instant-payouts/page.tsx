import type { Metadata } from "next";
import { LandingLayout } from "@/components/marketing/landing-layout";
import { instantPayouts as content } from "@/lib/content/landing-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: content.slug,
  title: content.metaTitle,
  description: content.metaDescription,
  keywords: content.keywords.join(", "),
});

export default function InstantPayoutsPage() {
  return <LandingLayout content={content} breadcrumbName="Instant payouts" />;
}
