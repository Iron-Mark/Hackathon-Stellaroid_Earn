// Server component — no "use client"
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import type { CertificateRecord } from "@/lib/contract-read-server";
import { appConfig } from "@/lib/config";
import { shortenAddress } from "@/lib/format";
import { lookupIssuer } from "@/lib/issuer-registry";
import type { IssuerRecord, ProofMetadata } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { ShareButtons } from "./share-buttons";
import { ProofQrBlock } from "./proof-qr-block";
import { HashReveal } from "@/components/ui/hash-reveal";
import { CredentialMetadataPanel } from "./credential-metadata-panel";
import { IssuerTrustCard } from "./issuer-trust-card";
import { CredentialStatusTimeline } from "./credential-status-timeline";
import { RecruiterCtaPanel } from "./recruiter-cta-panel";
import { VerificationBreakdownCard } from "./verification-breakdown-card";
import { buildProofVerificationBreakdown } from "@/lib/proof-verification";

interface ProofCardProps {
  hash: string;
  cert: CertificateRecord | null;
  issuer?: IssuerRecord | null;
  proofMetadata?: ProofMetadata | null;
  lookupFailed?: boolean;
  issuerLookupFailed?: boolean;
}

function statusMeta(cert: CertificateRecord | null, lookupFailed: boolean) {
  if (lookupFailed) {
    return {
      tone: "warning" as const,
      label: "Lookup failed",
      title: "Proof status is temporarily unavailable.",
      body: "RPC lookup failed. Refresh once and retry in a few seconds.",
      canVerify: false,
    };
  }

  if (!cert) {
    return {
      tone: "neutral" as const,
      label: "Not found",
      title: "No on-chain certificate found for this hash.",
      body: "Double-check the hash input, or try another certificate hash.",
      canVerify: false,
    };
  }

  switch (cert.status) {
    case "verified":
      return {
        tone: "verified" as const,
        label: "Verified",
        title: "This credential is verified on-chain.",
        body: "Owner and issuer records are present, and trusted verification is complete.",
        canVerify: false,
      };
    case "revoked":
      return {
        tone: "danger" as const,
        label: "Revoked",
        title: "This credential has been revoked.",
        body: "It remains visible for auditability, but it is no longer valid for verification-based actions.",
        canVerify: false,
      };
    case "suspended":
      return {
        tone: "warning" as const,
        label: "Suspended",
        title: "This credential is suspended.",
        body: "The issuer or admin has paused this credential, so it cannot be used until its status is restored.",
        canVerify: false,
      };
    case "expired":
      return {
        tone: "warning" as const,
        label: "Expired",
        title: "This credential has expired.",
        body: "The record stays visible on-chain, but it is no longer eligible for verification-based actions.",
        canVerify: false,
      };
    case "issued":
    case "unknown":
    default:
      return {
        tone: "warning" as const,
        label: "Awaiting verification",
        title: "This credential is issued, but not yet verified.",
        body: "An approved issuer or the admin wallet still needs to submit the verification transaction for this hash.",
        canVerify: true,
      };
  }
}

function issuerMeta(
  cert: CertificateRecord | null,
  issuer: IssuerRecord | null | undefined,
  issuerLookupFailed: boolean,
) {
  const fallback = cert ? lookupIssuer(cert.issuer) : null;

  if (!cert) {
    return null;
  }

  if (issuerLookupFailed) {
    return {
      tone: "warning" as const,
      label: "Issuer lookup unavailable",
      name: fallback?.name ?? "Issuer record unavailable",
    };
  }

  if (issuer) {
    switch (issuer.status) {
      case "approved":
        return {
          tone: "success" as const,
          label: "Approved issuer",
          name: issuer.name || fallback?.name || "Approved issuer",
        };
      case "suspended":
        return {
          tone: "danger" as const,
          label: "Suspended issuer",
          name: issuer.name || fallback?.name || "Suspended issuer",
        };
      case "pending":
      default:
        return {
          tone: "warning" as const,
          label: "Pending issuer",
          name: issuer.name || fallback?.name || "Pending issuer",
        };
    }
  }

  if (fallback) {
    return {
      tone: "neutral" as const,
      label: "Local label only",
      name: fallback.name,
    };
  }

  return {
    tone: "neutral" as const,
    label: "Issuer not registered",
    name: "Unregistered issuer",
  };
}

export function ProofCard({
  hash,
  cert,
  issuer,
  proofMetadata,
  lookupFailed = false,
  issuerLookupFailed = false,
}: ProofCardProps) {
  const contractId = appConfig.contractId;
  const explorerUrl = appConfig.explorerUrl;
  const shortContract = shortenAddress(contractId, 8);
  const shortHash = shortenAddress(hash, 8);
  const status = statusMeta(cert, lookupFailed);
  const issuerState = issuerMeta(cert, issuer, issuerLookupFailed);
  const verificationBreakdown = cert
    ? buildProofVerificationBreakdown({
        hash,
        cert,
        issuer: issuer ?? null,
        issuerLookupFailed,
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-8 max-sm:px-3">
      <article className="relative overflow-hidden rounded-2xl bg-surface border border-border-glass flex flex-col gap-6 p-8 max-sm:p-5 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[linear-gradient(to_right_in_oklch,var(--color-primary),var(--color-accent))]">

        {/* Header row */}
        <header className="flex items-center gap-2 flex-wrap">
          <Badge tone="accent">Stellar testnet</Badge>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
        </header>

        {/* ① What they earned */}
        {proofMetadata ? (
          <CredentialMetadataPanel metadata={proofMetadata} />
        ) : null}

        {/* ② Is it trustworthy? — or not-found block */}
        {cert || lookupFailed ? (
          <section
            className="flex flex-col gap-3"
            aria-label="Proof status summary"
          >
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
              <p className="text-text text-[0.95rem] font-semibold">
                {status.title}
              </p>
              <p className="mt-1 text-text-muted text-sm leading-relaxed">
                {status.body}
              </p>
              {cert && status.canVerify ? (
                <Link
                  href="/app"
                  prefetch={false}
                  className="inline-flex mt-2 text-accent text-[0.8125rem] font-semibold hover:underline no-underline"
                >
                  Open trusted verification flow →
                </Link>
              ) : null}
            </div>

            {issuerState ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Issued by
                </span>
                <span className="text-sm font-semibold text-text">
                  {issuerState.name}
                </span>
                <Badge tone={issuerState.tone} dot>
                  {issuerState.label}
                </Badge>
              </div>
            ) : null}
            {issuer && issuer.status !== "pending" ? (
              <IssuerTrustCard issuer={issuer} />
            ) : null}
            {verificationBreakdown ? (
              <VerificationBreakdownCard breakdown={verificationBreakdown} />
            ) : null}
          </section>
        ) : (
          <div className="flex flex-col items-center gap-1 text-sm text-text-muted border border-dashed border-border rounded-lg p-6 text-center">
            <img
              src="/illust/illust-lookup.svg"
              alt=""
              width={160}
              height={107}
              loading="lazy"
              style={{ imageRendering: "pixelated", marginBottom: 12 }}
            />
            <p className="text-text text-base font-semibold">
              No record for this hash yet.
            </p>
            <p className="max-w-[42ch] leading-relaxed">
              The hash may be mistyped, or the certificate hasn&rsquo;t been
              registered on-chain. Double-check the 64 hex characters, or
              look up a different one.
            </p>
            <Link
              href="/proof"
              prefetch={false}
              className="mt-3 inline-flex items-center px-4 py-2 rounded-md bg-primary text-on-primary font-semibold text-sm no-underline hover:bg-primary-hover transition-colors"
            >
              Look up another hash →
            </Link>
          </div>
        )}

        {cert ? (
          <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
            <CredentialStatusTimeline
              status={cert.status}
              issuedAt={cert.issuedAt}
              verifiedAt={cert.verifiedAt}
              expiresAt={cert.expiresAt}
            />
            {cert.status === "verified" ? (
              <RecruiterCtaPanel
                hash={hash}
                candidateAddress={cert.owner}
                verificationBreakdown={verificationBreakdown}
              />
            ) : null}
          </div>
        ) : null}

        {/* ③ How to verify */}
        {cert ? (
          <section
            className="border-t border-border pt-4 flex flex-col gap-3"
            aria-label="How to verify"
          >
            <ProofQrBlock hash={hash} />
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={`${explorerUrl}/contract/${contractId}#events`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.8125rem] text-accent no-underline whitespace-nowrap hover:opacity-80 hover:underline transition-opacity"
                aria-label="View on-chain events in explorer"
              >
                View on-chain events <ExternalLink className="inline w-3 h-3 ml-1" />
              </a>
              <CopyButton value={hash} ariaLabel="Copy certificate hash" />
              <span className="text-[0.8125rem] text-text-muted">
                Copy certificate hash
              </span>
            </div>
          </section>
        ) : null}

        {/* ▾ Technical details */}
        {cert || lookupFailed ? (
          <details className="border-t border-border pt-4 group">
            <summary className="cursor-pointer list-none flex items-center gap-2 text-[0.8125rem] font-medium text-text-muted hover:text-text transition-colors select-none">
              <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
              Technical details
            </summary>
            <div className="mt-3 grid gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Contract ID
                </span>
                <code className="font-mono text-[0.8125rem] text-text bg-surface-2 border border-border rounded px-1.5 py-0.5">
                  {shortContract}
                </code>
                <CopyButton value={contractId} ariaLabel="Copy contract ID" />
                <a
                  href={`${explorerUrl}/contract/${contractId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.8125rem] text-accent no-underline whitespace-nowrap hover:opacity-80 hover:underline transition-opacity"
                  aria-label="View contract on explorer"
                >
                  View on explorer <ExternalLink className="inline w-3 h-3 ml-1" />
                </a>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                  Certificate hash
                </span>
                <HashReveal hash={shortHash} />
                <CopyButton value={hash} ariaLabel="Copy certificate hash" />
              </div>
              {cert ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      Owner
                    </span>
                    <code className="font-mono text-[0.8125rem] text-text bg-surface-2 border border-border rounded px-1.5 py-0.5">
                      {shortenAddress(cert.owner, 8)}
                    </code>
                    <CopyButton value={cert.owner} ariaLabel="Copy owner address" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-pixel text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
                      Issuer
                    </span>
                    <code className="font-mono text-[0.8125rem] text-text bg-surface-2 border border-border rounded px-1.5 py-0.5">
                      {shortenAddress(cert.issuer, 8)}
                    </code>
                    <CopyButton
                      value={cert.issuer}
                      ariaLabel="Copy issuer address"
                    />
                  </div>
                </>
              ) : null}
            </div>
          </details>
        ) : null}

        {/* ▾ Submission self-check */}
        <details className="border-t border-border pt-4 group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-[0.8125rem] font-medium text-text-muted hover:text-text transition-colors select-none">
            <span className="transition-transform group-open:rotate-90 inline-block">▶</span>
            Submission self-check
          </summary>
          <ul
            className="list-none m-0 p-0 flex flex-col gap-2 mt-3"
            role="list"
          >
            <li className="flex items-start gap-2 text-sm text-text">
              <Check
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                aria-hidden="true"
              />
              Contract deployed + verified on stellar.expert
            </li>
            <li className="flex items-start gap-2 text-sm text-text">
              <Check
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <code>cargo test</code> passes (≥5 tests)
            </li>
            <li className="flex items-start gap-2 text-sm text-text">
              <Check
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                aria-hidden="true"
              />
              Frontend signs real tx via Freighter end-to-end
            </li>
            <li className="flex items-start gap-2 text-sm text-text">
              <Check
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                aria-hidden="true"
              />
              On-chain events emitted and visible in explorer
            </li>
            <li className="flex items-start gap-2 text-sm text-text">
              <Check
                className="w-4 h-4 text-success shrink-0 mt-0.5"
                aria-hidden="true"
              />
              No raw ScVal / HostError surfaces in any error path
            </li>
          </ul>
        </details>

        {/* ④ Share it */}
        <section
          className="border-t border-border pt-4"
          aria-label="Share this proof"
        >
          <p className="font-pixel text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Share
          </p>
          <ShareButtons hash={hash} status={cert?.status ?? null} />
        </section>

        {/* Footer */}
        <footer className="text-xs text-text-muted text-center border-t border-border pt-4 font-mono tracking-wide flex items-center justify-center gap-2">
          <span
            className="flex-1 h-px max-w-20 bg-[repeating-linear-gradient(90deg,var(--color-border)_0_6px,transparent_6px_10px)]"
            aria-hidden="true"
          />
          Generated from bootcamp submission · Stellar PH Bootcamp 2026
          <span
            className="flex-1 h-px max-w-20 bg-[repeating-linear-gradient(90deg,var(--color-border)_0_6px,transparent_6px_10px)]"
            aria-hidden="true"
          />
        </footer>
      </article>
    </div>
  );
}

export default ProofCard;
