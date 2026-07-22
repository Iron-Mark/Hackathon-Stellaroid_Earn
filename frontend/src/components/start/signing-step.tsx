"use client";
import { StepShell } from "./step-shell";

export function SigningStep() {
  return (
    <StepShell stepIndex={5} total={5} title="Sign in your wallet">
      <p aria-live="polite" className="text-sm leading-relaxed text-text-muted">
        Approve the transaction in your wallet, then hang tight while the network
        confirms it (about 5 seconds).
      </p>
      <div
        aria-hidden="true"
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
      </div>
    </StepShell>
  );
}
