"use client";
import { useState } from "react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { fundTestnetAccount } from "@/lib/friendbot";
import { StepShell } from "./step-shell";

export function FundStep({ onFunded }: { onFunded: () => void }) {
  const { wallet } = useFreighterWallet();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!wallet.isExpectedNetwork) {
    return (
      <StepShell stepIndex={3} total={5} title="Switch your wallet to Testnet">
        <p aria-live="polite" className="text-sm leading-relaxed text-text-muted">
          Your wallet is on a different network. Switch it to Stellar Testnet, then
          come back to this step.
        </p>
      </StepShell>
    );
  }

  async function fund() {
    if (!wallet.address) return;
    setBusy(true);
    setMsg(null);
    const r = await fundTestnetAccount(wallet.address);
    setBusy(false);
    if (r.ok) {
      onFunded();
    } else {
      setMsg(r.message);
    }
  }

  return (
    <StepShell stepIndex={3} total={5} title="Get free testnet XLM">
      <p className="text-sm leading-relaxed text-text-muted">
        We will fund your wallet with free Stellar testnet XLM (no real value) so
        you can pay the tiny network fee. One click.
      </p>
      <button
        type="button"
        onClick={() => void fund()}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
      >
        {busy ? "Funding..." : "Get free testnet XLM"}
      </button>
      <button
        type="button"
        onClick={onFunded}
        className="text-xs text-text-muted underline"
      >
        Already funded? Skip
      </button>
      {msg && (
        <p aria-live="polite" className="text-xs text-danger">
          {msg}
        </p>
      )}
    </StepShell>
  );
}
