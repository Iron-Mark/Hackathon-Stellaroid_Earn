import type { Metadata } from "next";

export const SITE_NAME = "Stellaroid Earn";

export const SITE_AUTHOR_NAME = "Mark Siazon";
export const SITE_AUTHOR_URL = "https://marksiazon.dev";
export const SITE_AUTHOR_LINKEDIN = "https://www.linkedin.com/in/mark-siazon/";
export const SITE_REPOSITORY_URL = "https://github.com/Iron-Mark/Hackathon-Stellaroid_Earn";
export const SITE_CONTRACT_SOURCE_URL = `${SITE_REPOSITORY_URL}/tree/main/contract`;

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

export function alternateLanguagesFor(path = "/") {
  const normalized = normalizeSeoPath(path);
  return {
    "en-US": normalized,
    en: normalized,
    "tl-PH": normalized,
  };
}

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
      languages: alternateLanguagesFor(canonicalPath),
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
