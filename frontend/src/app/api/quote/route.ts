import { NextResponse } from "next/server";
import { getQuote } from "@/lib/quote";
import { createRateLimiter } from "@/lib/rate-limit";

// CDN does the heavy lifting via s-maxage; the limiter only damps direct
// origin abuse on a single instance.
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const CACHE_CONTROL = "s-maxage=60, stale-while-revalidate=300";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function GET(request: Request) {
  if (!limiter.check(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  // getQuote never throws; a null quote is a valid degraded response and the
  // UI hides the peso line rather than erroring.
  const quote = await getQuote("XLM", "PHP");

  return NextResponse.json(
    { quote },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
