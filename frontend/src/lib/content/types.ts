// Content model for the marketing / SEO pages and the guides library.
// Pages are data-driven so /guides, /guides/[slug], the sitemap, and internal
// links all derive from a single typed source — the startup content engine.

export interface Cta {
  label: string;
  href: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Feature {
  title: string;
  body: string;
}

export interface Step {
  name: string;
  text: string;
}

export interface ProseSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

/** Ordered content block for a guide article body. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string; lang?: string }
  | { type: "callout"; text: string };

export interface LandingContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  lede: string;
  primaryCta: Cta;
  secondaryCta?: Cta;
  sections?: ProseSection[];
  features?: Feature[];
  /** When present, rendered as a numbered step list AND HowTo schema. */
  steps?: Step[];
  faq: FaqItem[];
  internalLinks?: Cta[];
}

export interface GlossaryContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  lede: string;
  sections?: ProseSection[];
  terms: GlossaryTerm[];
  faq: FaqItem[];
  primaryCta?: Cta;
  secondaryCta?: Cta;
}

export interface GuideIndexContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  lede: string;
  sections?: ProseSection[];
  faq?: FaqItem[];
  primaryCta?: Cta;
  secondaryCta?: Cta;
}

export interface GuideArticle {
  slug: string; // path segment under /guides/
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  audience: string;
  /** ISO date (stable, set per article — not generated at build). */
  datePublished: string;
  dateModified?: string;
  /** TechArticle vs Article — technical=true for developer tutorials. */
  technical?: boolean;
  lede: string;
  blocks: Block[];
  /** Optional HowTo — rendered as steps + HowTo schema. */
  howToSteps?: Step[];
  howToName?: string;
  faq: FaqItem[];
  primaryCta: Cta;
  secondaryCta?: Cta;
}
