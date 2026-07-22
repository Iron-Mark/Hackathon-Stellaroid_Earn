import { seoCanonicalUrl } from "@/lib/seo";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { guides } from "@/lib/content/guides";
import { docsPages } from "@/lib/content/docs";

type ChangeFrequency = "weekly" | "monthly" | "daily";

type SitemapRoute = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  /** Stable W3C date; falls back to RELEASE_DATE when omitted. */
  lastModified?: string;
};

const HASH_RE = /^[0-9a-f]{64}$/i;

const sampleProofRoute: SitemapRoute | null = HASH_RE.test(DEFAULT_SAMPLE_PROOF_HASH)
  ? { path: `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`, changeFrequency: "monthly", priority: 0.7 }
  : null;

const routes: SitemapRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/app", changeFrequency: "weekly", priority: 0.9 },
  { path: "/demo", changeFrequency: "monthly", priority: 0.8 },
  { path: "/start", changeFrequency: "monthly", priority: 0.8 },
  { path: "/proof", changeFrequency: "monthly", priority: 0.7 },
  { path: "/opportunity", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/issuer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/issuer/register", changeFrequency: "monthly", priority: 0.5 },
  { path: "/employer", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pilot", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  // Public pages intentionally kept out of /status and /metrics: robots meta
  // explicitly marks those routes noindex.
  { path: "/slides", changeFrequency: "monthly", priority: 0.4 },
  // Audience landing pages + content library
  { path: "/verify-bootcamp-certificate", changeFrequency: "monthly", priority: 0.8 },
  { path: "/verify-candidate-credentials", changeFrequency: "monthly", priority: 0.8 },
  { path: "/instant-payouts", changeFrequency: "monthly", priority: 0.8 },
  { path: "/glossary", changeFrequency: "monthly", priority: 0.6 },
  { path: "/guides", changeFrequency: "weekly", priority: 0.7 },
  ...guides.map((g) => ({
    path: `/guides/${g.slug}`,
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.6,
    lastModified: g.dateModified ?? g.datePublished,
  })),
  // Developer documentation hub
  ...docsPages.map((d) => ({
    path: d.slug === "index" ? "/docs" : `/docs/${d.slug}`,
    changeFrequency: "monthly" as ChangeFrequency,
    priority: d.slug === "index" ? 0.7 : 0.6,
  })),
];

if (sampleProofRoute) {
  routes.push(sampleProofRoute);
}

// Statically generated so <lastmod> is a stable, meaningful date instead of a
// per-request "now". Guides carry their own content dates; every other route
// uses a fixed release date so an unchanged page does not report a fresh
// lastmod on each deploy (a signal crawlers learn to distrust). Bump
// RELEASE_DATE when the static marketing surface meaningfully changes.
export const dynamic = "force-static";
const RELEASE_DATE = "2026-07-20";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function GET() {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(
      ({ path, changeFrequency, priority, lastModified }) => `  <url>
    <loc>${escapeXml(seoCanonicalUrl(path))}</loc>
    <lastmod>${lastModified ?? RELEASE_DATE}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    ),
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
