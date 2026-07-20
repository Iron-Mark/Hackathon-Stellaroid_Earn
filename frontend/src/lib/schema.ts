import type { CertificateRecord } from "./contract-read-server.ts";
import type { ProofMetadata } from "./types.ts";
import {
  SITE_AUTHOR_GITHUB,
  SITE_AUTHOR_LINKEDIN,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_CANONICAL_URL,
  SITE_DESCRIPTION,
  SITE_LOGO_URL,
  SITE_NAME,
  SITE_ORG_SAME_AS,
  seoCanonicalUrl,
} from "./seo.ts";

type JsonLdPerson = {
  "@type": string;
  name: string;
  url: string;
  sameAs?: string[];
};

type JsonLdOrganization = {
  "@type": string;
  name: string;
  url: string;
  founder: JsonLdPerson;
};

type JsonLdOffer = {
  "@type": "Offer";
  price: string;
  priceCurrency: string;
  availability: string;
  url: string;
};

type AboutSoftwareProductSchema = {
  "@context": "https://schema.org";
  "@type": ["Product", "SoftwareApplication"];
  name: string;
  description: string;
  url: string;
  image: string;
  applicationCategory: string;
  operatingSystem: string;
  creator: JsonLdPerson;
  author: JsonLdPerson;
  publisher: JsonLdOrganization;
  offers: JsonLdOffer;
  aggregateRating?: unknown;
  review?: unknown;
  reviews?: unknown;
};

type ProofDigitalDocumentSchema = {
  "@context": "https://schema.org";
  "@type": "DigitalDocument";
  name: string;
  description: string;
  identifier: string;
  url: string;
  keywords?: string[];
};

type ProofArticleSchema = {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  image: string;
  author: JsonLdPerson;
  creator: JsonLdPerson;
  publisher: JsonLdOrganization;
  datePublished?: string;
  dateModified?: string;
  about: {
    "@type": "DigitalDocument";
    name: string;
    identifier: string;
    url: string;
  };
  mainEntity: {
    "@type": "DigitalDocument";
    identifier: string;
    url: string;
  };
};

const AUTHOR_SCHEMA = {
  "@type": "Person",
  name: SITE_AUTHOR_NAME,
  url: SITE_AUTHOR_URL,
  sameAs: [SITE_AUTHOR_URL, SITE_AUTHOR_LINKEDIN, SITE_AUTHOR_GITHUB],
};

const PUBLISHER_SCHEMA = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_CANONICAL_URL,
  logo: {
    "@type": "ImageObject",
    url: SITE_LOGO_URL,
    width: 512,
    height: 512,
  },
  description: SITE_DESCRIPTION,
  sameAs: SITE_ORG_SAME_AS,
  founder: AUTHOR_SCHEMA,
};

/** Ordered breadcrumb trail. Pass paths like "/", "/issuer", "/issuer/register". */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: seoCanonicalUrl(item.path),
    })),
  };
}

/** FAQPage schema. Answers MUST mirror text visibly rendered on the page. */
export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** DefinedTermSet for a glossary — feeds AI Overviews / definition answers. */
export function buildDefinedTermSetJsonLd({
  name,
  path,
  terms,
}: {
  name: string;
  path: string;
  terms: Array<{ term: string; definition: string }>;
}) {
  const url = seoCanonicalUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    url,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.definition,
      inDefinedTermSet: url,
    })),
  };
}

/** Article / TechArticle schema for a guide, with author + publisher entities. */
export function buildGuideArticleJsonLd({
  title,
  description,
  path,
  datePublished,
  dateModified,
  technical = false,
}: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  technical?: boolean;
}) {
  const url = seoCanonicalUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": technical ? "TechArticle" : "Article",
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: seoCanonicalUrl("/opengraph-image"),
    author: AUTHOR_SCHEMA,
    publisher: PUBLISHER_SCHEMA,
    datePublished,
    dateModified: dateModified ?? datePublished,
  };
}

/** HowTo schema for a step-by-step process (e.g. the homepage flow). */
export function buildHowToJsonLd({
  name,
  description,
  totalTime,
  url,
  steps,
}: {
  name: string;
  description: string;
  totalTime?: string;
  url?: string;
  steps: Array<{ name: string; text: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(url ? { url } : {}),
    })),
  };
}

function secondsToIso(seconds: number | undefined): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  return new Date(seconds * 1000).toISOString();
}

function proofDocumentFallbackDescription(cert: CertificateRecord): string {
  if (cert.status === "verified") {
    return "Verified, on-chain proof of completed work. Anchored on Stellar with SHA-256. Paid atomically on verification.";
  }

  return `This credential is anchored on Stellar and its current status is ${cert.status}. Inspect the proof page before trusting or sharing this record.`;
}

export function buildAboutSoftwareProductSchema(): AboutSoftwareProductSchema {
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "SoftwareApplication"],
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: seoCanonicalUrl("/about"),
    image: seoCanonicalUrl("/opengraph-image"),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    creator: AUTHOR_SCHEMA,
    author: AUTHOR_SCHEMA,
    publisher: PUBLISHER_SCHEMA,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: seoCanonicalUrl("/app"),
    },
  };
}

export function buildProofDigitalDocumentSchema({
  hash,
  cert,
  proofMetadata,
}: {
  hash: string;
  cert: CertificateRecord | null;
  proofMetadata: ProofMetadata | null;
}): ProofDigitalDocumentSchema {
  const proofUrl = seoCanonicalUrl(`/proof/${hash}`);
  const shortHash = `${hash.slice(0, 10)}...${hash.slice(-10)}`;

  if (!cert) {
    return {
      "@context": "https://schema.org",
      "@type": "DigitalDocument",
      name: `Proof lookup · ${shortHash}`,
      description: "No on-chain certificate record was found for this hash.",
      identifier: hash,
      url: proofUrl,
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: proofMetadata?.title ?? `Proof of Work · ${shortHash}`,
    description: proofMetadata?.description ?? proofDocumentFallbackDescription(cert),
    identifier: hash,
    url: proofUrl,
    keywords: proofMetadata?.skills,
  };
}

export function buildProofArticleSchema({
  hash,
  cert,
  proofMetadata,
}: {
  hash: string;
  cert: CertificateRecord | null;
  proofMetadata: ProofMetadata | null;
}): ProofArticleSchema | null {
  if (!cert) return null;

  const proofUrl = seoCanonicalUrl(`/proof/${hash}`);
  const datePublished = secondsToIso(cert.issuedAt);
  const dateModified = secondsToIso(cert.verifiedAt) ?? datePublished;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: (proofMetadata?.title ?? cert.title) || "On-chain credential proof",
    description:
      proofMetadata?.description ??
      "Public credential proof report anchored on Stellar testnet.",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": proofUrl,
    },
    image: seoCanonicalUrl(`/proof/${hash}/opengraph-image`),
    author: AUTHOR_SCHEMA,
    creator: AUTHOR_SCHEMA,
    publisher: PUBLISHER_SCHEMA,
    datePublished,
    dateModified,
    about: {
      "@type": "DigitalDocument",
      name: (proofMetadata?.title ?? cert.title) || "On-chain credential",
      identifier: hash,
      url: proofUrl,
    },
    mainEntity: {
      "@type": "DigitalDocument",
      identifier: hash,
      url: proofUrl,
    },
  };
}
