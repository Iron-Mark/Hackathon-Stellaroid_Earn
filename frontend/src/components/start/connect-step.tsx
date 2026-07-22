"use client";
import { useEffect } from "react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { StepShell } from "./step-shell";

export function ConnectStep({ onConnected }: { onConnected: () => void }) {
  const { wallet, connectWallet, availableProviders, isMobileBrowser } = useFreighterWallet();

  useEffect(() => {
    if (wallet.status === "connected" && wallet.address) onConnected();
  }, [wallet.status, wallet.address, onConnected]);

  return (
    <StepShell stepIndex={2} total={5} title="Connect a wallet to sign">
      <p className="text-sm leading-relaxed text-text-muted">
        {isMobileBrowser
          ? "On mobile? Use WalletConnect or Albedo, no install needed."
          : "Use the Freighter extension, or Albedo which works in any browser."}
      </p>
      <div className="flex flex-col gap-2.5">
        {availableProviders.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void connectWallet(p.id)}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary ${
              i === 0
                ? "bg-primary text-on-primary"
                : "border border-border text-text"
            }`}
          >
            Connect {p.label}
          </button>
        ))}
      </div>
      {wallet.status === "connecting" && (
        <p aria-live="polite" className="text-xs text-text-muted">
          Opening your wallet...
        </p>
      )}
    </StepShell>
  );
}
