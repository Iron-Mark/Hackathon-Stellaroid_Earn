import { appConfig } from "@/lib/config";
import { buildEventsSummary } from "@/lib/event-summary";
import { getRecentEventsCached } from "@/lib/events";
import {
  acquireStreamSlot,
  checkRateLimit,
  getClientId,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const encoder = new TextEncoder();

// Connection-flood guards for this long-lived, unauthenticated endpoint.
const RATE_WINDOW_MS = 60_000;
const MAX_CONNECTS_PER_WINDOW = 20; // new streams per IP per minute
const MAX_STREAMS_PER_IP = 4; // simultaneous open streams per IP
const MAX_STREAMS_GLOBAL = 200; // simultaneous open streams per instance

function streamRejection(message: string, status: number, retryAfterSec: number) {
  return new Response(`event: events-error\ndata: ${JSON.stringify({ error: message })}\n\n`, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/event-stream; charset=utf-8",
      "Retry-After": String(Math.max(1, retryAfterSec)),
    },
  });
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function streamMessage(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timeout = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

export async function GET(request: Request) {
  if (!appConfig.contractId) {
    return new Response(
      `event: events-error\ndata: ${JSON.stringify({ error: "Contract ID not configured." })}\n\n`,
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/event-stream; charset=utf-8",
        },
      },
    );
  }

  // Reject connection floods before pinning any server resources.
  const clientId = getClientId(request.headers);
  const rate = checkRateLimit(
    "events-stream",
    clientId,
    MAX_CONNECTS_PER_WINDOW,
    RATE_WINDOW_MS,
  );
  if (!rate.ok) {
    return streamRejection("Too many stream connections. Retry shortly.", 429, rate.retryAfterSec);
  }

  const releaseSlot = acquireStreamSlot(clientId, MAX_STREAMS_PER_IP, MAX_STREAMS_GLOBAL);
  if (!releaseSlot) {
    return streamRejection("Too many concurrent streams. Retry shortly.", 503, 5);
  }

  const { searchParams } = new URL(request.url);
  const limit = clamp(Number(searchParams.get("limit") ?? "20"), 1, 40);
  const intervalMs = clamp(Number(searchParams.get("intervalMs") ?? "5000"), 5000, 60000);
  const ticks = clamp(Number(searchParams.get("ticks") ?? "3"), 1, 6);

  const stream = new ReadableStream({
    async start(controller) {
      let previousSignature = "";

      controller.enqueue(encoder.encode(": stellaroid-events-stream\nretry: 15000\n\n"));

      try {
        for (let tick = 0; tick < ticks && !request.signal.aborted; tick += 1) {
          try {
            const events = await getRecentEventsCached(appConfig.contractId, limit);
            const summary = buildEventsSummary(events);
            const signature = JSON.stringify(events.map((event) => event.id));
            const eventName = tick === 0 ? "snapshot" : signature === previousSignature ? "heartbeat" : "update";

            controller.enqueue(
              streamMessage(eventName, {
                generatedAt: new Date().toISOString(),
                events: eventName === "heartbeat" ? [] : events,
                summary,
              }),
            );

            previousSignature = signature;
          } catch (err) {
            controller.enqueue(
              streamMessage("events-error", {
                generatedAt: new Date().toISOString(),
                error: err instanceof Error ? err.message : "Failed to fetch events.",
              }),
            );
          }

          if (tick < ticks - 1) {
            await sleep(intervalMs, request.signal);
          }
        }

        if (!request.signal.aborted) {
          controller.enqueue(streamMessage("end", { generatedAt: new Date().toISOString() }));
        }
      } finally {
        releaseSlot();
        try {
          controller.close();
        } catch {
          // The client can close the SSE connection before the bounded stream window ends.
        }
      }
    },
    cancel() {
      // Client disconnected early — free the concurrency slot immediately.
      releaseSlot();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
