import { NextResponse } from "next/server";
import { getRecentEvents } from "@/lib/events";
import { appConfig } from "@/lib/config";

export const revalidate = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, Number(limitParam)), 40) : 20;

  if (!appConfig.contractId) {
    return NextResponse.json(
      { error: "Contract ID not configured." },
      { status: 503 },
    );
  }

  try {
    const events = await getRecentEvents(appConfig.contractId, limit);

    const summary = {
      totalEvents: events.length,
      byKind: events.reduce(
        (acc, e) => {
          acc[e.kind] = (acc[e.kind] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      uniqueProofs: new Set(
        events.filter((e) => e.hashHex).map((e) => e.hashHex),
      ).size,
      uniqueEventRefs: new Set(events.map((e) => e.txHash ?? e.id)).size,
      bySource: events.reduce(
        (acc, e) => {
          acc[e.source] = (acc[e.source] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      latestEvent: events[0]?.ledgerClosedAt ?? null,
      oldestEvent: events[events.length - 1]?.ledgerClosedAt ?? null,
    };

    return NextResponse.json({ events, summary });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch events.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
