"use client";

import { useEffect, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import type { EventsSummary } from "@/lib/event-summary";

type StreamState = "connecting" | "live" | "idle" | "degraded";

type StreamPayload = {
  generatedAt?: string;
  events?: unknown[];
  summary?: EventsSummary;
  error?: string;
};

export function LiveEventsStream({
  initialSummary,
}: {
  initialSummary: EventsSummary;
}) {
  const [state, setState] = useState<StreamState>("connecting");
  const [summary, setSummary] = useState(initialSummary);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      setState("idle");
      return;
    }

    const source = new EventSource("/api/events/stream?limit=20");

    function handlePayload(event: MessageEvent<string>) {
      const payload = JSON.parse(event.data) as StreamPayload;
      if (payload.summary) setSummary(payload.summary);
      if (payload.generatedAt) setLastUpdate(payload.generatedAt);
      setError(null);
      setState("live");
    }

    source.addEventListener("snapshot", handlePayload);
    source.addEventListener("update", handlePayload);
    source.addEventListener("heartbeat", handlePayload);
    source.addEventListener("events-error", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as StreamPayload;
      setError(payload.error ?? "Event stream is degraded.");
      setLastUpdate(payload.generatedAt ?? new Date().toISOString());
      setState("degraded");
    });
    source.addEventListener("end", (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as StreamPayload;
      setLastUpdate(payload.generatedAt ?? new Date().toISOString());
      setState((current) => (current === "degraded" ? "degraded" : "idle"));
      source.close();
    });
    source.onerror = () => {
      setState("degraded");
      setError("Live stream connection dropped.");
      source.close();
    };

    return () => source.close();
  }, []);

  const stateLabel =
    state === "live"
      ? "Live"
      : state === "connecting"
        ? "Connecting"
        : state === "degraded"
          ? "Degraded"
          : "Snapshot";

  return (
    <div className="mt-5 rounded-lg border border-border bg-bg px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio
            className={`size-4 ${state === "degraded" ? "text-amber-300" : "text-primary"}`}
            aria-hidden="true"
          />
          <p className="m-0 font-pixel text-[10px] uppercase tracking-widest text-text-muted">
            Event stream
          </p>
        </div>
        <span
          className={`rounded border px-2 py-1 font-pixel text-[9px] uppercase tracking-wider ${
            state === "degraded"
              ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {stateLabel}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="m-0 text-xs text-text-muted">Streamed events</p>
          <p className="m-0 mt-1 font-heading text-xl font-bold text-text">
            {summary.totalEvents}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs text-text-muted">RPC source</p>
          <p className="m-0 mt-1 font-heading text-xl font-bold text-text">
            {summary.bySource.rpc ?? 0}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs text-text-muted">Indexer source</p>
          <p className="m-0 mt-1 font-heading text-xl font-bold text-text">
            {summary.bySource.stellar_expert ?? 0}
          </p>
        </div>
      </div>
      <p className="m-0 mt-3 flex flex-wrap items-center gap-2 text-xs leading-relaxed text-text-muted">
        <RefreshCw className="size-3.5" aria-hidden="true" />
        {lastUpdate ? `Updated ${new Date(lastUpdate).toLocaleTimeString()}` : "Waiting for the first event snapshot"}
      </p>
      {error ? (
        <p className="m-0 mt-2 text-xs leading-relaxed text-amber-200">{error}</p>
      ) : null}
    </div>
  );
}
