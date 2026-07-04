import { appConfig } from "@/lib/config";
import { buildEventsSummary } from "@/lib/event-summary";
import { getRecentEvents } from "@/lib/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const encoder = new TextEncoder();

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

  const { searchParams } = new URL(request.url);
  const limit = clamp(Number(searchParams.get("limit") ?? "20"), 1, 40);
  const intervalMs = clamp(Number(searchParams.get("intervalMs") ?? "5000"), 5000, 60000);
  const ticks = clamp(Number(searchParams.get("ticks") ?? "3"), 1, 12);

  const stream = new ReadableStream({
    async start(controller) {
      let previousSignature = "";

      controller.enqueue(encoder.encode(": stellaroid-events-stream\nretry: 15000\n\n"));

      for (let tick = 0; tick < ticks && !request.signal.aborted; tick += 1) {
        try {
          const events = await getRecentEvents(appConfig.contractId, limit);
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

      try {
        controller.close();
      } catch {
        // The client can close the SSE connection before the bounded stream window ends.
      }
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
