"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Wallet, Wifi } from "lucide-react";
import { Button, Badge, useToast } from "@/components/ui";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { shortenAddress } from "@/lib/format";
import { appConfig } from "@/lib/config";

interface WalletConnectButtonProps {
  sidebar?: boolean;
}

/** Format a Stellar address as a card number: GCAU •••• •••• IFPT */
function cardFormat(address: string) {
  return `${address.slice(0, 4)} •••• •••• ${address.slice(-4)}`;
}

export function WalletConnectButton({ sidebar = false }: WalletConnectButtonProps) {
  const {
    wallet,
    connectWallet,
    disconnectWallet,
    availableProviders,
    activeProvider,
    providers,
    isMobileBrowser,
  } = useFreighterWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefer the concrete wallet name (e.g. "xBull") when the connection came
  // through the Stellar Wallets Kit aggregator.
  const activeLabel =
    wallet.providerLabel ??
    providers.find((provider) => provider.id === activeProvider)?.label ??
    "wallet";

  function connectLabel(provider: { id: string; label: string }) {
    return provider.id === "swk" ? `${provider.label}…` : `Connect ${provider.label}`;
  }

  function handleCopyAddress() {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    navigator.clipboard.writeText(wallet.address ?? "").catch(() => {});
    setCopied(true);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  useEffect(() => {
    if (wallet.error && wallet.status !== "unsupported") {
      // Closing a wallet picker / WalletConnect QR is a choice, not an error
      // worth an alarming red toast.
      if (/cancel|closed|dismiss/i.test(wallet.error)) return;
      toast({ title: "Wallet error", detail: wallet.error, tone: "danger" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.error]);

  /* ── sidebar: connected ─────────────────────────────────── */
  if (sidebar && wallet.status === "connected" && wallet.address) {
    return (
      <div className="flex flex-col gap-2.5">
        {!wallet.isExpectedNetwork && (
          <Badge tone="warning" dot>Wrong network</Badge>
        )}

        {/* ── Debit card ────────────────────────────────────── */}
        {/* Gradient border wrapper */}
        <div
          className="rounded-2xl p-px"
          style={{ background: "linear-gradient(135deg in oklch, var(--color-primary), var(--color-accent))" }}
        >
          <div
            className="relative overflow-hidden rounded-[15px] p-5 flex flex-col justify-between bg-surface"
            style={{ aspectRatio: "1.586" }}
          >
            {/* Hex grid texture */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <pattern id="hex-card-bg" width="17.32" height="30" patternUnits="userSpaceOnUse">
                  <polygon
                    points="8.66,0 17.32,5 17.32,15 8.66,20 0,15 0,5"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <polygon
                    points="0,15 8.66,20 8.66,30 0,35 -8.66,30 -8.66,20"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hex-card-bg)" />
            </svg>
            {/* Subtle top-left gloss */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)" }}
              aria-hidden="true"
            />
            {/* Amber top hairline */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: "linear-gradient(to right in oklch, transparent, var(--color-primary), transparent)" }}
              aria-hidden="true"
            />

            {/* Top row: chip + contactless + label */}
            <div className="relative flex items-start justify-between">
              {/* EMV chip */}
              <div className="w-9 h-6.5 rounded-[3px] overflow-hidden bg-linear-to-br from-yellow-200 via-yellow-300 to-yellow-500 flex flex-col justify-between p-0.75" aria-hidden="true">
                <div className="flex gap-0.75 items-center">
                  <div className="flex-1 h-px bg-yellow-700/60" />
                  <div className="w-px h-3 bg-yellow-700/60" />
                  <div className="flex-1 h-px bg-yellow-700/60" />
                </div>
                <div className="flex gap-0.75 items-center">
                  <div className="flex-1 h-px bg-yellow-700/60" />
                  <div className="w-px h-3 bg-yellow-700/60" />
                  <div className="flex-1 h-px bg-yellow-700/60" />
                </div>
              </div>
              <button
                type="button"
                onClick={disconnectWallet}
                aria-label={`Disconnect ${activeLabel}`}
                className="flex items-center gap-2 group cursor-pointer"
              >
                <Wifi className="w-4 h-4 -rotate-90 text-text-muted group-hover:text-danger/70 transition-colors" aria-hidden="true" />
                <span className="font-pixel text-[10px] tracking-widest uppercase leading-none text-text-muted group-hover:text-danger transition-colors">
                  {activeLabel}
                </span>
              </button>
            </div>

            {/* Card number (address) — tap to copy */}
            <button
              type="button"
              onClick={handleCopyAddress}
              aria-label={copied ? "Copied!" : "Copy wallet address"}
              className="relative text-left group cursor-pointer"
            >
              <p className="font-pixel text-[9px] uppercase tracking-[0.15em] text-text-muted mb-1.5 flex items-center gap-1.5">
                Wallet address
                {copied ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-success" aria-hidden="true" />
                    <span className="text-success normal-case tracking-normal">Copied</span>
                  </>
                ) : (
                  <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 transition-opacity" aria-hidden="true" />
                )}
              </p>
              <p className="font-mono text-[15px] font-semibold tracking-[0.18em] leading-none text-text">
                {cardFormat(wallet.address)}
              </p>
            </button>

            {/* Bottom row: network label + live dot */}
            <div className="relative flex items-end justify-between">
              <div>
                <p className="font-pixel text-[8px] uppercase tracking-[0.12em] text-text-muted mb-0.5">Network</p>
                <p className="font-pixel text-[10px] uppercase tracking-wider text-primary font-semibold leading-none">
                  Stellar {appConfig.network}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_5px_rgba(134,239,172,0.6)]" aria-hidden="true" />
                <span className="font-pixel text-[9px] uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  /* ── sidebar: disconnected / unsupported / connecting ────── */
  if (sidebar) {
    const isConnecting = wallet.status === "connecting";

    return (
      <div className="flex flex-col gap-2.5">
        {/* Ghost card shell — illustration + prompt */}
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-center bg-surface-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.3)]"
          style={{ aspectRatio: "1.586", padding: "20px" }}
        >
          <img
            src="/illust/illust-wallet-sidebar.svg"
            alt=""
            className="w-full max-w-35 h-auto opacity-80"
            aria-hidden="true"
            style={{ imageRendering: "pixelated" }}
          />
          <div>
            <p className="text-[13px] font-semibold text-text">No wallet connected</p>
            <p className="text-[11px] text-text-muted leading-relaxed mt-0.5 max-w-40">
              Choose a wallet to sign transactions.
            </p>
          </div>
        </div>

        {isConnecting ? (
          <Button variant="primary" size="sm" loading className="w-full">
            Connecting…
          </Button>
        ) : (
          availableProviders.map((provider, index) => (
            <Button
              key={provider.id}
              variant={index === 0 ? "primary" : "secondary"}
              size="sm"
              onClick={() => void connectWallet(provider.id)}
              className="w-full"
            >
              <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
              {connectLabel(provider)}
            </Button>
          ))
        )}

        {isMobileBrowser ? (
          <p className="text-[11px] text-text-muted leading-relaxed">
            {availableProviders.some((provider) => provider.id === "walletconnect")
              ? "On mobile? Use WalletConnect for LOBSTR, xBull and more, or Albedo. Both work in your browser, no extension needed."
              : "On mobile? Albedo signs right in your browser, no extension needed."}
          </p>
        ) : null}
      </div>
    );
  }

  /* ── inline (nav bar) ───────────────────────────────────── */
  if (wallet.status === "connecting") {
    return <Button variant="primary" size="sm" loading>Connecting…</Button>;
  }

  if (wallet.status === "connected" && wallet.address) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {!wallet.isExpectedNetwork && <Badge tone="warning" dot>Wrong network</Badge>}
        <Badge tone="accent" dot>{shortenAddress(wallet.address)}</Badge>
        <Button variant="danger" size="sm" onClick={disconnectWallet}>Disconnect wallet</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {availableProviders.map((provider, index) => (
        <Button
          key={provider.id}
          variant={index === 0 ? "primary" : "secondary"}
          size="sm"
          onClick={() => void connectWallet(provider.id)}
        >
          <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
          {connectLabel(provider)}
        </Button>
      ))}
    </div>
  );
}

export default WalletConnectButton;
