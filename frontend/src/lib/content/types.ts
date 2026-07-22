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

/** Ordered content block for a guide/docs article body. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string; lang?: string }
  | { type: "callout"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

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

export interface DocPage {
  /** Path segment under /docs/ — "index" for the hub page itself. */
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Short sidebar label. */
  navLabel: string;
  lede: string;
  blocks: Block[];
  faq: FaqItem[];
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

/** One dated entry inside a journey chapter. */
export interface JourneyMilestone {
  /** "2026-04-18" (day precision) or "2026-05" (month precision). */
  date: string;
  title: string;
  detail: string;
  /** Short or full commit SHA, 7-40 hex chars. Rendered as a GitHub link. */
  commit?: string;
  /** Pull request number. Rendered as a GitHub link. */
  pr?: number;
  /** Release tag, e.g. "v1.0.0". Rendered as a GitHub link. */
  tag?: string;
  /** A live surface this milestone produced. */
  link?: { label: string; href: string };
}

/** A recognition. Rendered both in the top band and inside its chapter. */
export interface JourneyAward {
  /** Unique, URL-safe. */
  slug: string;
  /** Must match a JourneyChapter.slug. */
  chapter: string;
  /** "2026-04" or "2026-07-21". Orders the band. */
  date: string;
  /** Display override for spans, e.g. "April - July 2026". */
  period?: string;
  headline: string;
  detail: string;
  evidence?: { kind: "image" | "link"; href: string; label: string };
}

/** One act of the story. Its slug is the page anchor. */
export interface JourneyChapter {
  /** Unique, URL-safe. Becomes the #anchor and the rail target. */
  slug: string;
  eyebrow: string;
  title: string;
  /** The one-line skim, shown collapsed. */
  summary: string;
  milestones: JourneyMilestone[];
}

export interface JourneyCreditItem {
  name: string;
  /** What it does for this project. */
  role: string;
  /** SPDX-ish identifier, e.g. "Apache-2.0", "MIT", "OFL-1.1". */
  license?: string;
  href?: string;
}

export interface JourneyCreditGroup {
  title: string;
  note?: string;
  items: JourneyCreditItem[];
}
