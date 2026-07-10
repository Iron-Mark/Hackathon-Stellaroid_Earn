"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { formatRelativeTime } from "@/lib/format";
// type-only import — erased at build time, so the stellar-sdk-backed events
// module never enters this client bundle.
import type { RecentActivityItem } from "@/lib/events";
import { kindTag } from "./kind-tag";

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
 * "Your recent activity" — the connected wallet's own on-chain actions,
 * derived from the same public event feed as /status and filtered by the
 * event's signing address. Pilot feedback asked for exactly this.
 */
export function WalletActivity() {
  const { wallet } = useFreighterWallet();
  const [state, setState] = useState<PanelState>({ phase: "loading" });

  const address = wallet.status === "connected" ? wallet.address : null;

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setState({ phase: "loading" });

    fetch("/api/events?limit=40")
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const payload = (await response.json()) as { events?: RecentActivityItem[] };
        if (cancelled) return;
        const items = (payload.events ?? [])
          .filter((event) => event.actor === address)
          .slice(0, 6);
        setState({ phase: "ready", items });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!address) return null;

  return (
    <section
      className="bg-surface border border-border rounded-lg px-5 py-4"
      aria-label="Your recent on-chain activity"
    >
      <p className="font-pixel text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-muted mb-3">
        Your recent activity
      </p>

      {state.phase === "loading" ? (
        <p className="m-0 text-[13px] text-text-muted">Reading the event feed…</p>
      ) : state.phase === "error" ? (
        <p className="m-0 text-[13px] text-text-muted">
          Could not read the event feed right now.
        </p>
      ) : state.items.length === 0 ? (
        <p className="m-0 text-[13px] text-text-muted">
          No on-chain actions from this wallet in the recent event window yet.
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
    </section>
  );
}

export default WalletActivity;
