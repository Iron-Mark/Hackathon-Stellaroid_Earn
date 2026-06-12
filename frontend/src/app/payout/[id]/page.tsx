// Server component. State is derived fresh on every request from the signed
// intent token + on-chain reads — no DB, nothing cached as "paid" that isn't
// provably paid right now.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { appConfig } from "@/lib/config";
import { getCertificateServer } from "@/lib/contract-read-server";
import {
  decodePayoutIntent,
  getPayoutIntentSecret,
  isDevSecret,
} from "@/lib/payout-intent";
import {
  deriveIntentState,
  fetchRecentPayments,
  matchPayment,
  type HorizonPaymentRecord,
  type PayoutIntentState,
} from "@/lib/payment-detect";
import { Badge } from "@/components/ui/badge";
import { FiatValue } from "@/components/ui/fiat-value";
import { PaymentPoller } from "@/components/payout/payment-poller";
import { OfframpGuide } from "@/components/payout/offramp-guide";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Credential-gated payout · Stellaroid Earn",
  description:
    "A payout link that unlocks only when the on-chain credential verifies. Non-custodial: payment goes wallet-to-wallet.",
  robots: { index: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function shorten(value: string, chars = 6): string {
  return value.length > chars * 2 + 1
    ? `${value.slice(0, chars)}…${value.slice(-chars)}`
    : value;
}

type StepStatus = "done" | "active" | "locked";

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") {
    return (
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-verified-bg text-verified border border-verified/40"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/10"
      >
        <span className="h-2 w-2 rounded-full bg-primary motion-safe:animate-pulse" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-text-muted"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 0 0-8 0v4M5 11h14v9H5z" />
      </svg>
    </span>
  );
}

function Step({
  index,
  title,
  status,
  children,
}: {
  index: number;
  title: string;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const stateLabel =
    status === "done" ? "complete" : status === "active" ? "in progress" : "locked";
  return (
    <li className="flex gap-4">
      <div className="flex flex-col items-center">
        <StepIcon status={status} />
        {index < 4 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" />}
      </div>
      <div className="flex-1 pb-6">
        <p className="m-0 flex flex-wrap items-center gap-2 font-medium text-text">
          <span className="text-xs text-text-muted">Step {index} of 4</span>
          {title}
          <span className="sr-only">({stateLabel})</span>
        </p>
        {children}
      </div>
    </li>
  );
}

function InvalidIntent() {
  return (
    <section className="rounded-2xl border border-danger/30 bg-danger/5 p-6">
      <h1 className="m-0 text-2xl font-semibold text-text">Invalid payout link</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        This link is malformed, was altered, or was signed for a different
        environment. Ask the employer to generate a fresh payout link from the
        employer console.
      </p>
    </section>
  );
}

export default async function PayoutPage({ params }: PageProps) {
  const { id } = await params;

  let intent = null;
  try {
    intent = decodePayoutIntent(decodeURIComponent(id), getPayoutIntentSecret());
  } catch {
    intent = null;
  }

  let body: React.ReactNode;

  if (!intent) {
    body = <InvalidIntent />;
  } else {
    let credentialVerified = false;
    let lookupFailed = false;
    try {
      const cert = await getCertificateServer(intent.credentialHash);
      credentialVerified = cert?.verified === true;
    } catch {
      lookupFailed = true;
    }

    let payment: HorizonPaymentRecord | null = null;
    if (credentialVerified) {
      try {
        const records = await fetchRecentPayments(intent.recipientAddress);
        payment = matchPayment(records, intent);
      } catch {
        payment = null;
      }
    }

    const state: PayoutIntentState = deriveIntentState({
      credentialVerified,
      payment,
    });
    const txUrl = payment
      ? `${appConfig.explorerUrl}/tx/${payment.transaction_hash}`
      : null;

    body = (
      <>
        <PaymentPoller done={state === "payment_detected"} />
        <section className="rounded-2xl border border-border bg-surface p-6">
          <p className="m-0 text-xs uppercase tracking-[0.16em] text-text-muted">
            Credential-gated payout
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text">
            {intent.amountXlm} XLM <FiatValue amount={intent.amountXlm} />
          </h1>
          <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-text-muted">
            Pays <span className="font-mono text-text">{shorten(intent.recipientAddress)}</span> once
            the credential below verifies on-chain. Stellaroid never holds the
            funds — payment goes directly from the employer&apos;s wallet to the
            graduate&apos;s wallet.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {isDevSecret() && (
              <Badge tone="warning">demo signing key</Badge>
            )}
            <Badge tone="accent">testnet</Badge>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6" aria-label="Payout progress">
          <ol className="m-0 list-none p-0">
            <Step
              index={1}
              title="Credential verified on-chain"
              status={credentialVerified ? "done" : "active"}
            >
              {credentialVerified ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <Badge tone="verified" dot>Verified</Badge>
                  <a
                    href={`/proof/${intent.credentialHash}`}
                    className="text-accent no-underline hover:underline"
                  >
                    View public proof →
                  </a>
                </p>
              ) : (
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {lookupFailed
                    ? "Credential lookup is temporarily unavailable. This page rechecks automatically."
                    : "Credential not verified. Nothing below unlocks until the on-chain certificate reads as verified."}
                </p>
              )}
            </Step>
            <Step
              index={2}
              title="Payment detected on testnet"
              status={payment ? "done" : credentialVerified ? "active" : "locked"}
            >
              {payment && txUrl ? (
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <Badge tone="success" dot>
                    {payment.amount} XLM received
                  </Badge>
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent no-underline hover:underline"
                  >
                    Transaction evidence →
                  </a>
                </p>
              ) : credentialVerified ? (
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  Waiting for a payment of at least {intent.amountXlm} XLM to{" "}
                  <span className="font-mono">{shorten(intent.recipientAddress)}</span>{" "}
                  newer than this link. Checks again every 15 seconds.
                </p>
              ) : null}
            </Step>
            <Step
              index={3}
              title="Real-money value"
              status={payment ? "done" : "locked"}
            >
              {payment && (
                <p className="mt-1 text-sm text-text-muted">
                  {payment.amount} XLM <FiatValue amount={payment.amount} />
                </p>
              )}
            </Step>
            <Step
              index={4}
              title="Cash out to pesos"
              status={payment ? "active" : "locked"}
            >
              {payment && <OfframpGuide />}
            </Step>
          </ol>
        </section>
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        {body}
      </main>
      <SiteFooter />
    </>
  );
}
