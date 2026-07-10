import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";
import { PilotLeadForm } from "@/components/pilot/pilot-lead-form";
import { JsonLd } from "@/components/ui/json-ld";
import {
  SITE_AUTHOR_LINKEDIN,
  SITE_AUTHOR_URL,
  SITE_CANONICAL_URL,
  SITE_NAME,
  buildPageMetadata,
  seoCanonicalUrl,
} from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";

const pilotBreadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Pilot", path: "/pilot" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/pilot",
  title: "Run a credential pilot",
  description:
    "Request an issuer pilot or employer verification integration for Stellaroid Earn: 5–10 testnet credentials, one approval contact, a success metric, and a rollback plan.",
  keywords:
    "stellar credential pilot, issuer pilot, employer verification integration, on-chain certificate verification",
});

const pilotJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Pilot Stellaroid Earn",
  url: seoCanonicalUrl("/pilot"),
  description:
    "Request an issuer pilot or employer verification integration for Stellaroid Earn on Stellar testnet.",
  isPartOf: {
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_CANONICAL_URL,
  },
};

const intakeItems = [
  "Issuer name, website, and approval contact",
  "Expected credential volume and certificate format",
  "Graduate wallet readiness and support needs",
  "Employer verification or paid-trial workflow",
  "Pilot success metric and rollback plan",
];

const guardrails = [
  "5 to 10 credentials",
  "One issuer and one approval contact",
  "Testnet public proof pages only",
  "No mainnet or production payroll",
  "Manual rollback and revocation plan",
  "Feedback from one recruiter or employer",
];

export default function PilotPage() {
  return (
    <>
      <JsonLd data={pilotJsonLd} />
      <JsonLd data={pilotBreadcrumbJsonLd} />
      <SiteNav />
      <main id="main" className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="grid gap-5">
          <span className="font-pixel text-xs font-medium uppercase tracking-widest text-primary">
            Pilot intake
          </span>
          <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr] md:items-end">
            <div>
              <h1 className="m-0 text-4xl font-bold tracking-tight text-text sm:text-5xl">
                Run a narrow credential pilot before expanding scope.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
                Stellaroid is strongest when one real issuer proves the issue,
                verify, revoke, and employer review loop on testnet. The pilot
                path below keeps NFT, marketplace, and mainnet work out of the
                way until the proof workflow is trusted.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="m-0 text-sm font-semibold text-text">
                Current pilot boundary
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Testnet only, public proof pages, employer summary export, and
                manual issuer approval. No production payroll or mainnet claims.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Pilot request paths">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="m-0 text-xl font-semibold text-text">Issuer pilot</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              For a bootcamp, campus group, or training provider that wants to
              issue 5 to 10 verifiable testnet credentials and review the public
              proof experience with graduates.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a
                href="#request"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary no-underline transition-colors hover:bg-primary-hover"
              >
                Request an issuer pilot
              </a>
              <a
                href={SITE_AUTHOR_LINKEDIN}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-text-muted no-underline hover:text-text"
              >
                or book directly on LinkedIn
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="m-0 text-xl font-semibold text-text">Employer integration</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              For a recruiter or employer who wants a no-login proof URL,
              summary export, and paid-trial path tied to a verified credential.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                href="/proof"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface-2 px-4 text-sm font-semibold text-text no-underline transition-colors hover:border-primary"
              >
                Review proof workflow
              </Link>
              <a
                href="#request"
                className="inline-flex items-center text-sm font-semibold text-text-muted no-underline hover:text-text"
              >
                or request an integration
              </a>
            </div>
          </div>
        </section>

        <section id="request" className="grid scroll-mt-24 gap-5">
          <div>
            <h2 className="m-0 text-2xl font-semibold text-text">
              Request a testnet pilot
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              Tell us who you are and what you&rsquo;d like to prove. Pilots are
              free, testnet-only, and scoped to 5–10 credentials with one
              approval contact.
            </p>
          </div>
          <PilotLeadForm />
        </section>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="m-0 text-xl font-semibold text-text">What the pilot captures</h2>
          <ul className="mt-4 grid gap-3 p-0 sm:grid-cols-2" role="list">
            {intakeItems.map((item) => (
              <li
                key={item}
                className="list-none rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-muted"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            For anything outside that boundary, use the portfolio contact route
            first:{" "}
            <a
              href={SITE_AUTHOR_URL}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              marksiazon.dev
            </a>
            .
          </p>
        </section>

        <section className="rounded-lg border border-primary/25 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em]">
                  Narrow testnet rollout
                </p>
              </div>
              <h2 className="mt-2 text-xl font-semibold text-text">
                  Pilot scope guardrails
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
                Keep the first pilot small enough to finish. The next credible milestone is not a
                marketplace. It is one issuer proving that graduates and employers understand the
                proof, trust, and paid-trial loop.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/issuer"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary no-underline transition-colors hover:bg-primary-hover"
              >
                Open issuer console
              </Link>
              <Link
                href="/status"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface-2 px-4 text-sm font-semibold text-text no-underline transition-colors hover:border-primary"
              >
                Check demo status
              </Link>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {guardrails.map((item) => (
              <li
                key={item}
                className="flex list-none gap-2 rounded-md border border-border bg-bg px-4 py-3 text-sm text-text-muted"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
