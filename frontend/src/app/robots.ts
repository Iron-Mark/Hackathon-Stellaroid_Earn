import type { MetadataRoute } from "next";
import { seoCanonicalUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Block non-public and non-user-facing routes, and keep embed pages out
      // of search indexing.
      // The proof detail pages are intentionally left crawlable for portfolio
      // sharing and direct lookup, while `/proof/<hash>/embed` is kept noindex
      // at the page level.
      // NOTE: /status and /metrics are intentionally NOT disallowed here so their
      // page-level `noindex` is crawlable and actually enforceable (a disallowed
      // path can never be read, so its noindex is ignored and it can still surface
      // as a URL-only result).
      disallow: ["/proof/*/embed", "/talent/*", "/opportunity/*", "/api/"],
    },
    sitemap: `${seoCanonicalUrl("")}/sitemap.xml`,
  };
}
