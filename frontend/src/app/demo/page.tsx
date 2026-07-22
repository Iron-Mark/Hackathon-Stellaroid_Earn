import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui";
import { JsonLd } from "@/components/ui/json-ld";
import { appConfig } from "@/lib/config";
import {
  getCertificateServer,
  getOpportunityServer,
  type CertificateRecord,
} from "@/lib/contract-read-server";
import { DEFAULT_SAMPLE_PROOF_HASH } from "@/lib/demo-data";
import { getDemoTourSteps, type DemoTourStep } from "@/lib/demo-tour";
import { buildPageMetadata } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/schema";
import { formatXlm, statusTone } from "@/components/opportunity/opportunity-format";
import type { OpportunityRecord } from "@/lib/types";

export const revalidate = 300;

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Guided demo", path: "/demo" },
]);

export const metadata: Metadata = buildPageMetadata({
  path: "/demo",
  title: "Guided demo — no wallet needed",
  description:
    "Walk the full Stellaroid Earn story on real Stellar testnet data: a certificate is anchored, verified by an approved issuer, escrowed into a paid trial, and the XLM is released on-chain.",
  keywords:
    "stellar demo, credential verification demo, soroban escrow demo, no wallet demo, Stellar testnet",
});

async function safeRead<T>(read: () => Promise<T | null>): Promise<T | null> {
  try {
    return await read();
  } catch {
    return null;
  }
}

function StepStatus({
  cert,
  opportunity,
  stepKey,
}: {
  cert: CertificateRecord | null;
  opportunity: OpportunityRecord | null;
  stepKey: DemoTourStep["key"];
}) {
  if (stepKey === "register") {
    return cert ? (
      <Badge tone="accent" dot>
        Anchored on-chain
      </Badge>
    ) : null;
  }
  if (stepKey === "verify") {
    return cert?.verified ? (
      <Badge tone="success" dot>
        Verified
      </Badge>
    ) : null;
  }
  if (!opportunity) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Badge tone={statusTone(opportunity.status)} dot>
        {opportunity.status.replace("_", " ")}
      </Badge>
      <span className="text-sm font-semibold text-text">
        {formatXlm(opportunity.amount)}
      </span>
    </span>
  );
}

export default async function DemoPage() {
  const steps = getDemoTourSteps();

  const [cert, liveOpp, releasedOpp] = await Promise.all([
    safeRead(() => getCertificateServer(DEFAULT_SAMPLE_PROOF_HASH)),
    safeRead(() => getOpportunityServer(appConfig.demoOpportunityLiveId)),
    safeRead(() => getOpportunityServer(appConfig.demoOpportunityReleasedId)),
  ]);

  function stepData(step: DemoTourStep) {
    const opportunity =
      step.key === "escrow-live"
        ? liveOpp
        : step.key === "escrow-released"
          ? releasedOpp
          : null;
    const hasLiveData =
      step.key === "register" || step.key === "verify"
        ? cert != null
        : opportunity != null;
    return { opportunity, hasLiveData };
  }

  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-3xl px-6 py-12">
        <JsonLd data={breadcrumbJsonLd} />
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
            Guided demo · 2 minutes · no wallet needed
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            Proof and payment, on real testnet data
          </h1>
          <p className="mt-3 max-w-[680px] text-sm leading-relaxed text-text-muted">
            Every record below is real data on Stellar testnet, seeded by the
            team as a permanent exhibit. Nothing is simulated — each step links
            to the live in-app page and to the raw record on stellar.expert so
            you can audit it independently.
          </p>
        </header>

        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {steps.map((step) => {
            const { opportunity, hasLiveData } = stepData(step);
            return (
              <li
                key={step.key}
                className="rounded-2xl border border-border bg-surface p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-semibold text-primary"
                    >
                      {step.step}
                    </span>
                    <h2 className="m-0 text-lg font-semibold text-text">
                      <span className="visually-hidden">Step {step.step}: </span>
                      {step.title}
                    </h2>
                  </div>
                  <span className="font-pixel text-[10px] font-bold uppercase tracking-[0.14em] text-primary/80 border border-primary/25 bg-primary/[0.08] rounded-full px-2.5 py-1">
                    Demo exhibit
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {step.narrative}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {hasLiveData ? (
                    <StepStatus
                      cert={cert}
                      opportunity={opportunity}
                      stepKey={step.key}
                    />
                  ) : (
                    <p className="m-0 text-xs text-text-muted">{step.fallback}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
                  {hasLiveData ? (
                    <Link
                      href={step.liveHref}
                      className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {step.liveLabel}
                    </Link>
                  ) : null}
                  <a
                    href={step.explorerHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-text no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Verify on stellar.expert
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="visually-hidden">(opens in new tab)</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="m-0 text-lg font-semibold text-text">
            Want to drive it yourself?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Browse every live escrow in the opportunity directory, or connect a
            testnet wallet (Freighter on desktop, Albedo anywhere) to register,
            verify, and pay with your own signatures.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/opportunity"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
            >
              Browse opportunities
            </Link>
            <Link
              href="/start"
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-text no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              Try it yourself in 60s
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
