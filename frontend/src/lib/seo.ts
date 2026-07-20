import type { Metadata } from "next";

export const SITE_NAME = "Stellaroid Earn";

export const SITE_AUTHOR_NAME = "Mark Siazon";
export const SITE_AUTHOR_URL = "https://marksiazon.dev";
export const SITE_AUTHOR_LINKEDIN = "https://www.linkedin.com/in/mark-siazon/";
export const SITE_AUTHOR_GITHUB = "https://github.com/Iron-Mark";
export const SITE_REPOSITORY_URL = "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn";
// Public product contact inbox (pilot requests, privacy questions, security
// reports). Override via env if a dedicated product address is set up later.
export const SITE_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "marksiazon.dev@gmail.com";
export const SITE_CONTRACT_SOURCE_URL = `${SITE_REPOSITORY_URL}/tree/main/contract`;
export const SITE_RISE_EVENT_URL =
  "https://www.risein.com/programs/build-on-stellar-philippine-blockchain-week-2026";

const DEFAULT_CANONICAL_URL = "https://stellaroid.tech";

export interface CanonicalConfig {
  url: string;
  origin: string;
}

export function resolveCanonicalConfig(rawUrl: string | undefined): CanonicalConfig {
  const trimmed = rawUrl?.trim() ?? "";

  if (!trimmed) {
    return {
      url: DEFAULT_CANONICAL_URL,
      origin: new URL(DEFAULT_CANONICAL_URL).origin,
    };
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    const normalizedOrigin = `${parsed.protocol}//${parsed.host}`;
    return {
      url: `${normalizedOrigin}${normalizedPath}`,
      origin: parsed.origin,
    };
  } catch {
    return {
      url: DEFAULT_CANONICAL_URL,
      origin: new URL(DEFAULT_CANONICAL_URL).origin,
    };
  }
}

const canonicalConfig = resolveCanonicalConfig(process.env.NEXT_PUBLIC_CANONICAL_URL);
export const SITE_CANONICAL_URL = canonicalConfig.url;
export const SITE_CANONICAL_ORIGIN = canonicalConfig.origin;

/** Absolute logo URL for Organization / Publisher rich-result schema. */
export const SITE_LOGO_URL = `${SITE_CANONICAL_URL}/icon-512.png`;

/** Disambiguating entity links for Organization/Person `sameAs`. */
export const SITE_ORG_SAME_AS = [SITE_REPOSITORY_URL, SITE_AUTHOR_LINKEDIN, SITE_AUTHOR_URL];

export const SITE_DESCRIPTION =
  "Stellaroid Earn is a Stellar testnet demo for on-chain credential verification and instant payroll for verified work.";

export const SITE_KEYWORDS =
  "stellar, soroban, credential verification, blockchain credentials, on-chain payroll, xp, certificate registry, stellar testnet, fintech hiring, proof of work";

export function normalizeSeoPath(path = "/") {
  const withLeadingSlash = path?.startsWith("/") ? path : `/${path}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return collapsed || "/";
}

export function seoCanonicalUrl(path = "/") {
  const normalized = normalizeSeoPath(path);
  return `${SITE_CANONICAL_URL}${normalized === "/" ? "" : normalized}`;
}

// NOTE: hreflang alternates are intentionally NOT emitted. Locale here is
// cookie-based (see app/layout.tsx) — en and tl render at the SAME URL — so
// per-language hreflang annotations would all point to one URL and be invalid.
// Reintroduce this only alongside genuinely distinct per-locale URLs (/tl/...).

interface BuildPageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  openGraphType?: 
    | "article"
    | "book"
    | "music.album"
    | "music.playlist"
    | "music.radio_station"
    | "music.song"
    | "profile"
    | "video.episode"
    | "video.movie"
    | "video.other"
    | "video.tv_show"
    | "website";
  robots?: Metadata["robots"];
}

export function buildPageMetadata({
  title,
  description,
  path,
  keywords = SITE_KEYWORDS,
  openGraphType = "website",
  robots,
}: BuildPageMetadataOptions): Metadata {
  const canonicalPath = normalizeSeoPath(path);
  const canonicalUrl = seoCanonicalUrl(canonicalPath);

  return {
    title,
    description,
    keywords,
    authors: [{ name: SITE_AUTHOR_NAME, url: SITE_AUTHOR_URL }],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: openGraphType,
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_US",
      alternateLocale: "tl_PH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots,
  };
}
