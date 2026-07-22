"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { appConfig } from "@/lib/config";
import { formatRelativeTime } from "@/lib/format";
// type-only import — erased at build time, so the stellar-sdk-backed events
// module never enters this client bundle.
import type { RecentActivityItem } from "@/lib/events";
import { kindTag } from "./kind-tag";

// The event feed is a shared, windowed view (latest ~40 contract events), so
// this panel refreshes on a timer instead of per user action; the server
// caches upstream fetches, making the poll cheap.
const REFRESH_INTERVAL_MS = 60_000;

type PanelState =
  | { phase: "loading" }
  | { phase: "ready"; items: RecentActivityItem[] }
  | { phase: "error" };

function itemHref(item: RecentActivityItem): { href: string; internal: boolean } {
  if (item.opportunityId) {
    return { href: `/opportunity/${item.opportunityId}`, internal: true };
  }
  if (item.hashHex) {
    return { href: `/proof/${item.hashHex}`, internal: true };
  }
  return { href: item.externalUrl, internal: false };
}

/**
 * Recent contract events INVOLVING the connected wallet — as signer for
 * escrow/payment events, or as the credential's student/owner for cert
 * events (the contract publishes the subject, not the signer, on those; see
 * the `actor` note in lib/events.ts). Deliberately not titled "your actions".
 */
export function WalletActivity() {
  const { wallet } = useFreighterWallet();
  const [state, setState] = useState<PanelState>({ phase: "loading" });

  const address = wallet.status === "connected" ? wallet.address : null;

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setState({ phase: "loading" });

    async function load(isRefresh: boolean) {
      try {
        const response = await fetch("/api/events?limit=40");
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as { events?: RecentActivityItem[] };
        if (cancelled) return;
        const items = (payload.events ?? [])
          .filter((event) => event.actor === address)
          .slice(0, 6);
        setState({ phase: "ready", items });
      } catch {
        // Keep showing the last good list on a failed background refresh.
        if (!cancelled && !isRefresh) setState({ phase: "error" });
      }
    }

    void load(false);
    const interval = setInterval(() => void load(true), REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address]);

  if (!address) return null;

  return (
    <section
      className="bg-surface border border-border rounded-lg px-5 py-4"
      aria-label="Recent on-chain activity involving your wallet"
    >
      <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted mb-3">
        Activity involving your wallet
      </p>

      {state.phase === "loading" ? (
        <p className="m-0 text-[13px] text-text-muted">Reading the event feed…</p>
      ) : state.phase === "error" ? (
        <p className="m-0 text-[13px] text-text-muted">
          Could not read the event feed right now.
        </p>
      ) : state.items.length === 0 ? (
        <p className="m-0 text-[13px] text-text-muted">
          Nothing involving this wallet in the latest contract events. Recent
          actions can take a minute to index, and older ones scroll out of the
          shared window.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {state.items.map((item) => {
            const { href, internal } = itemHref(item);
            const row = (
              <>
                <span className={kindTag(item.kind)}>{item.label}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-text">
                  {item.detail}
                </span>
                <span className="whitespace-nowrap text-[11px] text-text-muted">
                  {formatRelativeTime(item.ledgerClosedAt)}
                </span>
                {!internal ? (
                  <ExternalLink
                    className="h-3 w-3 shrink-0 text-text-muted"
                    aria-hidden="true"
                  />
                ) : null}
              </>
            );
            const rowClass =
              "flex items-center gap-2 border-b border-border py-2.5 last:border-0 no-underline hover:bg-surface-2/50 rounded-sm";
            return (
              <li key={item.id}>
                {internal ? (
                  <Link href={href} prefetch={false} className={rowClass}>
                    {row}
                  </Link>
                ) : (
                  <a href={href} target="_blank" rel="noreferrer" className={rowClass}>
                    {row}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 mb-0 text-[12px] leading-snug text-text-muted">
        This panel lists events where your wallet is the subject. Credentials
        you issued show on the recipient&apos;s wallet, and everything you
        signed  - issuing, verifying, paying  - is in your full account history.
      </p>

      <a
        href={`${appConfig.explorerUrl}/account/${address}`}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-primary no-underline hover:opacity-80"
      >
        Full account history on stellar.expert
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
        <span className="visually-hidden">(opens in new tab)</span>
      </a>
    </section>
  );
}

export default WalletActivity;
