"use client";

import Link from "next/link";
import { appConfig } from "@/lib/config";
import { seoCanonicalUrl } from "@/lib/seo";
import { CopyButton } from "@/components/ui/copy-button";
import { FiatValue } from "@/components/ui/fiat-value";

interface RecruiterCtaPanelProps {
  hash: string;
  candidateAddress?: string;
}

export function RecruiterCtaPanel({ hash, candidateAddress }: RecruiterCtaPanelProps) {
  const proofUrl = seoCanonicalUrl(`/proof/${hash}`);
  const employerHref = candidateAddress
    ? `/employer?hash=${encodeURIComponent(hash)}&candidate=${encodeURIComponent(candidateAddress)}`
    : `/employer?hash=${encodeURIComponent(hash)}`;
  const contractEventsHref = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}#events`
    : null;

  return (
    <section
      className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 flex flex-col gap-3"
      aria-label="Recruiter actions"
    >
      <span className="font-pixel text-xs font-medium text-primary uppercase tracking-wider">
        Recruiter actions
      </span>
      <p className="m-0 text-sm leading-relaxed text-text-muted">
        Start a paid trial from this verified credential. The employer form will
        carry over the certificate hash and candidate wallet.
      </p>
      <p className="m-0 text-sm text-text-muted">
        1 XLM <FiatValue amount={1} />
      </p>
      <div className="flex gap-3 flex-wrap">
        <Link
          href={employerHref}
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm no-underline hover:bg-primary-hover transition-colors"
        >
          Fund paid trial
        </Link>
        <CopyButton value={proofUrl} label="Copy proof link" ariaLabel="Copy proof link" />
      </div>
      {candidateAddress ? (
        <Link
          href={`/talent/${candidateAddress}`}
          className="text-[0.8125rem] text-accent no-underline hover:underline"
        >
          View candidate passport →
        </Link>
      ) : null}
      {contractEventsHref ? (
        <a
          href={contractEventsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.8125rem] text-accent no-underline hover:underline"
        >
          Review on-chain events →
        </a>
      ) : null}
    </section>
  );
}
