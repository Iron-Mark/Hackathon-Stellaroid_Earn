// Cross-source event dedup, kept dependency-free (no stellar-sdk import) so
// it can be unit-tested under the Node test runner.

export type MergeableEvent = {
  kind: string;
  detail: string;
  hashHex?: string | null;
  opportunityId?: string | null;
  ledgerClosedAt: string;
  source: string;
};

function eventIdentity(event: MergeableEvent) {
  if (event.hashHex && (event.kind === "cert_reg" || event.kind === "cert_ver")) {
    return `${event.kind}:${event.hashHex}`;
  }

  // The RPC reports ledgerClosedAt as seconds-precision RFC3339
  // ("…T09:20:22Z") while the Stellar Expert path builds millisecond ISO
  // strings ("…T09:20:22.000Z") — the raw strings never match, so compare as
  // epoch time. Escrow kinds key on the stable opportunity id rather than
  // display copy.
  const ts = Date.parse(event.ledgerClosedAt);
  const subject = event.opportunityId ?? event.detail;
  return `${event.kind}:${subject}:${ts}`;
}

export function mergeRecentEvents<T extends MergeableEvent>(
  events: T[],
  limit: number,
): T[] {
  const merged = new Map<string, T>();

  for (const event of events) {
    const key = eventIdentity(event);
    const existing = merged.get(key);

    if (!existing || (existing.source === "stellar_expert" && event.source === "rpc")) {
      merged.set(key, event);
    }
  }

  return Array.from(merged.values())
    .sort(
      (left, right) =>
        new Date(right.ledgerClosedAt).getTime() - new Date(left.ledgerClosedAt).getTime(),
    )
    .slice(0, limit);
}
