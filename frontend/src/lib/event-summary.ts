import type { RecentActivityItem } from "./events";

export type EventsSummary = {
  totalEvents: number;
  byKind: Record<string, number>;
  uniqueProofs: number;
  uniqueEventRefs: number;
  bySource: Record<string, number>;
  latestEvent: string | null;
  oldestEvent: string | null;
};

export function buildEventsSummary(events: RecentActivityItem[]): EventsSummary {
  return {
    totalEvents: events.length,
    byKind: events.reduce(
      (acc, event) => {
        acc[event.kind] = (acc[event.kind] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    uniqueProofs: new Set(
      events.filter((event) => event.hashHex).map((event) => event.hashHex),
    ).size,
    uniqueEventRefs: new Set(events.map((event) => event.txHash ?? event.id)).size,
    bySource: events.reduce(
      (acc, event) => {
        acc[event.source] = (acc[event.source] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    latestEvent: events[0]?.ledgerClosedAt ?? null,
    oldestEvent: events[events.length - 1]?.ledgerClosedAt ?? null,
  };
}
