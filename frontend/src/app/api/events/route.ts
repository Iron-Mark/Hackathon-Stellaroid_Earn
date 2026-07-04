import { NextResponse } from "next/server";
import { buildEventsSummary } from "@/lib/event-summary";
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
    const summary = buildEventsSummary(events);

    return NextResponse.json({ events, summary });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch events.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
