import { appConfig } from "@/lib/config";
import { EMPLOYER_REVIEW_STEPS } from "@/lib/employer-review";
import type { ProofVerificationBreakdown } from "@/lib/proof-verification";
import { seoCanonicalUrl } from "@/lib/seo";
import { CopyButton } from "@/components/ui/copy-button";
import { Badge } from "@/components/ui/badge";
import { TrackedProofActionLink } from "./tracked-proof-action-link";

interface RecruiterCtaPanelProps {
  hash: string;
  candidateAddress?: string;
  verificationBreakdown?: ProofVerificationBreakdown | null;
}

export function RecruiterCtaPanel({
  hash,
  candidateAddress,
  verificationBreakdown,
}: RecruiterCtaPanelProps) {
  const proofUrl = seoCanonicalUrl(`/proof/${hash}`);
  const employerHref = candidateAddress
    ? `/employer?hash=${encodeURIComponent(hash)}&candidate=${encodeURIComponent(candidateAddress)}`
    : `/employer?hash=${encodeURIComponent(hash)}`;
  const candidatePassportHref = candidateAddress
    ? `/talent/${candidateAddress}?proof=${encodeURIComponent(hash)}`
    : null;
  const contractEventsHref = appConfig.contractId
    ? `${appConfig.explorerUrl}/contract/${appConfig.contractId}#events`
    : null;
  const proofStatus =
    verificationBreakdown?.checks.find((check) => check.id === "credential_status")
      ?.label ?? null;
  const proofStatusForAnalytics =
    proofStatus === "verified" ||
    proofStatus === "issued" ||
    proofStatus === "revoked" ||
    proofStatus === "suspended" ||
    proofStatus === "expired" ||
    proofStatus === "unknown"
      ? proofStatus
      : null;

  return (
    <section
      className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-4 flex flex-col gap-3"
      aria-label="Recruiter actions"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-pixel text-xs font-medium text-primary uppercase tracking-wider">
          Recruiter actions
        </span>
        {verificationBreakdown ? (
          <Badge
            tone={
              verificationBreakdown.decision === "ready_for_paid_trial_review"
                ? "success"
                : "warning"
            }
            dot
          >
            {verificationBreakdown.decision === "ready_for_paid_trial_review"
              ? "trust-ready"
              : "inspect first"}
          </Badge>
        ) : null}
      </div>
      <p className="m-0 text-sm leading-relaxed text-text-muted">
        {verificationBreakdown?.employerTrustSummary ??
          "Start a paid trial from this verified credential."} The employer form
        will carry over the certificate hash and candidate wallet.
      </p>
      <ol className="grid list-none gap-2 p-0 text-sm">
        {EMPLOYER_REVIEW_STEPS.map((step, index) => (
          <li key={step.id} className="flex gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-surface text-[0.6875rem] font-semibold text-primary">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-text">{step.title}</span>
              <span className="block leading-relaxed text-text-muted">
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex gap-3 flex-wrap">
        <TrackedProofActionLink
          href={employerHref}
          eventName="proof_employer_handoff_clicked"
          hash={hash}
          proofStatus={proofStatusForAnalytics}
          trustTier={verificationBreakdown?.issuerTrust.tier ?? "unknown"}
          className="inline-flex min-h-11 items-center px-4 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm no-underline hover:bg-primary-hover transition-colors"
        >
          Fund paid trial
        </TrackedProofActionLink>
        <TrackedProofActionLink
          href={`/proof/${hash}/export`}
          download
          eventName="proof_pack_opened"
          hash={hash}
          proofStatus={proofStatusForAnalytics}
          className="inline-flex min-h-11 items-center px-4 py-2 rounded-md border border-border bg-surface-2 text-text font-semibold text-sm no-underline hover:border-primary transition-colors"
        >
          Download proof pack
        </TrackedProofActionLink>
        <CopyButton value={proofUrl} label="Copy proof link" ariaLabel="Copy proof link" />
      </div>
      {candidatePassportHref ? (
        <a
          href={candidatePassportHref}
          className="text-[0.8125rem] text-accent no-underline hover:underline"
        >
          View candidate passport →
        </a>
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
