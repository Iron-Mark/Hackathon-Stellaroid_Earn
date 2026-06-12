"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { HashInput } from "@/components/actions/hash-input";
import { ProofQr } from "@/components/proof/proof-qr";
import { CopyButton } from "@/components/ui/copy-button";

function isValidAddress(addr: string): boolean {
  const trimmed = addr.trim();
  return trimmed.startsWith("G") && trimmed.length === 56;
}

function isValidHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash.trim().replace(/^0x/i, ""));
}

function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d{1,7})?$/.test(amount.trim()) && Number(amount) > 0;
}

export interface PayoutLinkFormProps {
  initialHash?: string;
  initialRecipient?: string;
}

/**
 * Employer action: mint a credential-gated payout link. The link encodes a
 * signed, stateless intent — nothing is stored server-side and no wallet is
 * needed to create it.
 */
export function PayoutLinkForm({ initialHash, initialRecipient }: PayoutLinkFormProps) {
  const [certHash, setCertHash] = useState(initialHash ?? "");
  const [recipient, setRecipient] = useState(initialRecipient ?? "");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const formValid =
    isValidHash(certHash) && isValidAddress(recipient) && isValidAmount(amount);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(null);
    setResultUrl(null);

    try {
      const response = await fetch("/api/payout-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialHash: certHash.trim().replace(/^0x/i, ""),
          recipientAddress: recipient.trim(),
          amountXlm: amount.trim(),
        }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Could not create the payout link.");
        return;
      }
      setResultUrl(new URL(payload.url, window.location.origin).toString());
    } catch {
      setError("Network error while creating the payout link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <p className="m-0 text-xs uppercase tracking-[0.16em] text-text-muted">
        Credential-gated payout
      </p>
      <h2 className="mt-2 text-xl font-semibold text-text">Create a payout link</h2>
      <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-text-muted">
        Share a link that unlocks only when the credential verifies on-chain.
        You pay from your own wallet; the page detects the payment live.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4" noValidate>
        <div>
          <span className="mb-1 block text-sm font-medium text-text">
            Certificate hash
          </span>
          <HashInput
            value={certHash}
            onChange={setCertHash}
            helper="Paste the 64-character certificate hash or drop the credential file."
          />
        </div>
        <div>
          <label htmlFor="payout-recipient" className="mb-1 block text-sm font-medium text-text">
            Graduate wallet address
          </label>
          <Input
            id="payout-recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="G… (56 characters)"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label htmlFor="payout-amount" className="mb-1 block text-sm font-medium text-text">
            Amount (XLM)
          </label>
          <Input
            id="payout-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25"
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        {error && (
          <p role="alert" className="m-0 text-sm text-danger">
            {error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={!formValid || submitting}>
            {submitting ? "Creating link…" : "Create payout link"}
          </Button>
        </div>
      </form>

      {resultUrl && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <ProofQr url={resultUrl} size={96} />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-medium text-text">Payout link ready</p>
            <p className="m-0 mt-1 break-all font-mono text-xs text-text-muted">{resultUrl}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <CopyButton value={resultUrl} label="Copy link" ariaLabel="Copy payout link" />
              <a
                href={resultUrl}
                className="inline-flex items-center text-sm text-accent no-underline hover:underline"
              >
                Open payout page →
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
