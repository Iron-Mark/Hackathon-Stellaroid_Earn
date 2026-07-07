import { NextResponse } from "next/server";
import { buildEventsSummary } from "@/lib/event-summary";
import { getRecentEventsCached } from "@/lib/events";
import { appConfig } from "@/lib/config";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

export const revalidate = 30;

const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

export async function GET(request: Request) {
  const rate = checkRateLimit(
    "events",
    getClientId(request.headers),
    MAX_REQUESTS_PER_WINDOW,
    RATE_WINDOW_MS,
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Retry shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

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
    const events = await getRecentEventsCached(appConfig.contractId, limit);
    const summary = buildEventsSummary(events);

    return NextResponse.json({ events, summary });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch events.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
