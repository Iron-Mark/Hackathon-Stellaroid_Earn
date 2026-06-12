"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type QuotePayload = {
  quote: {
    price: number;
    asOf: string;
    source: "pdax-staging" | "coingecko" | "cache";
    stale: boolean;
  } | null;
};

export interface FiatValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Amount in XLM (display units, not stroops). */
  amount: number | string;
}

const pesoFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatAsOf(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Renders the approximate peso value of an XLM amount with an honest
 * freshness label. Hides itself entirely when no quote is available —
 * the page must never error or block on the peso line.
 */
export function FiatValue({ amount, className, ...props }: FiatValueProps) {
  const [payload, setPayload] = React.useState<QuotePayload | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/quote")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: QuotePayload | null) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setPayload({ quote: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const quote = payload?.quote ?? null;
  const xlm = Number(amount);
  if (!quote || !Number.isFinite(xlm)) return null;

  const asOf = formatAsOf(quote.asOf);

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-2 text-sm text-text-muted",
        className,
      )}
      aria-live="polite"
      {...props}
    >
      <span className="font-medium text-text">
        ≈ {pesoFormat.format(xlm * quote.price)}
      </span>
      {asOf && <span className="text-xs">as of {asOf}</span>}
      {quote.stale && (
        <Badge tone="warning" aria-label="Price data is stale">
          stale
        </Badge>
      )}
    </span>
  );
}
