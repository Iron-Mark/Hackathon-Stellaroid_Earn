"use client";
import { StepShell } from "./step-shell";

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <StepShell stepIndex={1} total={5} title="Do something real on Stellar in ~60 seconds">
      <p className="text-sm leading-relaxed text-text-muted">
        Free, no signup, testnet only. Connect a wallet, we fund it for you, then
        you sign one real on-chain action. Every amount is Stellar testnet XLM with
        no real-world value.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
      >
        Start
      </button>
    </StepShell>
  );
}
