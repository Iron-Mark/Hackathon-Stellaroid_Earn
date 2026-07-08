import { seoCanonicalUrl } from "@/lib/seo";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { guides } from "@/lib/content/guides";

type ChangeFrequency = "weekly" | "monthly" | "daily";

type SitemapRoute = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

const HASH_RE = /^[0-9a-f]{64}$/i;

const sampleProofRoute: SitemapRoute | null = HASH_RE.test(DEFAULT_SAMPLE_PROOF_HASH)
  ? { path: `/proof/${DEFAULT_SAMPLE_PROOF_HASH}`, changeFrequency: "monthly", priority: 0.7 }
  : null;

const routes: SitemapRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/app", changeFrequency: "weekly", priority: 0.9 },
  { path: "/proof", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/issuer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/issuer/register", changeFrequency: "monthly", priority: 0.5 },
  { path: "/employer", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pilot", changeFrequency: "monthly", priority: 0.6 },
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
  })),
];

if (sampleProofRoute) {
  routes.push(sampleProofRoute);
}

// Statically generated at build time so <lastmod> is a stable, meaningful
// per-deploy timestamp instead of "now" on every request (which is noise
// search/AI crawlers learn to ignore).
export const dynamic = "force-static";
const LAST_MODIFIED = new Date().toISOString();

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function GET() {
  const lastModified = LAST_MODIFIED;
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(
      ({ path, changeFrequency, priority }) => `  <url>
    <loc>${escapeXml(seoCanonicalUrl(path))}</loc>
    <lastmod>${lastModified}</lastmod>
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
