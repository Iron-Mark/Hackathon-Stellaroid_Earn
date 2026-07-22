"use client";
import { explorerTxUrl, feedbackFormUrl } from "@/lib/start-flow";
import { StepShell } from "./step-shell";

export function SuccessStep({
  txHash,
  address,
  onDoAnother,
}: {
  txHash: string;
  address: string;
  onDoAnother: () => void;
}) {
  return (
    <StepShell stepIndex={5} total={5} title="You did it - it's on-chain">
      <p aria-live="polite" className="text-sm leading-relaxed text-text-muted">
        Your action was signed by your own wallet and recorded on Stellar testnet.
        Anyone can verify it.
      </p>
      <a
        href={explorerTxUrl(txHash)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-text hover:border-primary"
      >
        View your transaction on Stellar Expert
      </a>
      <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-text">Want to be counted?</p>
        <p className="mt-1 text-xs text-text-muted">
          Add your name and a quick rating (about 20 seconds). Your wallet is
          pre-filled.
        </p>
        <a
          href={feedbackFormUrl(address)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:opacity-90"
        >
          Open the 20-second form
        </a>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onDoAnother} className="text-xs text-text-muted underline">
          Do the other action
        </button>
        <a href="/app" className="text-xs text-text-muted underline">
          Open the full app
        </a>
      </div>
    </StepShell>
  );
}
