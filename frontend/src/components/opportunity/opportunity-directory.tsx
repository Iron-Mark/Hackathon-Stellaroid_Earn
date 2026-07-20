"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { useFreighterWallet } from "@/hooks/use-freighter-wallet";
import { cn } from "@/lib/utils";
import { formatXlm, statusTone } from "./opportunity-format";
import type { OpportunityRecord } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "candidate", label: "For you" },
  { key: "employer", label: "Created by you" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function shortAddress(address: string) {
  return address.length > 14
    ? `${address.slice(0, 6)}…${address.slice(-6)}`
    : address;
}

export function OpportunityDirectory({
  opportunities,
}: {
  opportunities: OpportunityRecord[];
}) {
  const { wallet } = useFreighterWallet();
  const [filter, setFilter] = useState<FilterKey>("all");

  const connectedAddress =
    wallet.status === "connected" && wallet.address
      ? wallet.address.toUpperCase()
      : null;

  const visible = useMemo(() => {
    if (filter === "all" || !connectedAddress) return opportunities;
    return opportunities.filter((opp) =>
      filter === "candidate"
        ? opp.candidate.toUpperCase() === connectedAddress
        : opp.employer.toUpperCase() === connectedAddress,
    );
  }, [opportunities, filter, connectedAddress]);

  return (
    <div className="flex flex-col gap-5">
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter opportunities"
      >
        {FILTERS.map(({ key, label }) => {
          const disabled = key !== "all" && !connectedAddress;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "min-h-9 rounded-full border px-4 text-[13px] font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2",
                filter === key
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-surface text-text-muted hover:text-text",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {!connectedAddress ? (
        <p className="text-xs text-text-muted">
          Connect a wallet to filter paid trials addressed to you or created by
          you.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-text-muted">
          No opportunities match this filter yet.
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {visible.map((opp) => (
            <li key={opp.id}>
              <Link
                href={`/opportunity/${opp.id}`}
                prefetch={false}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 no-underline transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                      Opportunity #{opp.id}
                    </p>
                    <p className="mt-1 truncate text-lg font-semibold text-text">
                      {opp.title || "Untitled opportunity"}
                    </p>
                  </div>
                  <Badge tone={statusTone(opp.status)} dot>
                    {opp.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
                  <span className="text-text-muted">
                    Amount:{" "}
                    <span className="font-semibold text-text">
                      {formatXlm(opp.amount)}
                    </span>
                  </span>
                  <span className="text-text-muted">
                    Employer:{" "}
                    <code className="font-mono text-xs text-text">
                      {shortAddress(opp.employer)}
                    </code>
                  </span>
                  <span className="text-text-muted">
                    Candidate:{" "}
                    <code className="font-mono text-xs text-text">
                      {shortAddress(opp.candidate)}
                    </code>
                  </span>
                  <span className="text-text-muted">
                    Milestones:{" "}
                    <span className="text-text">
                      {opp.currentMilestone}/{opp.milestoneCount}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
