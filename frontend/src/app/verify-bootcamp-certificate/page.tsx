import type { Metadata } from "next";
import { LandingLayout } from "@/components/marketing/landing-layout";
import { verifyBootcampCertificate as content } from "@/lib/content/landing-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: content.slug,
  title: content.metaTitle,
  description: content.metaDescription,
  keywords: content.keywords.join(", "),
  images: null, // uses this route's own opengraph-image.tsx
});

export default function VerifyBootcampCertificatePage() {
  return <LandingLayout content={content} breadcrumbName="For bootcamps" />;
}
